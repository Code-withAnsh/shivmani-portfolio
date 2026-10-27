import { useEffect, useRef } from 'react';
import './TechPreview.css';

const pad = (n) => String(n).padStart(2, '0');

// Hover preview for the tech stack, in the style of a reel list: a tall panel reveals from the bottom and follows the pointer,
// with a little tilt from its speed. The panel shows the category when a category is hovered, and the tool when a card is hovered.
// On phones (no hover) it docks at the bottom of the screen instead, and TechStack picks the row that is in view.
export default function TechPreview({ active, mode }) {
  const ref = useRef(null);
  const lastRef = useRef(null);
  if (active) lastRef.current = active; // keep the last content while the panel slides away
  const shown = lastRef.current;

  useEffect(() => {
    if (mode !== 'float') return undefined;
    const el = ref.current;
    const pos = { x: -999, y: -999, tx: -999, ty: -999, vx: 0 };
    const onMove = (e) => {
      pos.tx = e.clientX;
      pos.ty = e.clientY;
    };
    let raf = 0;
    const loop = () => {
      const px = pos.x;
      pos.x += (pos.tx - pos.x) * 0.18;
      pos.y += (pos.ty - pos.y) * 0.18;
      pos.vx += ((pos.x - px) - pos.vx) * 0.2;
      const tilt = Math.max(-7, Math.min(7, pos.vx * 0.9));
      el.style.transform = `translate3d(${pos.x + 36}px, ${pos.y}px, 0) translate(-50%, -50%) rotate(${tilt.toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  const group = shown?.group;
  const item = shown?.item;

  return (
    <div ref={ref} className={`tprev tprev--${mode} ${active ? 'is-on' : ''}`} aria-hidden="true">
      {group && (
        <div
          key={item ? `i-${item.id}` : `g-${group.id}`}
          className="tprev__panel"
          style={{ '--g1': group.bg[0], '--g2': group.bg[1], '--c': item ? item.color : group.tint }}
        >
          {item ? (
            <>
              <span className="tprev__no">{group.name} · {item.name}</span>
              <svg className="tprev__logo" viewBox="0 0 24 24"><path d={item.path} /></svg>
              <div>
                <b className="tprev__name">{item.head}</b>
                <p className="tprev__text">{item.body}</p>
              </div>
            </>
          ) : (
            <>
              <span className="tprev__no">{group.name} · {pad(group.items.length)} tools</span>
              <div className="tprev__grid">
                {group.items.map((it) => (
                  <svg key={it.id} viewBox="0 0 24 24" style={{ fill: it.color }}><path d={it.path} /></svg>
                ))}
              </div>
              <b className="tprev__name">{group.sub}</b>
            </>
          )}
        </div>
      )}
    </div>
  );
}
