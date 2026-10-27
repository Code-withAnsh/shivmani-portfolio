// Gallery photos. Files live in client/public/gallery (converted to WebP, 1400px max).
// `caption` is shown on hover. Captions describe the photo; no event names or dates were confirmed yet.
const g = (n, caption, extra = {}) => ({ src: `/gallery/${n}.webp`, caption, ...extra });

export const GALLERY = [
  g('01', 'Campus, first year', { size: 'wide' }),
  g('07', '3rd rank · hackathon certificate', { size: 'tall', cert: true }),
  g('02', 'Hack day, on the mic', { size: 'normal' }),
  g('04', 'Hack day, with the team', { size: 'wide' }),
  g('06', 'Hack day, the build', { size: 'tall' }),
  g('03', 'Team, late build', { size: 'normal' }),
  g('05', 'Night session', { size: 'normal' }),
];
