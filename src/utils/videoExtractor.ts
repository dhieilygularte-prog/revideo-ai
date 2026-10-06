/**
 * Extract frames and duration from a video file or URL in the browser
 */
export async function extractFramesFromVideo(
  videoSource: File | string,
  targetFrameCount = 5
): Promise<{ duration: number; frames: string[] }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let videoUrl = '';
    if (typeof videoSource === 'string') {
      videoUrl = videoSource;
    } else {
      videoUrl = URL.createObjectURL(videoSource);
    }
    video.src = videoUrl;

    const cleanup = () => {
      if (typeof videoSource !== 'string' && videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };

    video.onloadedmetadata = async () => {
      const duration = Math.max(1, Math.round(video.duration || 16));
      const frames: string[] = [];

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Target 9:16 or original ratio scaled reasonably for AI analysis
        const width = 480;
        const height = Math.round((video.videoHeight / video.videoWidth) * width) || 854;
        canvas.width = width;
        canvas.height = height;

        // Calculate time points: e.g. for 16s, grab at 1s, 5s, 9s, 13s, 15s
        const step = duration / (targetFrameCount + 1);
        const timePoints: number[] = [];
        for (let i = 1; i <= targetFrameCount; i++) {
          timePoints.push(Math.min(duration - 0.5, Math.max(0.5, i * step)));
        }

        for (const time of timePoints) {
          await seekToTime(video, time);
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            // Draw a subtle timestamp badge on bottom
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(10, height - 32, 70, 22);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            ctx.fillText(`${time.toFixed(1)}s`, 20, height - 16);
            frames.push(canvas.toDataURL('image/jpeg', 0.82));
          }
        }

        cleanup();
        resolve({ duration, frames });
      } catch (err) {
        cleanup();
        console.warn('Could not extract video frames directly, returning duration:', err);
        resolve({ duration, frames: [] });
      }
    };

    video.onerror = (e) => {
      cleanup();
      console.warn('Error loading video element:', e);
      resolve({ duration: 16, frames: [] });
    };

    // Timeout safety
    setTimeout(() => {
      if (video.readyState < 1) {
        cleanup();
        resolve({ duration: 16, frames: [] });
      }
    }, 12000);
  });
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked);
      resolve();
    };
    video.addEventListener('seeked', handleSeeked);
    video.currentTime = time;
  });
}
