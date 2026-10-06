/**
 * Web Audio API alarm sound generator.
 * Produces a clear, loud, three-burst chime/bell notification
 * to alert the user when video cloning processing completes.
 */
export function playCompletionSound(repeats: number = 3) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Play a dual-tone bell chime with rich harmonics
    const playChimeBurst = (startTime: number) => {
      // Primary note: High E (659.25 Hz) + harmonic B (987.77 Hz)
      const freqs = [659.25, 987.77, 1318.51];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // Loud initial attack with musical exponential decay
        const peakGain = idx === 0 ? 0.45 : 0.25;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    };

    // Trigger audio context resume if needed (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Play 3 times with 0.8s spacing between bursts
    for (let i = 0; i < repeats; i++) {
      playChimeBurst(ctx.currentTime + i * 0.85);
    }
  } catch (err) {
    console.warn('Audio alert could not be played:', err);
  }
}
