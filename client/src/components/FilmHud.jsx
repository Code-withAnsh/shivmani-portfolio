import { useEffect, useRef } from 'react';
import { PLATES, START, STEP, DUR } from '../lib/titles.js';
import { scrambleTo } from '../lib/scramble.js';

const FPS = 24;
const REEL_SECONDS = 38; // the whole scroll plays as a short reel

const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
const clamp = (v) => Math.min(1, Math.max(0, v));

// Film chrome over the title sequence: letterbox bars close in, a running timecode, the scene
// counter, and the small credit label above each title, which jumbles into place on every scene change.
export default function FilmHud({ progressRef }) {
  const rootRef = useRef(null);
  const tcRef = useRef(null);
  const sceneRef = useRef(null);
  const labelRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    let shown = -1;
    let cancel = () => {};

    const tick = () => {
      if (document.documentElement.classList.contains('past-stage')) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const p = progressRef.current;
      const root = rootRef.current;
      if (root) {
        root.style.setProperty('--bars', String(clamp((p - 0.02) / 0.1)));
        // The scroll sequence is over: hide the chrome so it never sits on top of the homepage, About or Projects
        root.style.display = p >= 0.995 ? 'none' : '';
        lineRef.current.style.transform = `scaleX(${p})`;
        const frames = p * REEL_SECONDS * FPS;
        const secs = Math.floor(frames / FPS);
        tcRef.current.textContent = `${pad(secs / 60)}:${pad(secs % 60)}:${pad(frames % FPS)}`;

        // Which plate is on screen (the last one stays)
        let idx = -1;
        let t = 0;
        PLATES.forEach((_, i) => {
          const ti = clamp((p - (START + i * STEP)) / DUR);
          if (ti > 0 && (i === PLATES.length - 1 || ti < 1)) {
            idx = i;
            t = ti;
          }
        });
        const labelEl = labelRef.current;
        if (idx !== shown) {
          shown = idx;
          cancel();
          if (idx >= 0) {
            cancel = scrambleTo(labelEl, PLATES[idx].label.toUpperCase(), 800);
            sceneRef.current.textContent = `Scene ${pad(idx + 1)} / ${pad(PLATES.length)}`;
          } else {
            labelEl.textContent = '';
            sceneRef.current.textContent = '';
          }
        }
        const last = idx === PLATES.length - 1;
        labelEl.style.opacity = idx < 0 ? 0 : clamp(t / 0.15) * (last ? 1 : 1 - clamp((t - 0.6) / 0.25));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancel();
    };
  }, [progressRef]);

  return (
    <div ref={rootRef} className="hud" aria-hidden="true">
      <div className="hud__bar hud__bar--top">
        <span>Shivmani Singh</span>
        <span>Feature presentation</span>
      </div>
      <div className="hud__label" ref={labelRef} />
      <div className="hud__bar hud__bar--bottom">
        <span ref={tcRef} className="hud__tc">00:00:00</span>
        <span ref={sceneRef} />
        <i ref={lineRef} className="hud__line" />
      </div>
    </div>
  );
}
