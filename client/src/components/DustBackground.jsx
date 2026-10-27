import { useEffect, useRef } from 'react';

// Dusty backdrop for the hold screen: warm haze, film grain and drifting dust motes.
// The dust behaves like sand: the pointer pushes it aside (leoparpeix), and while the button is held
// it gets pulled into a slow vortex around the button. `holdRef.current` is the hold progress, 0..1.
export default function DustBackground({ holdRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let raf = 0;
    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      pointer.vx = e.clientX - pointer.x;
      pointer.vy = e.clientY - pointer.y;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove);

    // Depth sets size, speed and brightness, so the layers feel parallaxed. Positions are in pixels.
    const motes = Array.from({ length: 260 }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        ox: 0,
        oy: 0,
        depth,
        r: 0.5 + depth * 2.4,
        vx: 3 + depth * 9,
        vy: -2 - depth * 5,
        a: 0.14 + depth * 0.45,
        phase: Math.random() * Math.PI * 2,
      };
    });

    let last = performance.now();
    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const hold = holdRef?.current || 0;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      for (const m of motes) {
        // Ambient drift
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        // Pointer pushes sand aside, nearer motes (higher depth) move more
        const dx = m.x - pointer.x;
        const dy = m.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 160 * 160) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 160) * (0.6 + m.depth);
          m.ox += (dx / d) * f * 90 * dt + pointer.vx * f * 0.05;
          m.oy += (dy / d) * f * 90 * dt + pointer.vy * f * 0.05;
        }

        // Holding: swirl around the button and tighten toward it
        if (hold > 0) {
          const rx = m.x - cx;
          const ry = m.y - cy;
          const rd = Math.sqrt(rx * rx + ry * ry) || 1;
          m.ox += (-ry / rd) * hold * 160 * dt - (rx / rd) * hold * 70 * dt * (rd > 90 ? 1 : 0);
          m.oy += (rx / rd) * hold * 160 * dt - (ry / rd) * hold * 70 * dt * (rd > 90 ? 1 : 0);
        }

        // Offsets decay so the sand settles back
        m.x += m.ox * dt * 6;
        m.y += m.oy * dt * 6;
        m.ox *= 1 - Math.min(dt * 2.4, 1);
        m.oy *= 1 - Math.min(dt * 2.4, 1);

        if (m.x > w + 10) m.x = -10;
        if (m.x < -10) m.x = w + 10;
        if (m.y < -10) m.y = h + 10;
        if (m.y > h + 10) m.y = -10;

        const twinkle = 0.7 + 0.3 * Math.sin(now / 1200 + m.phase);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 232, 196, ${Math.min(1, (m.a + hold * 0.25) * twinkle)})`;
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [holdRef]);

  return (
    <div className="dust" aria-hidden="true">
      <div className="dust__haze" />
      <div className="dust__grain" />
      <canvas ref={canvasRef} className="dust__motes" />
      <div className="dust__vignette" />
    </div>
  );
}
