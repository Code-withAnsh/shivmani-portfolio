import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Intro from './components/Intro.jsx';
import Landing from './components/Landing.jsx';

// Everything below the landing page is split into its own chunk. The chunks start downloading as soon
// as the visitor begins the hold (see preloadPage), so they are ready by the time the page appears.
const loadScrollStage = () => import('./components/ScrollStage.jsx');
const loadHomepage = () => import('./components/Homepage.jsx');
const loadAbout = () => import('./components/About.jsx');
const loadEducation = () => import('./components/Education.jsx');
const loadProjects = () => import('./components/Projects.jsx');
const loadTechStack = () => import('./components/TechStack.jsx');
const loadGallery = () => import('./components/Gallery.jsx');
const loadFooter = () => import('./components/Footer.jsx');

const ScrollStage = lazy(loadScrollStage);
const Homepage = lazy(loadHomepage);
const About = lazy(loadAbout);
const Education = lazy(loadEducation);
const Projects = lazy(loadProjects);
const TechStack = lazy(loadTechStack);
const Gallery = lazy(loadGallery);
const Footer = lazy(loadFooter);

const preloadPage = () =>
  Promise.all([
    loadScrollStage(),
    loadHomepage(),
    loadAbout(),
    loadEducation(),
    loadProjects(),
    loadTechStack(),
    loadGallery(),
    loadFooter(),
  ]);

export default function App() {
  const [revealed, setRevealed] = useState(false);
  const handleReveal = useCallback(() => setRevealed(true), []);

  // The page is locked while the intro plays, and scrollable once the landing page appears.
  useEffect(() => {
    document.documentElement.classList.toggle('locked', !revealed);
  }, [revealed]);

  return (
    <>
      <Intro onReveal={handleReveal} onStart={preloadPage} />
      {revealed && (
        <>
          <Landing />
          <Suspense fallback={null}>
            <ScrollStage />
          </Suspense>
          <Suspense fallback={null}>
            <Homepage />
          </Suspense>
          <Suspense fallback={null}>
            <About />
          </Suspense>
          <Suspense fallback={null}>
            <Education />
          </Suspense>
          <Suspense fallback={null}>
            <Projects />
          </Suspense>
          <Suspense fallback={null}>
            <TechStack />
          </Suspense>
          <Suspense fallback={null}>
            <Gallery />
          </Suspense>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </>
      )}
    </>
  );
}
