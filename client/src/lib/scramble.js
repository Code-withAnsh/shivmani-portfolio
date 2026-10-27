const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#/\\_<>+*';

// Jumbles an element's text and settles it letter by letter into `text` (the curtisdesignr hover effect).
// Returns a cancel function.
export function scrambleTo(el, text, duration = 700) {
  let raf = 0;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const settled = Math.floor(p * text.length);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ' || i < settled) out += ch;
      else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
