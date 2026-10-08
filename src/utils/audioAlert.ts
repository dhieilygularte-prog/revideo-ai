/**
 * Completion notification sound player.
 * Plays the custom notification sound (public/notification.mp3) when image/video generation completes.
 * Falls back to Web Audio API synthesized chime if the audio file fails to load or play.
 */
let cachedAudio: HTMLAudioElement | null = null;

export function playCompletionSound(_repeats: number = 1) {
  try {
    if (!cachedAudio) {
      cachedAudio = new Audio('/notification.mp3');
      cachedAudio.volume = 0.9;
    }

    // Reset playback position if previously played
    cachedAudio.currentTime = 0;

    const playPromise = cachedAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('HTML Audio play failed or blocked by autoplay policy, falling back to Web Audio:', err);
        playFallbackChime();
      });
    }
  } catch (err) {
    console.warn('Audio alert could not be played via HTMLAudio, falling back:', err);
    playFallbackChime();
  }
}

function playFallbackChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const freqs = [659.25, 987.77, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const peakGain = idx === 0 ? 0.45 : 0.25;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    });
  } catch (err) {
    console.warn('Fallback audio alert could not be played:', err);
  }
}

