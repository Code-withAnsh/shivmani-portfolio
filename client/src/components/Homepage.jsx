import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Homepage.css';

gsap.registerPlugin(ScrollTrigger);

// Main homepage shown after the scroll sequence. Same structure as the reference layout:
// big uppercase headline with stat cards inline, a short intro line, and a bottom nav pill.
// Photo, copy, logo and colours are all Shivmani's own.
export default function Homepage() {
  const sectionRef = useRef(null);

  useEffect(() => {
    // The hero stays put for one extra screen of scrolling, so the visitor always gets to see it in full
    // before About comes in. The photo slowly pushes in and the hero dims into the next section.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      });
      tl.fromTo('.home__bg', { scale: 1 }, { scale: 1.1, ease: 'none', duration: 1 }, 0)
        .fromTo('.home__dim', { opacity: 0 }, { opacity: 0.7, ease: 'none', duration: 1 }, 0)
        .fromTo('.home__title, .home__intro', { y: 0, opacity: 1 }, { y: -60, opacity: 0.35, ease: 'none', duration: 1 }, 0);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="home" id="home" ref={sectionRef}>
      <div className="home__bg" aria-hidden="true" />
      <div className="home__veil" aria-hidden="true" />
      <div className="home__seam" aria-hidden="true" />
      <div className="home__dim" aria-hidden="true" />

      <header className="home__top">
        <a className="home__wordmark" href="#home">
          <span>SHIVMANI</span>
          <span>SINGH</span>
        </a>
        <a className="home__mail" href="#contact">Contact</a>
      </header>

      <h2 className="home__title">
        <span className="home__row">
          FULL STACK
          <span className="stat">
            <strong>3+</strong>
            <small>Years of experience</small>
          </span>
          &amp;
        </span>
        <span className="home__row home__row--indent">DEVELOPER</span>
        <span className="home__row">
          PRODUCTS
          <span className="stat stat--small">
            <strong>5+</strong>
            <small>Projects</small>
          </span>
          <span className="home__down" aria-hidden="true">↓</span>
        </span>
      </h2>

      <p className="home__intro">
        Hey, I&apos;m Shivmani. I build fast, scalable web products and SaaS platforms that convert,
        simplify, and scale.
      </p>

      <footer className="home__bottom">
        <span className="home__note">Built with care</span>

        <nav className="home__nav" aria-label="Sections">
          <a href="#about">About</a>
          <a href="#education">Education</a>
          <a href="#projects">Projects</a>
          <a href="#techstack">Stack</a>
          <a href="#gallery">Gallery</a>
          <a className="home__cta" href="#contact">
            <span className="home__thumb" aria-hidden="true" />
            Let&apos;s talk
          </a>
        </nav>

        <span className="home__note home__note--right">Scroll</span>
      </footer>
    </section>
  );
}
