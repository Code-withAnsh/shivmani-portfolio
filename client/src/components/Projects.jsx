import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROJECTS } from '../data/projects.js';
import { playWhoosh } from '../lib/sound.js';
import './Projects.css';

gsap.registerPlugin(ScrollTrigger);

// The full project page is only needed after a click, so it loads on demand
const ProjectView = lazy(() => import('./ProjectView.jsx'));

const pad = (n) => String(n).padStart(2, '0');

// Projects: big colour cards that stick to the top and stack over each other as the user scrolls.
// Plain CSS sticky does the stacking (no pinning, so it stays smooth on phones); GSAP adds depth on top.
export default function Projects() {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(null); // { project, rect }

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.proj__hw', {
        yPercent: 115,
        stagger: 0.09,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.proj__head', start: 'top 80%' },
      });

      const cards = gsap.utils.toArray('.pcard');
      cards.forEach((card, i) => {
        // The small screenshots drift at their own speed while the card is on screen
        card.querySelectorAll('[data-depth]').forEach((el) => {
          const d = parseFloat(el.dataset.depth);
          gsap.fromTo(
            el,
            { yPercent: d * 38 },
            {
              yPercent: -d * 28,
              ease: 'none',
              scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
            }
          );
        });

        // The main screenshot straightens up as the card arrives
        gsap.fromTo(
          card.querySelector('.pcard__main'),
          { rotate: -3.5, scale: 0.9 },
          {
            rotate: 0,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 22%', scrub: 0.6 },
          }
        );

        gsap.from(card.querySelectorAll('.pcard__rise'), {
          y: 44,
          opacity: 0,
          stagger: 0.08,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 68%' },
        });

        // When the next card slides over this one, this one sinks back and darkens
        const next = cards[i + 1];
        if (next) {
          const range = { trigger: next, start: 'top 95%', end: 'top 12%', scrub: true };
          gsap.to(card.querySelector('.pcard__inner'), { scale: 0.94, ease: 'none', scrollTrigger: range });
          gsap.to(card.querySelector('.pcard__veil'), { opacity: 0.5, ease: 'none', scrollTrigger: range });
        }
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const openProject = useCallback((project, e) => {
    const media = e.currentTarget.closest('.pcard').querySelector('.pcard__main');
    const r = media.getBoundingClientRect();
    playWhoosh();
    setOpen({
      project,
      rect: { top: r.top, left: r.left, right: window.innerWidth - r.right, bottom: window.innerHeight - r.bottom },
    });
  }, []);

  return (
    <section className="proj" id="projects" ref={rootRef}>
      <header className="proj__head">
        <p className="proj__label">[ Projects ]</p>
        <h2 className="proj__heading" aria-label="Selected work">
          <span className="proj__hm"><span className="proj__hw proj__hw--sans">Selected</span></span>{' '}
          <span className="proj__hm"><span className="proj__hw proj__hw--serif">work</span></span>
        </h2>
        <div className="proj__sub">
          <p>Three builds, all solo. Each one is a full product, from design to deploy.</p>
          <span className="proj__total">({pad(PROJECTS.length)})</span>
        </div>
      </header>

      <div className="proj__stack">
        {PROJECTS.map((p, i) => {
          const t = p.theme;
          return (
            <article
              className="pcard"
              key={p.slug}
              data-proj={p.slug}
              style={{ '--i': i, '--bg': t.bg, '--ink': t.ink, '--dim': t.dim, '--deep': t.deep }}
            >
              <div className="pcard__inner">
                <div className="pcard__visual">
                  <button type="button" className="pcard__main" onClick={(e) => openProject(p, e)} aria-label={`Open ${p.title}`}>
                    <img src={p.images[0].src} alt="" loading="lazy" decoding="async" draggable="false" />
                  </button>
                  <div className="pcard__mini pcard__mini--a" data-depth="1.1" aria-hidden="true">
                    <img src={p.images[2].src} alt="" loading="lazy" decoding="async" />
                  </div>
                  <div className="pcard__mini pcard__mini--b" data-depth="0.6" aria-hidden="true">
                    <img src={p.images[1].src} alt="" loading="lazy" decoding="async" />
                  </div>
                </div>

                <div className="pcard__info">
                  <p className="pcard__idx pcard__rise">{pad(i + 1)} <span>/ {pad(PROJECTS.length)}</span></p>
                  <h3 className="pcard__title pcard__rise">
                    <span className="pcard__lead">{p.lead}</span>{' '}
                    <span className="pcard__tail">{p.tail}</span>
                  </h3>
                  <p className="pcard__tag pcard__rise">{p.tagline}</p>
                  <dl className="pcard__meta pcard__rise">
                    <div><dt>Type</dt><dd>{p.category}</dd></div>
                    <div><dt>Role</dt><dd>{p.shortRole}</dd></div>
                    <div><dt>Year</dt><dd>{p.year}</dd></div>
                  </dl>
                  <ul className="pcard__chips pcard__rise">
                    {p.stack.slice(0, 5).map((s) => <li key={s}>{s}</li>)}
                  </ul>
                  <button type="button" className="pcard__cta pcard__rise" onClick={(e) => openProject(p, e)}>
                    View case <span aria-hidden="true">→</span>
                  </button>
                </div>
                <span className="pcard__veil" aria-hidden="true" />
              </div>
            </article>
          );
        })}
      </div>

      {open && (
        <Suspense fallback={null}>
          <ProjectView project={open.project} index={PROJECTS.indexOf(open.project)} originRect={open.rect} onClose={() => setOpen(null)} />
        </Suspense>
      )}
    </section>
  );
}
