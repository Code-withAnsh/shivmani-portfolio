import { useEffect, useRef, useState } from 'react';
import { asset } from '../lib/asset.js';
import DustBackground from './DustBackground.jsx';
import CloudWipe from './CloudWipe.jsx';
import { unlockAudio, startDrone, stopDrone, playWhoosh } from '../lib/sound.js';
import { scrambleTo } from '../lib/scramble.js';

const HOLD_MS = 2000;
// The page UI starts animating this many seconds before the video ends, so there is no hard cut.
const REVEAL_BEFORE_END_S = 1.8;

// Phases: idle -> holding (press) -> clouds (clouds close over the dust) -> playing (clouds part, video plays)
// -> ended (video stays frozen on its last frame and becomes the landing page background)
export default function Intro({ onReveal, onStart }) {
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const frameRef = useRef(null);
  const startRef = useRef(0);
  const videoRef = useRef(null);
  const revealedRef = useRef(false);
  const holdRef = useRef(0);
  const labelRef = useRef(null);
  const [cloudsDone, setCloudsDone] = useState(false);

  const reveal = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealing(true);
    onReveal();
  };

  // Hold timer: measures how long the pointer has been down.
  const startHold = (e) => {
    if (phase !== 'idle') return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    unlockAudio();
    startDrone();
    onStart?.();
    setPhase('holding');
    startRef.current = performance.now();

    const tick = (now) => {
      const p = Math.min((now - startRef.current) / HOLD_MS, 1);
      holdRef.current = p;
      setProgress(p);
      if (p >= 1) {
        beginVideo();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const cancelHold = () => {
    if (phase !== 'holding') return;
    cancelAnimationFrame(frameRef.current);
    stopDrone();
    holdRef.current = 0;
    setProgress(0);
    setPhase('idle');
  };

  // Hold complete: clouds rush in over the dusty screen with a whoosh and the drone fades out.
  const beginVideo = () => {
    setPhase('clouds');
    stopDrone(1.2);
    playWhoosh(1.1);
  };

  // Clouds fully cover the screen: swap to the video underneath, then part the clouds.
  const handleClosed = () => {
    setPhase('playing');
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {
      // If the browser refuses sound, play muted instead of showing a frozen frame.
      video.muted = true;
      video.play().catch(() => {});
    });
    playWhoosh(1.6);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    if (v.duration - v.currentTime <= REVEAL_BEFORE_END_S) reveal();
  };

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
      stopDrone(0.2);
    },
    []
  );

  const showHold = phase === 'idle' || phase === 'holding' || phase === 'clouds';
  const count = progress < 0.34 ? '3' : progress < 0.67 ? '2' : '1';
  const onHoverLabel = () => {
    if (phase === 'idle' && labelRef.current) scrambleTo(labelRef.current, 'HOLD', 450);
  };

  return (
    <div
      className={`intro intro--${phase} ${revealing ? 'intro--reveal' : ''}`}
      aria-label="Intro"
      style={{ '--hold': progress }}
    >
      <video
        ref={videoRef}
        className={`intro__video ${phase === 'playing' || phase === 'ended' ? 'intro__video--on' : ''}`}
        src={asset('videos/intro.mp4')}
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPhase('ended')}
        onError={reveal}
      />

      {showHold && (
        <>
          <DustBackground holdRef={holdRef} />
          <div className="intro__title" aria-hidden="true">SHIVMANI</div>
          <header className="intro__meta intro__meta--top">
            <span>Shivmani Singh</span>
            <span>A portfolio, in one reel</span>
          </header>
          <div className="intro__hold">
            <button
              type="button"
              className="hold-button"
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              onPointerEnter={onHoverLabel}
              onContextMenu={(e) => e.preventDefault()}
            >
              <svg viewBox="0 0 240 240" className="hold-button__ring" aria-hidden="true">
                {/* Film-leader face: tick marks, crosshair and a clock wipe that fills as you hold */}
                {Array.from({ length: 48 }, (_, i) => (
                  <line
                    key={i}
                    x1="120"
                    y1="6"
                    x2="120"
                    y2={i % 4 === 0 ? 20 : 13}
                    transform={`rotate(${i * 7.5} 120 120)`}
                    className="hold-button__tick"
                  />
                ))}
                <circle cx="120" cy="120" r="84" className="hold-button__track" />
                <circle
                  cx="120"
                  cy="120"
                  r="42"
                  className="hold-button__wipe"
                  style={{ strokeDashoffset: 264 - 264 * progress }}
                />
                <line x1="120" y1="28" x2="120" y2="212" className="hold-button__cross" />
                <line x1="28" y1="120" x2="212" y2="120" className="hold-button__cross" />
              </svg>
              {phase === 'idle' ? (
                <span ref={labelRef} className="hold-button__label">HOLD</span>
              ) : (
                <span key={count} className="hold-button__count">{count}</span>
              )}
            </button>
            <p className="intro__hint">Press and hold for 2 seconds to start the film</p>
          </div>
          <footer className="intro__meta intro__meta--bottom">
            <span>Sound on, please</span>
            <span>Reel 00 · Dust</span>
          </footer>
        </>
      )}

      {(phase === 'clouds' || phase === 'playing') && !cloudsDone && (
        <CloudWipe
          phase={phase === 'clouds' ? 'close' : 'open'}
          onClosed={handleClosed}
          onDone={() => setCloudsDone(true)}
        />
      )}
    </div>
  );
}
