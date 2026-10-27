import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { asset } from '../lib/asset.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SOCIALS } from '../data/socials.js';
import './Footer.css';

const ContactPop = lazy(() => import('./ContactPop.jsx'));

gsap.registerPlugin(ScrollTrigger);

const EMAIL = 'anshs9333@gmail.com';
const RESUME = asset('cv/Shivmani-Singh-CV.pdf');

// Footer: a full-screen card that rises up as you scroll into it.
// Right side: the link buttons (socials, resume, back to top). Left: headline, note, send button, email.
export default function Footer() {
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mm;
    const ctx = gsap.context(() => {
      mm = gsap.matchMedia();

      // Desktop: the card rises from below while the footer enters the screen, then settles in place
      mm.add('(min-width: 861px)', () => {
        gsap.fromTo(cardRef.current, { y: 140, opacity: 0.4 }, {
          y: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top 95%', end: 'top 35%', scrub: 0.8 },
        });
        gsap.from('.ft__hw', { yPercent: 115, stagger: 0.09, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: cardRef.current, start: 'top 75%' } });
        gsap.from('.ft__rise', { y: 28, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: cardRef.current, start: 'top 65%' } });
        gsap.fromTo('.ft__link', { x: 60, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.09, duration: 0.8, ease: 'back.out(1.4)', scrollTrigger: { trigger: cardRef.current, start: 'top 60%' } });
        gsap.from('.ft__avatar', { x: 120, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: cardRef.current, start: 'top 65%' } });
        // Avatar bobs gently once it has landed
        gsap.to('.ft__avatar', { y: -10, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.3 });
      });

      // Phone: everything is tied to the scroll position. The card lifts in, the avatar rises after it,
      // the headline words and the buttons follow one by one, and it all settles as the footer reaches the middle of the screen.
      mm.add('(max-width: 860px)', () => {
        // One scrubbed timeline across the whole footer pass. It ends when the page bottom is reached,
        // so every piece (including the links at the very bottom) always finishes, even on a tall phone card.
        const tl = gsap.timeline({
          scrollTrigger: { trigger: rootRef.current, start: 'top 100%', end: 'bottom bottom', scrub: 0.6 },
        });
        tl.fromTo(cardRef.current, { y: 120, opacity: 0.3, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'none' }, 0)
          .fromTo('.ft__avatar', { y: 90, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'none' }, 0.1)
          .fromTo('.ft__hw', { yPercent: 115 }, { yPercent: 0, stagger: 0.2, duration: 0.6, ease: 'none' }, 0.3)
          .fromTo('.ft__rise', { y: 26, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.25, duration: 0.5, ease: 'none' }, 0.4)
          .fromTo('.ft__link', { y: 22, opacity: 0, scale: 0.85 }, { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.5, ease: 'none' }, 0.6);
      });
    }, rootRef);
    return () => {
      mm?.revert();
      ctx.revert();
    };
  }, []);

  // Magnetic link buttons: each one leans toward the pointer
  const onMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.18, duration: 0.35, ease: 'power3.out' });
  };
  const onLeave = (e) => gsap.to(e.currentTarget, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });

  // Link list: socials first, then resume and back to top, all in the same button format
  const links = [
    ...SOCIALS.map((s) => ({ key: s.id, label: s.label, href: s.href, color: s.color, path: s.path, vb: s.vb })),
    { key: 'resume', label: 'Resume', href: RESUME, download: true, arrow: '↓' },
    { key: 'top', label: 'Back to top', href: '#top', arrow: '↑' },
  ];

  return (
    <footer className="ft" id="contact" ref={rootRef}>
      <div className="ft__card" ref={cardRef}>
        <div className="ft__main">
          <p className="ft__kick ft__rise">[ Let's talk ]</p>
          <h2 className="ft__title" aria-label="Let's build something">
            <span className="ft__hm">
              <span className="ft__hw">Let's build</span>
            </span>
            <br />
            <span className="ft__hm">
              <span className="ft__hw ft__hw--accent">something</span>
            </span>
          </h2>
          <p className="ft__lead ft__rise">
            I am open to internships, full-time roles and freelance work. If you
            have a project, an idea or an opening that could use someone who
            likes building things properly, I would love to hear from you. Send
            a short note about what you have in mind, and I will get back to you
            within a day. If you want a faster reply, email me directly
          </p>
          <button
            type="button"
            className="ft__send ft__rise"
            onClick={() => setOpen(true)}
          >
            <span>Send message</span>
            <i aria-hidden="true">→</i>
          </button>
          <a className="ft__mail ft__rise" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
          <p className="ft__copy ft__rise">© 2026 Shivmani Singh · Varanasi</p>
        </div>

        <nav className="ft__links" aria-label="Links">
          {links.map((l) => (
            <a
              key={l.key}
              className={`ft__link ${l.path ? 'ft__link--icon' : ''}`}
              aria-label={l.path ? l.label : undefined}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              download={l.download || undefined}
              style={l.color ? { "--c": l.color } : undefined}
              onPointerMove={onMove}
              onPointerLeave={onLeave}
            >
              {l.path ? (
                <svg className="ft__logo" viewBox={l.vb} aria-hidden="true">
                  <path d={l.path} />
                </svg>
              ) : null}
              <span className="ft__label">{l.label}</span>
              <span className="ft__arrow" aria-hidden="true">
                {l.arrow || "↗"}
              </span>
            </a>
          ))}
        </nav>

        <img
          className="ft__avatar"
          src={asset('images/footer-avatar.webp')}
          alt=""
          draggable="false"
          loading="lazy"
          decoding="async"
        />
      </div>

      {open && (
        <Suspense fallback={null}>
          <ContactPop onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </footer>
  );
}
