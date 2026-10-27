// The four credit titles. The scroll is "time" in a frozen slow-motion moment: the camera flies forward
// through a field of hanging debris and sparks. Each title sits in the world. Its letters tumble in,
// hold, then a slash cuts the title in two, the halves slide apart and the camera pushes through the gap
// toward the next title. The last title stays. The small label above each title is HTML (see FilmHud).
export const PLATES = [
  { label: 'A film by', text: 'Shivmani Singh' },
  { label: 'Designed & Developed by', text: 'Shivmani Singh' },
  { label: 'Lead Engineer', text: 'Shivmani Singh' },
  { label: 'Coming up next', text: 'Full Stack Developer' },
];

// Scroll progress windows (0..1 across the whole scroll track). STEP equals DUR, so plates never overlap.
export const START = 0.14;
export const STEP = 0.215;
export const DUR = 0.215;
