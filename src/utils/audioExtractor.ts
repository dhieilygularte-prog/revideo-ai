/**
 * Extracts audio track from a video File using Web Audio API
 * and converts to a base64-encoded mono 16kHz WAV file.
 */
export async function extractAudioFromVideoFile(
  videoFile: File,
  maxDurationSeconds: number = 40
): Promise<{ hasAudio: boolean; audioBase64?: string }> {
  try {
    const arrayBuffer = await videoFile.slice(0, 50 * 1024 * 1024).arrayBuffer();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return { hasAudio: false };

    const audioCtx = new AudioCtx();
    let decodedBuffer: AudioBuffer;

    try {
      decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      await audioCtx.close();
      return { hasAudio: false };
    }

    const duration = Math.min(maxDurationSeconds, decodedBuffer.duration);
    if (duration < 0.5) {
      await audioCtx.close();
      return { hasAudio: false };
    }

    // Target: Mono, 16kHz sample rate (optimal for Gemini 2.5 Flash / 3.5 Transcribe)
    const targetSampleRate = 16000;
    const targetLength = Math.floor(duration * targetSampleRate);
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0, 0, duration);

    const renderedBuffer = await offlineCtx.startRendering();
    await audioCtx.close();

    const channelData = renderedBuffer.getChannelData(0);

    // Check if audio has energy/sound (not silent)
    let sumSquares = 0;
    for (let i = 0; i < channelData.length; i += 20) {
      sumSquares += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sumSquares / (channelData.length / 20));
    if (rms < 0.005) {
      // Audio is basically silent or mute
      return { hasAudio: false };
    }

    // Encode to WAV format (16-bit PCM)
    const wavBytes = encodeWAV(channelData, targetSampleRate);
    const base64 = bytesToBase64(wavBytes);

    return {
      hasAudio: true,
      audioBase64: `data:audio/wav;base64,${base64}`,
    };
  } catch (err) {
    console.warn('Erro ao extrair áudio do vídeo:', err);
    return { hasAudio: false };
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}
