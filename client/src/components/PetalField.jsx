import { useEffect, useRef } from 'react';

// Slow falling rose petals, continuing the petals seen in the video.
export default function PetalField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let raf = 0;

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

    const colors = ['#e8788f', '#f2a1b1', '#d9627c', '#f7c1cb'];
    const petals = Array.from({ length: 26 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      size: 6 + Math.random() * 7,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 1.2,
      fall: 16 + Math.random() * 26,
      sway: 18 + Math.random() * 30,
      swaySpeed: 0.4 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      color: colors[i % colors.length],
      alpha: 0.55 + Math.random() * 0.4,
    }));

    const drawPetal = (p, px, py) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size, -p.size * 0.6, p.size * 0.8, p.size * 0.7, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.7, -p.size, -p.size * 0.6, 0, -p.size);
      ctx.fill();
      ctx.restore();
    };

    let last = performance.now();
    const draw = (now) => {
      if (document.documentElement.classList.contains('past-stage')) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.y += (p.fall * dt) / h;
        p.rot += p.spin * dt;
        if (p.y > 1.05) {
          p.y = -0.05;
          p.x = Math.random();
        }
        const px = p.x * w + Math.sin(now / 1000 * p.swaySpeed + p.phase) * p.sway;
        drawPetal(p, px, p.y * h);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="petals" aria-hidden="true" />;
}
