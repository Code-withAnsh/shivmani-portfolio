// Small WebAudio helpers: no audio files needed, the hold sound is synthesized.
let ctx = null;
let drone = null;

// Must be called from a user gesture (pointerdown) so browsers allow audio.
export function unlockAudio() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

// Dark ambient drone: low detuned saw + triangle through a slowly moving lowpass.
// Plays while the user holds the button, then fades out as the video starts.
export function startDrone() {
  if (!ctx || drone) return;
  const now = ctx.currentTime;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 1.5);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 260;
  filter.Q.value = 4;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 120;
  lfo.connect(lfoGain).connect(filter.frequency);

  const oscs = [
    { f: 55, type: 'sawtooth' },
    { f: 55.4, type: 'sawtooth' },
    { f: 82.5, type: 'triangle' },
  ].map(({ f, type }) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.connect(filter);
    return o;
  });

  filter.connect(gain).connect(ctx.destination);
  const nodes = [lfo, ...oscs];
  nodes.forEach((n) => n.start());
  drone = { gain, nodes };
}

// Whoosh when a title plate flies in: band-passed noise sweeping up, then fading out.
export function playWhoosh(duration = 0.75) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.4;
  filter.frequency.setValueAtTime(350, now);
  filter.frequency.exponentialRampToValueAtTime(2600, now + duration * 0.55);
  filter.frequency.exponentialRampToValueAtTime(500, now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.28, now + duration * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
}

// Deep impact when a plate lands in the center: a falling sine thump plus a short low noise burst.
export function playImpact() {
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(38, now + 0.5);
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.55, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc.connect(oscGain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.65);

  const length = Math.floor(ctx.sampleRate * 0.3);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 700;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  noise.connect(low).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
}

export function stopDrone(fadeSeconds = 0.8) {
  if (!ctx || !drone) return;
  const { gain, nodes } = drone;
  drone = null;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
  nodes.forEach((n) => n.stop(now + fadeSeconds + 0.1));
}
