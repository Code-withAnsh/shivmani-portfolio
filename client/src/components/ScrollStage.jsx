import { lazy, Suspense, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import FilmHud from './FilmHud.jsx';

// three.js is the heaviest part of the page, so the 3D titles load as their own chunk
const TitleScene3D = lazy(() => import('./TitleScene3D.jsx'));

gsap.registerPlugin(ScrollTrigger);

// How "lazy" the sequence feels. The animation chases the scroll position instead of jumping to it:
//  - EASE_RATE: how quickly it closes the gap (higher = snappier, lower = lazier)
//  - MAX_SPEED: the fastest the animation may move, in "whole sequences per second". Even if the user
//    flings the wheel, the titles cannot rush past; the whole sequence takes at least 1 / MAX_SPEED seconds.
const EASE_RATE = 4;
const MAX_SPEED = 0.3;

// Scroll-driven sequence on top of the landing page:
//   hero fades out -> the photo darkens and its blur grows for the whole scroll ->
//   four 3D title plates cross the screen one after another (TitleScene3D reads the same progress).
export default function ScrollStage() {
  const progressRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    // Lenis gives smooth, eased scrolling; ScrollTrigger is told about every scroll tick.
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.8, smoothWheel: true, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    const lenisTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisTick);
    gsap.ticker.lagSmoothing(0);

    let target = 0; // where the scrollbar says we are (0..1)
    let tickSmooth = null;

    const ctx = gsap.context(() => {
      // Timeline is paused and driven by hand below, so the photo and the titles share one smoothed progress.
      const tl = gsap.timeline({ paused: true });

      // The photo never disappears. It gets slightly darker and desaturated early on, and the blur keeps
      // growing for the whole scroll. One filter string is rebuilt from these values on every update.
      const video = document.querySelector('.intro__video');
      const look = { gray: 0, bright: 1, blur: 0 };
      const applyLook = () => {
        video.style.filter = `grayscale(${look.gray}) brightness(${look.bright}) blur(${look.blur}px)`;
      };

      tl.to('.landing__fade', { opacity: 0, y: -40, duration: 0.1, ease: 'none' }, 0)
        .to(look, { gray: 0.85, bright: 0.65, duration: 0.25, ease: 'none', onUpdate: applyLook }, 0.02)
        .to(look, { blur: 26, duration: 0.93, ease: 'none', onUpdate: applyLook }, 0.02)
        .to('.stage__tint', { opacity: 1, duration: 0.3, ease: 'none' }, 0.08)
        .to('.stage__grain', { opacity: 0.18, duration: 0.2, ease: 'none' }, 0.1)
        // Stretch the timeline to exactly 1 so progress maps 1:1 onto it
        .to({}, { duration: 0.0001 }, 0.9999);

      ScrollTrigger.create({
        trigger: '.scroll-track',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          target = self.progress;
        },
      });

      let shown = 0;
      tickSmooth = (_time, deltaMs) => {
        const dt = Math.min(deltaMs / 1000, 0.05);
        const gap = target - shown;
        // Ease toward the target, then cap the speed. Time-based, so it feels the same at any frame rate.
        let step = gap * (1 - Math.exp(-EASE_RATE * dt));
        const maxStep = MAX_SPEED * dt;
        step = Math.max(-maxStep, Math.min(maxStep, step));
        shown += step;
        progressRef.current = shown;
        // Once the title sequence is over, the fixed layers under the page are hidden and their loops stop
        const done = shown > 0.97;
        if (done !== doneRef.current) {
          doneRef.current = done;
          document.documentElement.classList.toggle('past-stage', done);
        }
        tl.progress(shown);
      };
      gsap.ticker.add(tickSmooth);
    });

    return () => {
      if (tickSmooth) gsap.ticker.remove(tickSmooth);
      ctx.revert();
      gsap.ticker.remove(lenisTick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <>
      <div className="stage__tint" aria-hidden="true" />
      <Suspense fallback={null}>
        <TitleScene3D progressRef={progressRef} />
      </Suspense>
      <FilmHud progressRef={progressRef} />
      <div className="stage__grain" aria-hidden="true" />
      <div className="scroll-track" aria-hidden="true" />
    </>
  );
}
