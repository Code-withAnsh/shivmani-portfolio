import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ProjectView.css';

gsap.registerPlugin(ScrollTrigger);

const pad = (n) => String(n).padStart(2, '0');

// Deterministic "random" so the scattered tech chips fly in from the same places on every visit
const rnd = (i, k) => {
  const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Each screenshot enters in its own way
const SHOT_FX = ['wipe', 'tilt', 'curtain', 'swing', 'iris'];
const SHOT_LAYOUT = ['l', 'r', 'c'];

function Chars({ text, className }) {
  // letters are grouped per word so a long title never breaks in the middle of a word
  return text.split(' ').map((word, wi) => (
    <span className="pv-word" key={wi}>
      {word.split('').map((ch, i) => (
        <span className="pv-mask" key={i}>
          <span className={`pv-char ${className || ''}`}>{ch}</span>
        </span>
      ))}
    </span>
  ));
}

// Full project page, told as a scroll story. It opens from the poster's own rectangle, then every block
// (title, hero, about, features, stack, screenshots) arrives with its own scroll animation.
// It scrolls natively inside itself (no page lock), so closing it leaves the page exactly where it was.
export default function ProjectView({ project, index, originRect, onClose }) {
  const rootRef = useRef(null);
  const barRef = useRef(null);
  const closingRef = useRef(false);

  const clipFrom = (r) => `inset(${r.top}px ${r.right}px ${r.bottom}px ${r.left}px round 14px)`;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const scroller = root;
    root.focus({ preventScroll: true });

    const ctx = gsap.context(() => {
      const $ = (sel) => gsap.utils.toArray(sel, root);
      const trig = (trigger, extra = {}) => ({ trigger, scroller, start: 'top top', end: 'bottom bottom', scrub: 0.6, ...extra });

      // ── Open: grow from the poster, then the title letters rise
      const open = gsap.timeline();
      open
        .fromTo(root, { clipPath: clipFrom(originRect) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.9, ease: 'power3.inOut' })
        .from('.pv-cover .pv-char', { yPercent: 118, stagger: 0.035, duration: 1, ease: 'power4.out' }, 0.55)
        .from('.pv-cover__rise', { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' }, 0.8)
        .from('.pv-bar__inner > *', { opacity: 0, y: -14, stagger: 0.06, duration: 0.6 }, 0.9);

      // Cover: the giant number and title drift apart as you leave
      gsap.to('.pv-cover__num', { yPercent: -30, ease: 'none', scrollTrigger: trig('.pv-cover', { start: 'top top', end: 'bottom top' }) });
      gsap.to('.pv-cover__text', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: trig('.pv-cover', { start: 'top top', end: 'bottom top' }) });

      // ── Hero: a small tilted screenshot grows into the whole screen
      gsap
        .timeline({ scrollTrigger: trig('.pv-hero') })
        .fromTo('.pv-hero__frame', { scale: 0.4, rotate: -8, borderRadius: 90 }, { scale: 1, rotate: 0, borderRadius: 0, ease: 'power1.inOut', duration: 1 }, 0)
        .fromTo('.pv-hero__img', { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .fromTo('.pv-hero__cap', { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.8);

      // ── About: the paragraph fills in word by word
      gsap
        .timeline({ scrollTrigger: trig('.pv-about') })
        .fromTo('.pv-w', { opacity: 0.12 }, { opacity: 1, stagger: 0.12, duration: 0.5, ease: 'none' }, 0)
        .fromTo('.pv-about__label', { xPercent: -30, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.5 }, 0);

      // ── Features: one at a time, each rolls up through a window
      const items = $('.pv-feat__item');
      const featTl = gsap.timeline({ scrollTrigger: trig('.pv-feat') });
      items.forEach((el, i) => {
        if (i > 0) featTl.fromTo(el, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, i);
        if (i < items.length - 1) featTl.to(el, { yPercent: -105, opacity: 0, duration: 0.45, ease: 'power2.in' }, i + 0.6);
      });
      featTl.to('.pv-feat__bar i', { scaleY: 1, ease: 'none', duration: items.length - 0.2 }, 0);
      featTl.to({}, { duration: 0.3 }); // hold on the last one

      // ── Tech stack: chips fly in from all over and snap into place, a ghost word slides behind
      const chips = $('.pv-chip');
      const stackTl = gsap.timeline({ scrollTrigger: trig('.pv-stack') });
      stackTl
        .from('.pv-stack__title .pv-char', { yPercent: 118, stagger: 0.04, duration: 0.5, ease: 'power3.out' }, 0)
        .fromTo(
          chips,
          {
            x: (i) => (rnd(i, 1) - 0.5) * window.innerWidth * 1.5,
            y: (i) => (rnd(i, 2) - 0.5) * window.innerHeight * 1.7,
            rotate: (i) => (rnd(i, 3) - 0.5) * 170,
            scale: 0.3,
            opacity: 0,
          },
          { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, ease: 'power3.out', duration: 1, stagger: 0.04 },
          0.1
        )
        .to('.pv-stack__ghost', { xPercent: -38, ease: 'none', duration: 2.4 }, 0)
        .to(chips, { y: (i) => (i % 3 - 1) * -26, ease: 'none', duration: 0.8 }, 1.6);

      // ── Screenshots: five different entrances, caption always follows
      $('.pv-shot').forEach((shot, i) => {
        const fx = SHOT_FX[i % SHOT_FX.length];
        const frame = shot.querySelector('.pv-shot__frame');
        const img = shot.querySelector('.pv-shot__img');
        const cap = shot.querySelectorAll('.pv-shot__cap > *');
        const range = { trigger: shot, scroller, start: 'top 92%', end: 'top 30%', scrub: 0.7 };
        const tl = gsap.timeline({ scrollTrigger: range, defaults: { ease: 'none' } });

        if (fx === 'wipe') tl.fromTo(frame, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0).fromTo(img, { scale: 1.4 }, { scale: 1 }, 0);
        if (fx === 'tilt') tl.fromTo(frame, { rotateX: 42, yPercent: 22, scale: 0.86, opacity: 0.1, transformOrigin: '50% 100%' }, { rotateX: 0, yPercent: 0, scale: 1, opacity: 1 }, 0);
        if (fx === 'curtain') tl.fromTo(frame, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0).fromTo(img, { scale: 1.25 }, { scale: 1 }, 0);
        if (fx === 'swing') {
          const dir = i % 2 ? -1 : 1;
          tl.fromTo(frame, { xPercent: 38 * dir, rotate: 9 * dir, opacity: 0 }, { xPercent: 0, rotate: 0, opacity: 1 }, 0);
        }
        if (fx === 'iris') tl.fromTo(frame, { clipPath: 'circle(10% at 50% 50%)' }, { clipPath: 'circle(78% at 50% 50%)' }, 0).fromTo(img, { scale: 1.5 }, { scale: 1 }, 0);

        tl.fromTo(cap, { y: 36, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.5 }, 0.5);

        // once it is on screen the picture also slides slightly inside its frame
        gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: shot, scroller, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      // ── Finale
      gsap.from('.pv-end__rise', {
        y: 70,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.pv-end', scroller, start: 'top 70%' },
      });

      // Scroll progress in the top bar
      ScrollTrigger.create({
        scroller,
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
        },
      });
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close: shrink back into the poster (the page behind never moved), then unmount
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const root = rootRef.current;
    const media = document.querySelector(`[data-proj="${project.slug}"] .pcard__main`);
    let target = originRect;
    if (media) {
      const r = media.getBoundingClientRect();
      target = { top: r.top, left: r.left, right: window.innerWidth - r.right, bottom: window.innerHeight - r.bottom };
    }
    root.style.overflow = 'hidden';
    gsap.to(root.children, { opacity: 0, duration: 0.25 });
    gsap.to(root, { clipPath: clipFrom(target), duration: 0.75, ease: 'power3.inOut', onComplete: onClose });
  }, [onClose, originRect, project.slug]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const t = project.theme;
  const [hero, ...shots] = project.images;
  const words = project.about.split(' ');

  return createPortal(
    <div
      className="pview"
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      data-lenis-prevent
      style={{ '--bg': t.bg, '--ink': t.ink, '--dim': t.dim, '--deep': t.deep, '--onDeep': t.onDeep || t.ink }}
    >
      <div className="pv-bar">
        <div className="pv-bar__inner">
          <span className="pv-bar__title">{project.title}</span>
          <span className="pv-bar__prog"><i ref={barRef} /></span>
          <button type="button" className="pv-bar__close" onClick={close}>
            Close <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      {/* Cover */}
      <section className="pv-cover">
        <span className="pv-cover__num" aria-hidden="true">{pad(index + 1)}</span>
        <div className="pv-cover__text">
          <p className="pv-eyebrow pv-cover__rise">{project.category} · {project.year}</p>
          <h2 className="pv-title">
            <span className="pv-title__lead"><Chars text={project.lead} /></span>{' '}
            <span className="pv-title__tail"><Chars text={project.tail} /></span>
          </h2>
          <p className="pv-tagline pv-cover__rise">{project.tagline}</p>
        </div>
        <span className="pv-cue pv-cover__rise">Scroll <i /></span>
      </section>

      {/* Hero: grows to full screen */}
      <section className="pv-ch pv-hero">
        <div className="pv-stage">
          <div className="pv-hero__frame">
            <img className="pv-hero__img" src={hero.src} alt={hero.caption} decoding="async" />
          </div>
          <p className="pv-hero__cap">{hero.caption}</p>
        </div>
      </section>

      {/* About: words light up */}
      <section className="pv-ch pv-about">
        <div className="pv-stage">
          <p className="pv-about__label">About the build</p>
          <p className="pv-about__text">
            {words.map((w, i) => (
              <span className="pv-w" key={i}>{w}{' '}</span>
            ))}
          </p>
        </div>
      </section>

      {/* Features: rolling window */}
      <section className="pv-ch pv-feat" style={{ height: `${project.features.length * 85 + 90}vh` }}>
        <div className="pv-stage">
          <p className="pv-feat__label">What it does</p>
          <div className="pv-feat__window">
            {project.features.map((f, i) => (
              <div className="pv-feat__item" key={f}>
                <span className="pv-feat__num">{pad(i + 1)}</span>
                <p className="pv-feat__text">{f}</p>
              </div>
            ))}
          </div>
          <span className="pv-feat__bar" aria-hidden="true"><i /></span>
        </div>
      </section>

      {/* Tech stack: chips fly together */}
      <section className="pv-ch pv-stack">
        <div className="pv-stage">
          <div className="pv-stack__ghost" aria-hidden="true">
            {project.stack.slice(0, 6).join(' · ')} · {project.stack.slice(0, 6).join(' · ')}
          </div>
          <h3 className="pv-stack__title"><Chars text="Built with" /></h3>
          <ul className="pv-stack__chips">
            {project.stack.map((s, i) => (
              <li className={`pv-chip ${i % 4 === 0 ? 'pv-chip--big' : ''} ${i % 5 === 2 ? 'pv-chip--solid' : ''}`} key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Screenshots */}
      <section className="pv-shots">
        <p className="pv-shots__label">The screens</p>
        {shots.map((s, i) => (
          <figure className={`pv-shot pv-shot--${SHOT_LAYOUT[i % 3]} pv-shot--${SHOT_FX[i % SHOT_FX.length]}`} key={s.src}>
            <div className="pv-shot__frame">
              <img className="pv-shot__img" src={s.src} alt={s.caption} loading="lazy" decoding="async" />
            </div>
            <figcaption className="pv-shot__cap">
              <span className="pv-shot__n">{pad(i + 1)}</span>
              <span className="pv-shot__t">{s.caption}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      {/* Finale */}
      <section className="pv-end">
        <p className="pv-end__rise pv-eyebrow">{project.shortRole} · {project.year}</p>
        <a className="pv-end__rise pv-link" href={project.live} target="_blank" rel="noreferrer">
          <span>Live site</span><b aria-hidden="true">↗</b>
        </a>
        <a className="pv-end__rise pv-link" href={project.github} target="_blank" rel="noreferrer">
          <span>GitHub</span><b aria-hidden="true">↗</b>
        </a>
        <button type="button" className="pv-end__rise pv-back" onClick={close}>← Back to projects</button>
      </section>
    </div>,
    document.body
  );
}
