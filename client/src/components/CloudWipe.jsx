import { useEffect, useRef } from 'react';

const CLOSE_S = 0.9; // clouds rush in and cover the screen
const OPEN_S = 2.2; // clouds part and drift away, revealing the video

const ease = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v) => Math.min(1, Math.max(0, v));

// Soft volumetric clouds drawn from many overlapping radial puffs (not flat cartoon shapes).
// Phase 'close' brings them in from the edges. When fully closed it calls onClosed(); the parent
// swaps the dust screen for the video underneath, then calls with phase 'open' to part them.
export default function CloudWipe({ phase, onClosed, onDone }) {
  const canvasRef = useRef(null);
  const puffsRef = useRef(null);
  const stateRef = useRef({ phase, openAt: 0 });

  useEffect(() => {
    stateRef.current.phase = phase;
    if (phase === 'open') stateRef.current.openAt = performance.now();
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Three depth layers of clouds. Each puff has a covering position (rest) and an exit direction.
    const puffs = [];
    const layers = [
      { n: 26, size: 0.3, tone: [255, 244, 232] },
      { n: 22, size: 0.22, tone: [255, 226, 200] },
      { n: 18, size: 0.17, tone: [238, 205, 190] },
    ];
    layers.forEach((layer, li) => {
      for (let i = 0; i < layer.n; i++) {
        const rest = { x: Math.random() * w, y: Math.random() * h };
        const side = rest.x < w / 2 ? -1 : 1;
        puffs.push({
          rest,
          side,
          r: (layer.size + Math.random() * 0.12) * Math.max(w, h) * 0.5,
          tone: layer.tone,
          li,
          delay: Math.random() * 0.25,
          flat: 0.55 + Math.random() * 0.25,
        });
      }
    });
    puffsRef.current = puffs;

    let raf = 0;
    const start = performance.now();
    let closedFired = false;
    let doneFired = false;

    const draw = (now) => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, w, h);

      let enter;
      let leave = 0;
      if (s.phase === 'close') {
        enter = clamp((now - start) / 1000 / CLOSE_S);
      } else {
        enter = 1;
        leave = clamp((now - s.openAt) / 1000 / OPEN_S);
      }

      if (s.phase === 'close' && enter >= 1 && !closedFired) {
        closedFired = true;
        onClosed?.();
      }

      for (const p of puffs) {
        const e = ease(clamp((enter - p.delay) / (1 - p.delay)));
        const l = ease(clamp((leave - p.delay * 0.5) / (1 - p.delay * 0.5)));
        // Enter from beyond the left/right edge, leave toward it, nearer layers move farther
        const travel = (w * 0.7 + p.r) * (1 + p.li * 0.25);
        const x = p.rest.x + p.side * travel * (1 - e) + p.side * travel * l;
        const y = p.rest.y - l * h * 0.12 * (p.li + 1);
        const alpha = (0.55 + p.li * 0.12) * (1 - Math.max(0, l - 0.6) / 0.4);
        if (alpha <= 0) continue;
        const [r, g, b] = p.tone;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, p.flat);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.55, `rgba(${r},${g},${b},${alpha * 0.55})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (s.phase === 'open' && leave >= 1 && !doneFired) {
        doneFired = true;
        onDone?.();
        return;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="clouds" aria-hidden="true" />;
}
