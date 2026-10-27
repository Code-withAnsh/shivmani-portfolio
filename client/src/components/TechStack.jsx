import { useEffect, useRef, useState } from 'react';
import { asset } from '../lib/asset.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STACK } from '../data/techstack.js';
import './TechStack.css';

gsap.registerPlugin(ScrollTrigger);

const pad = (n) => String(n).padStart(2, '0');
const TOTAL = STACK.reduce((n, g) => n + g.items.length, 0);

// One tall card. Hover shows a "Flip" cue; click or tap flips it to a short note about what I do with the tool.
function TCard({ item, no }) {
  const [flipped, setFlipped] = useState(false);
  const toggle = () => setFlipped((f) => !f);
  return (
    <div
      className={`tcard ${flipped ? 'is-flipped' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${item.name}: ${flipped ? 'show logo' : 'what I do with it'}`}
      onClick={toggle}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setFlipped(false)}
      style={{ '--c': item.color }}
    >
      <div className="tcard__inner">
        <div className="tcard__face tcard__front">
          <span className="tcard__no">{pad(no)}</span>
          <svg className="tcard__logo" viewBox="0 0 24 24" role="img" aria-label={`${item.logoName} logo`}>
            <path d={item.path} />
          </svg>
          <span className="tcard__name">{item.name}</span>
          <span className="tcard__cue" aria-hidden="true">Flip <b>↻</b></span>
          <span className="tcard__shine" aria-hidden="true" />
        </div>
        <div className="tcard__face tcard__back">
          <svg className="tcard__ghost" viewBox="0 0 24 24" aria-hidden="true">
            <path d={item.path} />
          </svg>
          <span className="tcard__tag">{item.name} · what I do</span>
          <h4 className="tcard__head">{item.head}</h4>
          <p className="tcard__body">{item.body}</p>
        </div>
      </div>
    </div>
  );
}

// Each category enters in its own way, one after the other as you scroll down:
//  Frontend: a wave rising left to right · Backend: slide in from the left with a tilt
//  Database: a stacked deck that fans out · Languages: one card spins in · Tools: they drop from above
const ENTRANCE = {
  frontend: (cards, tl) =>
    tl.from(cards, { y: 110, opacity: 0, rotate: (i) => (i % 2 ? 6 : -6), duration: 0.9, ease: 'back.out(1.5)', stagger: 0.09 }, 0.35)
      .from(cards.map((c) => c.querySelector('.tcard__logo')), { scale: 0.5, duration: 0.7, ease: 'back.out(3)', stagger: 0.09 }, 0.55),
  backend: (cards, tl) =>
    tl.from(cards, { x: -160, rotate: -10, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.16 }, 0.35),
  database: (cards, tl) =>
    tl.from(cards, {
      x: (i, el) => cards[0].offsetLeft - el.offsetLeft,
      rotate: (i) => (i - 0.5) * 12,
      scale: 0.96,
      duration: 1.2,
      ease: 'power3.out',
      stagger: 0.12,
    }, 0.35),
  languages: (cards, tl) =>
    tl.from(cards, { scale: 0.25, rotate: -22, opacity: 0, duration: 1.2, ease: 'back.out(1.8)' }, 0.35),
  tools: (cards, tl) =>
    tl.from(cards, { y: -220, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: 0.14 }, 0.35),
};

export default function TechStack() {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.tech__hw', {
        yPercent: 115,
        stagger: 0.1,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.tech__head', start: 'top 80%' },
      });
      gsap.from('.tech__head-rise', {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.tech__head', start: 'top 75%' },
      });

      gsap.utils.toArray('.trow').forEach((row) => {
        const id = row.dataset.group;
        const cards = gsap.utils.toArray('.tcard', row);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: row, start: 'top 75%', toggleActions: 'play none none reverse' },
        });
        // The left label comes first: its colour bar draws down, the words rise, then the rule draws across
        tl.from(row.querySelector('.trow__bar'), { scaleY: 0, duration: 0.7, ease: 'power3.out' }, 0)
          .from(row.querySelectorAll('.trow__lab-rise'), { y: 28, opacity: 0, stagger: 0.09, duration: 0.7, ease: 'power3.out' }, 0.1)
          .from(row.querySelector('.trow__hr'), { scaleX: 0, duration: 1.3, ease: 'power3.inOut' }, 0.1);
        ENTRANCE[id](cards, tl);
      });

      gsap.from('.tech__foot > *', {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.tech__foot', start: 'top 92%' },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  let no = 0;
  return (
    <section className="tech" id="techstack" ref={rootRef}>
      <header className="tech__head">
        <p className="tech__label tech__head-rise">[ Tech stack ]</p>
        <h2 className="tech__heading" aria-label="Built with">
          <span className="tech__hm"><span className="tech__hw">Built</span></span>{' '}
          <span className="tech__hm"><span className="tech__hw tech__hw--accent">with</span></span>
        </h2>
        <p className="tech__sub tech__head-rise">Hover a card and flip it.</p>
      </header>

      <div className="tech__rows">
        {STACK.map((g) => (
          <section
            className="trow"
            key={g.id}
            data-group={g.id}
            style={{ '--t': g.tint, '--g1': g.bg[0], '--g2': g.bg[1] }}
          >
            <div className="trow__lab">
              <span className="trow__bar" aria-hidden="true" />
              <span className="trow__cnt trow__lab-rise">{pad(g.items.length)}</span>
              <h3 className="trow__name trow__lab-rise">{g.name}</h3>
              <p className="trow__sub trow__lab-rise">{g.sub}</p>
            </div>
            <div className="trow__cards">
              {g.items.map((it) => {
                no += 1;
                return <TCard item={it} no={no} key={it.id} />;
              })}
            </div>
            <hr className="trow__hr" />
          </section>
        ))}
      </div>

      <div className="tech__foot">
        <span className="tech__count">{TOTAL} tools · {STACK.length} groups</span>
        <a className="cvbtn" href={asset('cv/Shivmani-Singh-CV.pdf')} download="Shivmani-Singh-CV.pdf">
          <span className="cvbtn__text">Download CV</span>
          <span className="cvbtn__ico" aria-hidden="true"><i>↓</i><i>↓</i></span>
          <span className="cvbtn__sweep" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
