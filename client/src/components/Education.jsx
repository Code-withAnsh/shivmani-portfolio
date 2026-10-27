import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EDUCATION } from '../data/education.js';
import './Education.css';

gsap.registerPlugin(ScrollTrigger);

// Education: wide cards that arrive one by one and stack over each other as you scroll (same idea as Projects).
// On hover a card tilts toward the pointer, a glare follows it and a shimmer sweeps across.
export default function Education() {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.edu__hw', {
        yPercent: 115,
        stagger: 0.09,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.edu__head', start: 'top 80%' },
      });
      gsap.from('.edu__head-rise', {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.edu__head', start: 'top 75%' },
      });

      const cards = gsap.utils.toArray('.ecard');
      cards.forEach((card, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const trigger = { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' };

        // The card slides up, a little tilted, and lands with a spring
        gsap.from(card.querySelector('.ecard__pop'), {
          y: 120,
          rotate: 3 * side,
          scale: 0.9,
          opacity: 0,
          duration: 1.1,
          ease: 'back.out(1.25)',
          scrollTrigger: trigger,
        });

        // Then the big outline year draws in, and the text follows one piece at a time
        gsap.from(card.querySelector('.ecard__num'), {
          yPercent: 60,
          opacity: 0,
          duration: 0.9,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: trigger,
        });
        gsap.from(card.querySelectorAll('.ecard__rise'), {
          y: 36,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          delay: 0.35,
          ease: 'power3.out',
          scrollTrigger: trigger,
        });
        gsap.from(card.querySelectorAll('.ecard__meta span'), {
          x: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          delay: 0.5,
          ease: 'power3.out',
          scrollTrigger: trigger,
        });

        // When the next card covers this one, this one sinks back and darkens
        const next = cards[i + 1];
        if (next) {
          const range = { trigger: next, start: 'top 95%', end: 'top 18%', scrub: true };
          gsap.to(card.querySelector('.ecard__sink'), { scale: 0.94, ease: 'none', scrollTrigger: range });
          gsap.to(card.querySelector('.ecard__veil'), { opacity: 0.5, ease: 'none', scrollTrigger: range });
        }
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Tilt toward the pointer and move the glare with it (mouse only)
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - py) * 9).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };
  const onLeave = (e) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  };

  return (
    <section className="edu" id="education" ref={rootRef}>
      <header className="edu__head">
        <p className="edu__label edu__head-rise">[ Education ]</p>
        <h2 className="edu__heading" aria-label="Where I learned">
          <span className="edu__hm"><span className="edu__hw edu__hw--sans">Where</span></span>{' '}
          <span className="edu__hm"><span className="edu__hw edu__hw--sans">I</span></span>{' '}
          <span className="edu__hm"><span className="edu__hw edu__hw--serif">learned</span></span>
        </h2>
        <p className="edu__sub edu__head-rise">From school in Basti to a BCA in Varanasi, with a lot of building in between.</p>
      </header>

      <div className="edu__stack">
        {EDUCATION.map((e, i) => (
          <article className="ecard" key={e.id} style={{ '--i': i, '--bg': e.bg, '--ink': e.ink, '--accent': e.accent }}>
            <div className="ecard__pop">
              <div className="ecard__sink">
                <div className="ecard__tilt" onPointerMove={onMove} onPointerLeave={onLeave}>
                  <div className="ecard__num" aria-hidden="true">{e.num}</div>
                  <div className="ecard__main">
                    <h3 className="ecard__title ecard__rise">{e.title}</h3>
                    <p className="ecard__place ecard__rise">{e.place}</p>
                    <span className="ecard__chip ecard__rise">{e.chip}</span>
                  </div>
                  <div className="ecard__meta">
                    {e.meta.map((m) => <span key={m}>{m}</span>)}
                  </div>
                  <span className="ecard__glare" aria-hidden="true" />
                  <span className="ecard__shine" aria-hidden="true" />
                </div>
                <span className="ecard__veil" aria-hidden="true" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
