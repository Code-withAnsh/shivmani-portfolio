import { useEffect, useRef, useState } from 'react';

// Gold ring that trails the mouse and grows over links and buttons. Skipped on touch screens.
export default function CursorRing() {
  const ringRef = useRef(null);
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let raf = 0;

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setActive(true);
      setHover(Boolean(e.target.closest?.('a, button')));
    };
    const onLeave = () => setActive(false);

    const tick = () => {
      if (document.documentElement.classList.contains('past-stage')) {
        raf = requestAnimationFrame(tick);
        return;
      }
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      className={`cursor ${active ? 'cursor--on' : ''} ${hover ? 'cursor--hover' : ''}`}
      aria-hidden="true"
    />
  );
}
