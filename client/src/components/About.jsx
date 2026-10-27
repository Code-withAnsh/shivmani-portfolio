import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

// Facts only: BCA final year, three years of building, and the working principles from the old site.
// Tags sit in the right half so they never cover the headline or the body paragraph
const TAGS = [
  { text: 'BCA · Final year', size: 'lg', x: '64%', y: '16%', rot: -4 },
  { text: '3 years building', size: 'md', x: '80%', y: '30%', rot: 3 },
  { text: 'Full Stack Developer', size: 'xl', x: '58%', y: '46%', rot: -2 },
  { text: 'Architecture over aesthetics', size: 'sm', x: '74%', y: '64%', rot: 5 },
  { text: 'Every product, like my own', size: 'md', x: '60%', y: '80%', rot: -3 },
];

// String physics. Every tag hangs from one elastic string that runs from the top edge through all tags.
const PER_SEG = 7; // intermediate points between two tags, so the string can bend and stretch
const SAG = 14; // resting dip of the string between tags, px
const REACH = 140; // the pointer affects the string within this distance, px
const K_SEG = 0.16; // string stiffness: pulls neighbours back to their spacing
const K_REST_MID = 0.02; // weak pull of string points toward their rest spot
const K_REST_TAG = 0.04; // tags are heavier: they return to their spot and swing back
const DAMP = 0.88;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export default function About() {
  const sectionRef = useRef(null);
  const countRef = useRef(null);
  const tagsRef = useRef(null);
  const stringRef = useRef(null);
  const wrapRefs = useRef([]);

  useEffect(() => {
    let mm;
    const ctx = gsap.context(() => {
      mm = gsap.matchMedia();

      // Desktop: the section is pinned and scrubbed by scroll, with the tags swinging on the string
      mm.add('(min-width: 761px)', () => {
        // Entrance: words rise from a mask, one after another, then the rest follows
        const intro = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=160%',
            scrub: 0.8,
            pin: true,
            anticipatePin: 1,
          },
        });

        intro
          .from('.about__word', { yPercent: 115, rotate: 3, opacity: 0, stagger: 0.12, ease: 'power3.out', duration: 1 }, 0)
          .from('.about__label, .about__body', { opacity: 0, y: 24, stagger: 0.15, ease: 'power2.out', duration: 0.8 }, 0.3)
          // Tags float in at their own angles, each one a little different, like pinned posters
          .from(
            '.about__tag',
            {
              opacity: 0,
              y: 90,
              scale: 0.86,
              rotate: (i) => TAGS[i].rot * 2.5,
              stagger: 0.14,
              ease: 'power3.out',
              duration: 1,
            },
            0.45
          )
          .to(
            '.about__tag',
            { rotate: (i) => TAGS[i].rot, ease: 'power1.out', duration: 0.6, stagger: 0.05 },
            1.5
          )
          // Facts count up, as the section settles
          .add(() => {
            const el = countRef.current;
            if (!el) return;
            const v = { n: 0 };
            gsap.to(v, {
              n: 3,
              duration: 1.2,
              ease: 'power2.out',
              onUpdate: () => {
                el.textContent = `${Math.round(v.n)}+`;
              },
            });
          }, 0.9);

        // Gentle parallax on the big display words, so the page keeps moving while pinned
        gsap.to('.about__display', {
          yPercent: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=160%',
            scrub: 0.8,
          },
        });

      });

      // Phone: no pin. Each piece is tied to the scroll position, so it moves with the finger, in the same order as desktop.
      mm.add('(max-width: 760px)', () => {
        const count = { n: 0 };
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: { trigger: sectionRef.current, start: 'top 90%', end: 'bottom 60%', scrub: 0.6 },
        });
        tl.fromTo('.about__label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0)
          .fromTo('.about__word', { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.3, duration: 1.4 }, 0.2)
          .fromTo('.about__body', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, 1.6)
          .fromTo('.about__tag', { opacity: 0, y: 44, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, stagger: 0.35, duration: 1 }, 2.4)
          .to(count, {
            n: 3,
            duration: 1.4,
            ease: 'none',
            onUpdate: () => {
              if (countRef.current) countRef.current.textContent = `${Math.round(count.n)}+`;
            },
          }, 3.8);

        // The big headline drifts up slower than the page, so it feels layered on the paragraph below
        gsap.to('.about__display', {
          y: -36,
          ease: 'none',
          scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    }, sectionRef);

    return () => {
      mm?.revert();
      ctx.revert();
    };
  }, []);

  // Elastic string through the tags. Points are simulated with springs; the pointer pulls and pushes them.
  useEffect(() => {
    const box = tagsRef.current;
    const path = stringRef.current;
    const svg = path.ownerSVGElement;
    const wraps = wrapRefs.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileMQ = window.matchMedia('(max-width: 760px)');

    let nodes = []; // { x, y, vx, vy, rx, ry, tag } where tag is the tag index, or -1 for plain string points
    let links = []; // [a, b, restLength]
    let tagNode = []; // node index of each tag
    let anchor = null;
    const mouse = { x: -9999, y: -9999, lx: null, ly: null, vx: 0, vy: 0 };
    let raf = 0;
    let t = 0;

    // Read each tag's top-centre from the layout (offsetLeft ignores GSAP and physics transforms)
    const layout = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

      const attach = wraps.map((w) => ({ x: w.offsetLeft + w.offsetWidth / 2, y: w.offsetTop }));
      anchor = { x: attach[0].x + W * 0.04, y: -10 };
      const chain = [anchor, ...attach];

      nodes = [];
      links = [];
      tagNode = [];
      nodes.push({ x: anchor.x, y: anchor.y, vx: 0, vy: 0, rx: anchor.x, ry: anchor.y, tag: -1, fixed: true });

      for (let s = 0; s < chain.length - 1; s++) {
        const a = chain[s];
        const b = chain[s + 1];
        for (let k = 1; k <= PER_SEG; k++) {
          const u = k / (PER_SEG + 1);
          const x = lerp(a.x, b.x, u);
          const y = lerp(a.y, b.y, u) + Math.sin(Math.PI * u) * SAG;
          nodes.push({ x, y, vx: 0, vy: 0, rx: x, ry: y, tag: -1 });
        }
        const x = b.x;
        const y = b.y;
        nodes.push({ x, y, vx: 0, vy: 0, rx: x, ry: y, tag: s });
        tagNode[s] = nodes.length - 1;
      }

      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        links.push([i, i + 1, Math.hypot(b.rx - a.rx, b.ry - a.ry)]);
      }

      // Tags start where they belong, with no leftover offsets from a previous layout
      wraps.forEach((w) => (w.style.transform = ''));
      if (mobileMQ.matches) nodes = [];
    };

    const onMove = (e) => {
      const r = box.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (mouse.lx !== null) {
        mouse.vx = x - mouse.lx;
        mouse.vy = y - mouse.ly;
      }
      mouse.lx = x;
      mouse.ly = y;
      mouse.x = x;
      mouse.y = y;
    };

    const step = () => {
      // On phones the string is hidden and the tags stay in the normal flow, so there is nothing to simulate
      if (mobileMQ.matches) {
        raf = requestAnimationFrame(step);
        return;
      }
      t += 1;

      // Mouse: points near the pointer get dragged along its movement, and nudged away from it
      mouse.vx *= 0.8;
      mouse.vy *= 0.8;
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d > REACH || d === 0) continue;
        const w = (1 - d / REACH) ** 2;
        const weight = n.tag >= 0 ? 0.6 : 1;
        n.vx += (mouse.vx * 0.55 + (dx / d) * 2.2) * w * weight;
        n.vy += (mouse.vy * 0.55 + (dy / d) * 2.2) * w * weight;
      }

      // Springs: each point is pulled back toward its rest spot, and each link keeps its spacing
      // (stretching it builds tension, which pulls it back like real elastic)
      const fx = new Float32Array(nodes.length);
      const fy = new Float32Array(nodes.length);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.fixed) continue;
        const k = n.tag >= 0 ? K_REST_TAG : K_REST_MID;
        fx[i] += (n.rx - n.x) * k;
        fy[i] += (n.ry - n.y) * k;
      }
      let tension = 0;
      for (const [a, b, L0] of links) {
        const A = nodes[a];
        const B = nodes[b];
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        const diff = d - L0;
        tension += Math.abs(diff);
        const f = K_SEG * diff;
        const ux = (dx / d) * f;
        const uy = (dy / d) * f;
        fx[a] += ux;
        fy[a] += uy;
        fx[b] -= ux;
        fy[b] -= uy;
      }

      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.tag >= 0) n.vx += Math.sin(t / 40 + n.tag * 1.7) * 0.012; // idle sway, so the tags never fully rest
        n.vx = clamp((n.vx + fx[i]) * DAMP, -30, 30);
        n.vy = clamp((n.vy + fy[i]) * DAMP, -30, 30);
        n.x += n.vx;
        n.y += n.vy;
      }

      // Draw the string as one polyline. Opacity rises a little with tension, so a stretched string reads brighter.
      let d = `M${nodes[0].x.toFixed(1)} ${nodes[0].y.toFixed(1)}`;
      for (let i = 1; i < nodes.length; i++) d += ` L${nodes[i].x.toFixed(1)} ${nodes[i].y.toFixed(1)}`;
      path.setAttribute('d', d);
      path.style.opacity = clamp(0.5 + (tension / links.length) * 0.4, 0.5, 1).toFixed(3);

      // Each tag hangs from its top-centre and swings with its own horizontal motion
      tagNode.forEach((ni, i) => {
        const n = nodes[ni];
        const dx = n.x - n.rx;
        const dy = n.y - n.ry;
        const rot = clamp(dx * 0.22 + n.vx * 0.9, -16, 16);
        wraps[i].style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)`;
      });

      raf = requestAnimationFrame(step);
    };

    layout();
    document.fonts?.ready.then(layout);
    window.addEventListener('resize', layout);
    window.addEventListener('pointermove', onMove);
    if (!reduce) raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', layout);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  const words = ['I’m', 'Shivmani', 'a', 'builder', 'of', 'fast', 'products.'];

  return (
    <section className="about" id="about" ref={sectionRef}>
      <div className="about__grain" aria-hidden="true" />

      <p className="about__label">[ About ]</p>

      <h2 className="about__display" aria-label="I'm Shivmani, a builder of fast products.">
        {words.map((w, i) => (
          <span className="about__line" key={i}>
            <span className={`about__word ${w === 'Shivmani' ? 'about__word--serif' : ''}`}>{w}</span>
          </span>
        ))}
      </h2>

      <p className="about__body">
        BCA final-year student and a full stack developer with three years of building: a school
        portal, an emergency dispatch prototype, a Java practice platform with an AI tutor. I put
        architecture before decoration, and I treat every product like my own.
      </p>

      <div className="about__tags" ref={tagsRef}>
        <svg className="about__string" aria-hidden="true">
          <path ref={stringRef} />
        </svg>
        {TAGS.map((t, i) => (
          <span
            key={t.text}
            ref={(el) => (wrapRefs.current[i] = el)}
            className="about__tag-wrap"
            style={{ left: t.x, top: t.y }}
          >
            <span className={`about__tag about__tag--${t.size}`}>{t.text}</span>
          </span>
        ))}
      </div>

      <div className="about__count">
        <span ref={countRef} className="about__num">0+</span>
        <span className="about__num-label">years building</span>
      </div>
    </section>
  );
}
