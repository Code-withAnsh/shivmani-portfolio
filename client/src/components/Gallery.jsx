import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GALLERY } from '../data/gallery.js';
import './Gallery.css';

gsap.registerPlugin(ScrollTrigger);

// Auto-speed in px per second. Photos move left to right and loop forever.
const SPEED = 46;
// How fast a flick loses momentum (higher = stops sooner)
const FRICTION = 3.2;
// Pixels the pointer must travel before it counts as a drag (so a tap still works)
const DRAG_SLOP = 6;

// Gallery: a tilted orange ribbon of photos that drifts left to right in a loop.
//  - Hover: the ribbon eases to a stop; the hovered photo grows past its size and gets colour.
//  - Drag (mouse or touch) or horizontal trackpad swipe: the visitor slides the ribbon in either direction.
//  - Release after a flick: the ribbon keeps going with momentum, then eases back into the left-to-right drift.
// Motion runs in a rAF loop that writes transform directly, so React does not re-render every frame.
export default function Gallery() {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0); // position of the ribbon, in px
  const speedRef = useRef(SPEED); // auto speed right now (eased toward target)
  const targetRef = useRef(SPEED); // auto speed wanted: SPEED, or 0 while hovered
  const inertiaRef = useRef(0); // momentum from a drag or a flick, px per second
  const cycleRef = useRef(0); // width of one copy of the photo set
  const drag = useRef({ active: false, id: null, lastX: 0, lastT: 0, vel: 0, moved: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const measure = () => {
      cycleRef.current = track.scrollWidth / 2;
    };
    measure();
    window.addEventListener('resize', measure);

    // Enter animation: the whole ribbon rises and straightens into place, once
    const ctx = gsap.context(() => {
      gsap.from('.gal__band', {
        yPercent: 18,
        rotate: -9,
        opacity: 0,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 75%' },
      });
      gsap.from('.gal__hw', {
        yPercent: 115,
        stagger: 0.1,
        duration: 1.1,
        ease: 'power4.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 75%' },
      });
    }, rootRef);

    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Momentum decays with friction. It is not used while the visitor is holding the ribbon.
      if (!drag.current.active) {
        inertiaRef.current *= Math.exp(-FRICTION * dt);
        if (Math.abs(inertiaRef.current) < 1) inertiaRef.current = 0;
      }
      // Auto speed eases toward its target: slow to a stop on hover, and back up to the drift afterwards
      speedRef.current += (targetRef.current - speedRef.current) * (1 - Math.exp(-6 * dt));

      if (!reduce) offsetRef.current += speedRef.current * dt;
      if (!drag.current.active) offsetRef.current += inertiaRef.current * dt;

      // Loop: one copy is a full cycle, so wrapping by one cycle is invisible
      const cycle = cycleRef.current || 1;
      offsetRef.current = ((offsetRef.current % cycle) + cycle) % cycle;
      track.style.transform = `translate3d(${-cycle + offsetRef.current}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      ctx.revert();
    };
  }, []);

  // Pointer: hover pauses the drift, a drag moves the ribbon with the finger or mouse, and a release sends it on
  const onPointerEnter = (e) => {
    if (e.pointerType === 'mouse' && !drag.current.active) targetRef.current = 0;
  };
  const onPointerLeave = (e) => {
    if (e.pointerType === 'mouse' && !drag.current.active) targetRef.current = SPEED;
  };
  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const d = drag.current;
    d.active = true;
    d.id = e.pointerId;
    d.lastX = e.clientX;
    d.lastT = performance.now();
    d.vel = 0;
    d.moved = 0;
    inertiaRef.current = 0;
    targetRef.current = 0;
    stageRef.current.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    const now = performance.now();
    const dx = e.clientX - d.lastX;
    const dt = Math.max((now - d.lastT) / 1000, 0.001);
    d.moved += Math.abs(dx);
    offsetRef.current += dx;
    // Smooth velocity from the last few moves, used for the flick on release
    d.vel = d.vel * 0.6 + (dx / dt) * 0.4;
    d.lastX = e.clientX;
    d.lastT = now;
  };
  const endDrag = (e) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    d.active = false;
    if (stageRef.current.hasPointerCapture(e.pointerId)) stageRef.current.releasePointerCapture(e.pointerId);
    // Only a real flick carries momentum; a slow release just resumes the drift
    const v = Math.max(-1600, Math.min(1600, d.vel));
    inertiaRef.current = Math.abs(v) > 120 ? v : 0;
    // Still hovering with the mouse? Stay paused. Otherwise the drift carries on.
    targetRef.current = e.pointerType === 'mouse' && stageRef.current.matches(':hover') ? 0 : SPEED;
    setDragging(false);
  };

  // Trackpad: a horizontal swipe slides the ribbon. Vertical wheel is left alone so the page still scrolls.
  const onWheel = (e) => {
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
    if (!horizontal) return;
    const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
    offsetRef.current -= dx;
    inertiaRef.current = Math.max(-1600, Math.min(1600, inertiaRef.current - dx * 6));
  };

  // A drag must not count as a click on a photo
  const onClickCapture = (e) => {
    if (drag.current.moved > DRAG_SLOP) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = 0;
    }
  };

  // One set, twice in a row: the loop needs the second copy to hide the jump
  const set = [...GALLERY, ...GALLERY];

  return (
    <section className="gal" id="gallery" ref={rootRef}>
      <div className="gal__head">
        <p className="gal__kick">[ Gallery ]</p>
        <h2 className="gal__title" aria-label="Life, in frames">
          <span className="gal__hm"><span className="gal__hw">Life,</span></span>{' '}
          <span className="gal__hm"><span className="gal__hw gal__hw--serif">in frames</span></span>
        </h2>
        <p className="gal__note">Hover a photo to bring it to life. Drag the ribbon, or swipe, to move it either way.</p>
        <p className="gal__lead">
          These are the days outside the screen. The hack day in Bhopal, where I took part in person and came third.
          The late-night builds before a deadline. The campus rooms where most of the learning happened.
        </p>
      </div>

      <div
        className={`gal__stage ${dragging ? 'is-drag' : ''}`}
        ref={stageRef}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        onClickCapture={onClickCapture}
      >
        <div className="gal__band">
          <div className="gal__track" ref={trackRef}>
            {set.map((p, i) => (
              <figure className={`gal__ph gal__ph--${p.size} ${p.cert ? 'gal__ph--cert' : ''}`} key={`${p.src}-${i}`} tabIndex={0}>
                <div className="gal__frame">
                  <img src={p.src} alt={p.caption} loading="lazy" decoding="async" draggable="false" />
                </div>
                <figcaption className="gal__cap">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      <p className="gal__count">{String(GALLERY.length).padStart(2, '0')} moments · 1 certificate</p>
    </section>
  );
}
