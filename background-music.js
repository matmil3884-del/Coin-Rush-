/* Coin Rush original procedural synth soundtrack — no external audio files required. */
(() => {
  const controls = document.querySelector('.controls');
  if (!controls) return;
  const button = document.createElement('button');
  button.id = 'musicToggle';
  button.type = 'button';
  button.textContent = '🎵 MUSIC: OFF';
  button.setAttribute('aria-pressed', 'false');
  button.title = 'Toggle background music';
  controls.appendChild(button);
  let ctx = null, master = null, timer = null, playing = false, step = 0;
  const melody = [523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,880,783.99,659.25,587.33];
  function note(freq, when, duration, type, volume) {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain); gain.connect(master);
    osc.start(when); osc.stop(when + duration + 0.04);
  }
  function tick() {
    if (!playing || !ctx) return;
    const now = ctx.currentTime + 0.03, f = melody[step % melody.length];
    note(f, now, 0.22, 'triangle', 0.13);
    if (step % 4 === 0) note(f / 2, now, 0.32, 'sine', 0.09);
    if (step % 2 === 1) note(f * 1.5, now, 0.11, 'sine', 0.025);
    step++;
  }
  async function start() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) { button.textContent = '🎵 MUSIC UNAVAILABLE'; return; }
    if (!ctx) {
      ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = 0.24; master.connect(ctx.destination);
    }
    await ctx.resume(); playing = true; tick(); timer = window.setInterval(tick, 260);
    button.textContent = '🎵 MUSIC: ON'; button.setAttribute('aria-pressed', 'true');
  }
  function stop() {
    playing = false; if (timer) window.clearInterval(timer); timer = null;
    if (ctx && ctx.state === 'running') ctx.suspend();
    button.textContent = '🎵 MUSIC: OFF'; button.setAttribute('aria-pressed', 'false');
  }
  button.addEventListener('click', () => { if (playing) stop(); else start().catch(() => { button.textContent = '🎵 TAP TO ENABLE'; }); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { if (timer) clearInterval(timer); timer = null; if (ctx) ctx.suspend(); } else if (!document.hidden && playing && ctx) { ctx.resume(); tick(); timer = window.setInterval(tick, 260); } });
})();