/**
 * Synthesizes a crisp, friendly, high-quality audio chime using the Web Audio API.
 * Works 100% offline and online without external audio file dependencies.
 */
export function playPendingAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Professional 3-tone notification chord: E5 (659.25Hz) -> G#5 (830.61Hz) -> B5 (987.77Hz)
    const tones = [
      { freq: 659.25, time: 0.00, dur: 0.35, gain: 0.22 },
      { freq: 830.61, time: 0.11, dur: 0.35, gain: 0.22 },
      { freq: 987.77, time: 0.22, dur: 0.50, gain: 0.26 },
    ];

    tones.forEach(({ freq, time, dur, gain: targetGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      // Smooth attack & exponential decay
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur + 0.05);
    });
  } catch (err) {
    console.warn('[Audio] Failed to play alert sound:', err);
  }
}
