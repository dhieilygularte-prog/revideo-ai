import { ExtractedFrame } from '../types';

/**
 * Extracts 1 frame per second (with max 768px on longest side in JPEG)
 * and detects fast scene cuts to extract transition frames 0.3s before/after.
 */
export async function extractVideoFrames(
  videoFile: File,
  onProgress?: (current: number, total: number) => void
): Promise<{ duration: number; frames: ExtractedFrame[] }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const fileUrl = URL.createObjectURL(videoFile);
    video.src = fileUrl;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || isNaN(duration)) {
        URL.revokeObjectURL(fileUrl);
        reject(new Error('Não foi possível ler a duração do vídeo.'));
        return;
      }

      const totalSeconds = Math.min(40, Math.ceil(duration));
      const targetTimes: number[] = [];

      // t = 0.2s for first frame, then 1, 2, 3, ... up to duration
      targetTimes.push(0.2);
      for (let sec = 1; sec < totalSeconds; sec++) {
        targetTimes.push(sec);
      }
      if (duration > 0.5 && !targetTimes.includes(Math.floor(duration))) {
        targetTimes.push(Math.max(0.5, duration - 0.2));
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        URL.revokeObjectURL(fileUrl);
        reject(new Error('Canvas context não suportado.'));
        return;
      }

      // Calculate scaled dimensions (max 768px on longest side)
      let w = video.videoWidth || 720;
      let h = video.videoHeight || 1280;
      const maxSide = 768;
      if (w > maxSide || h > maxSide) {
        if (w > h) {
          h = Math.round((h * maxSide) / w);
          w = maxSide;
        } else {
          w = Math.round((w * maxSide) / h);
          h = maxSide;
        }
      }
      canvas.width = w;
      canvas.height = h;

      const frames: ExtractedFrame[] = [];
      let prevImageData: ImageData | null = null;
      const cutTimestamps: number[] = [];

      // Helper to capture a specific time with proper compositor synchronization
      const captureFrameAt = async (time: number, isCut = false): Promise<ExtractedFrame> => {
        return new Promise((res) => {
          let timeoutId: any = null;

          const finishCapture = () => {
            if (timeoutId) clearTimeout(timeoutId);
            video.removeEventListener('seeked', onSeeked);

            try {
              ctx.drawImage(video, 0, 0, w, h);
            } catch (drawErr) {
              console.warn('Erro ao desenhar frame no canvas:', drawErr);
            }

            // Cut detection between consecutive main frames
            if (!isCut) {
              try {
                const currentImgData = ctx.getImageData(0, 0, Math.min(w, 80), Math.min(h, 80));
                if (prevImageData) {
                  let diff = 0;
                  const len = currentImgData.data.length;
                  // Sample every 4th pixel for speed
                  for (let i = 0; i < len; i += 16) {
                    diff += Math.abs(currentImgData.data[i] - prevImageData.data[i]);
                    diff += Math.abs(currentImgData.data[i + 1] - prevImageData.data[i + 1]);
                    diff += Math.abs(currentImgData.data[i + 2] - prevImageData.data[i + 2]);
                  }
                  const avgDiff = diff / (len / 16);
                  if (avgDiff > 42) {
                    cutTimestamps.push(time);
                  }
                }
                prevImageData = currentImgData;
              } catch (e) {
                // ignore
              }
            }

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            res({
              time: Number(time.toFixed(1)),
              dataUrl,
              isCutTransition: isCut,
            });
          };

          const onSeeked = () => {
            if ('requestVideoFrameCallback' in video) {
              (video as any).requestVideoFrameCallback(() => finishCapture());
            } else {
              setTimeout(finishCapture, 25);
            }
          };

          video.addEventListener('seeked', onSeeked);
          timeoutId = setTimeout(finishCapture, 1200);
          video.currentTime = Math.min(Math.max(0, time), Math.max(0, duration - 0.05));
        });
      };

      try {
        // Step 1: Capture regular 1s interval frames
        for (let i = 0; i < targetTimes.length; i++) {
          const t = targetTimes[i];
          if (onProgress) onProgress(i + 1, targetTimes.length);
          const frame = await captureFrameAt(t, false);
          frames.push(frame);
        }

        // Step 2: Capture transition frames 0.3s before/after detected cuts
        for (const cutTime of cutTimestamps) {
          const beforeTime = Math.max(0.1, cutTime - 0.3);
          const afterTime = Math.min(duration - 0.1, cutTime + 0.3);

          if (!frames.some((f) => Math.abs(f.time - beforeTime) < 0.2)) {
            const cutBefore = await captureFrameAt(beforeTime, true);
            frames.push(cutBefore);
          }
          if (!frames.some((f) => Math.abs(f.time - afterTime) < 0.2)) {
            const cutAfter = await captureFrameAt(afterTime, true);
            frames.push(cutAfter);
          }
        }

        // Sort chronologically
        frames.sort((a, b) => a.time - b.time);

        URL.revokeObjectURL(fileUrl);
        resolve({ duration, frames });
      } catch (err) {
        URL.revokeObjectURL(fileUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      reject(new Error('Erro ao carregar o arquivo de vídeo no navegador.'));
    };
  });
}
