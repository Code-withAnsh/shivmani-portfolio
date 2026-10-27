import PetalField from './PetalField.jsx';
import CursorRing from './CursorRing.jsx';

// Landing page. It sits on top of the intro video, which stays frozen on its last frame
// (Shivmani standing in front of the palace), so there is no cut between video and page.
// The UI animates in during the last moments of the video, and fades out again on scroll.
export default function Landing() {
  return (
    <main className="landing" id="top">
      <div className="landing__fade">
        <div className="landing__shade" aria-hidden="true" />
        <PetalField />

        <section className="hero">
          <p className="hero__eyebrow">Full Stack Developer</p>
          <h1 className="hero__name" aria-label="Shivmani Singh">
            <span className="line"><span className="line__inner" style={{ '--d': '0.45s' }}>Shivmani</span></span>
            <span className="line"><span className="line__inner" style={{ '--d': '0.65s' }}>Singh</span></span>
          </h1>
          <p className="hero__tagline">Building Fast Scalable Web Products</p>

          {/* Scroll prompt: tells the visitor to scroll, right from the start */}
          <div className="scroll-cue" aria-label="Scroll to talk">
            <span className="scroll-cue__mouse" aria-hidden="true">
              <span className="scroll-cue__wheel" />
            </span>
            <span className="scroll-cue__text">Scroll to Talk</span>
            <span className="scroll-cue__arrows" aria-hidden="true">
              <i />
              <i />
            </span>
          </div>
        </section>
      </div>

      <CursorRing />
    </main>
  );
}
