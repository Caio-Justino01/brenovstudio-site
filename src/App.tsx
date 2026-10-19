import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Intro } from './components/Intro';
import { Contents } from './components/Contents';
import { type ServiceId } from './config/site';
import { toggleService } from './lib/serviceSelection';
import { SiteNavigation } from './components/SiteNavigation';
import { Story } from './components/Story';
import { Portfolio } from './components/Portfolio';
import { Quote } from './components/Quote';
import { shouldPlayOpening, type OpeningMode } from './lib/opening';
import { alignContentSection, alignIndex, navigateToIndex } from './lib/navigation';
import type { IndexEntry } from './lib/indexMotion';
import { SpaceBackdrop } from './components/SpaceBackdrop';
import { SiteFooter } from './components/SiteFooter';
import { createAnchorRouting } from './lib/anchorRouting';

export function App() {
  const [selectedServices, setSelectedServices] = useState<ServiceId[]>([]);
  const toggleSelectedService = useCallback((id: ServiceId) => setSelectedServices(current => toggleService(current, id)), []);
  const [indexEntry, setIndexEntry] = useState<IndexEntry>('idle');
  const [openingMode, setOpeningMode] = useState<OpeningMode>(() => shouldPlayOpening(
    window.location.hash, window.scrollY, window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ) ? 'hidden' : 'visible');
  const mode = useRef(openingMode);
  const releaseOpening = useCallback((animate: boolean) => {
    if (mode.current === 'visible' || (animate && mode.current !== 'hidden')) return;
    mode.current = animate ? 'fade' : 'visible';
    setOpeningMode(mode.current);
  }, []);
  const formationComplete = useCallback(() => releaseOpening(true), [releaseOpening]);
  const bypassOpening = useCallback(() => releaseOpening(false), [releaseOpening]);
  const enterIndex = useCallback((focus = true) => {
    bypassOpening();
    navigateToIndex(focus);
  }, [bypassOpening]);
  const indexRevealed = useCallback(() => {
    setIndexEntry('idle');
    const index = document.getElementById('indice');
    const caption = document.getElementById('contents-title')?.getBoundingClientRect();
    if (location.hash === '#indice' && caption && caption.bottom > 0 && caption.top < innerHeight) index?.focus({ preventScroll: true });
  }, []);
  const skipToIndex = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    enterIndex();
  };

  useEffect(() => {
    const scroll = () => { if (window.scrollY > 1) bypassOpening(); };
    const key = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) bypassOpening();
    };
    const anchor = (event: globalThis.MouseEvent) => {
      if (event.defaultPrevented || !(event.target instanceof Element) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      bypassOpening();
      const destination = link.getAttribute('href');
      if (destination !== location.hash) return;
      if (destination === '#historia' || destination === '#portfolio' || destination === '#orcamento') {
        event.preventDefault(); alignContentSection(destination.slice(1) as 'historia' | 'portfolio' | 'orcamento', true);
      }
    };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Element && !event.target.closest('#inicio, .site-header, .skip-link')) bypassOpening();
    };
    const pageshow = (event: PageTransitionEvent) => { if (event.persisted) bypassOpening(); scroll(); };
    window.addEventListener('wheel', bypassOpening, { passive: true });
    window.addEventListener('touchmove', bypassOpening, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('keydown', key);
    window.addEventListener('hashchange', bypassOpening);
    window.addEventListener('pageshow', pageshow);
    document.addEventListener('click', anchor);
    document.addEventListener('focusin', focus);
    scroll();
    return () => {
      window.removeEventListener('wheel', bypassOpening);
      window.removeEventListener('touchmove', bypassOpening);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('keydown', key);
      window.removeEventListener('hashchange', bypassOpening);
      window.removeEventListener('pageshow', pageshow);
      document.removeEventListener('click', anchor);
      document.removeEventListener('focusin', focus);
    };
  }, [bypassOpening]);

  useEffect(() => {
    let stopped = false;
    let interrupted = false;
    let frame = 0;
    const destinations = ['#indice', '#historia', '#portfolio', '#orcamento'];
    const routing = createAnchorRouting(destinations);
    const initialSection = destinations.includes(window.location.hash);
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (stopped) return;
        if (window.location.hash === '#indice') alignIndex();
        else if (window.location.hash === '#historia') alignContentSection('historia');
        else if (window.location.hash === '#portfolio') alignContentSection('portfolio');
        else if (window.location.hash === '#orcamento') alignContentSection('orcamento');
      });
    };
    const cancelInitialCorrection = () => { interrupted = true; routing.cancel(); cancelAnimationFrame(frame); };
    const traversal = () => { interrupted = true; routing.traversal(location.hash); cancelAnimationFrame(frame); };
    const explicitLink = (event: globalThis.MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      interrupted = true; cancelAnimationFrame(frame); routing.link(link.hash);
    };
    const hash = () => {
      interrupted = true;
      // A hashchange alone does not identify a click. Back/forward keeps the browser's reading position.
      if (routing.hashchange(location.hash)) schedule();
    };
    window.addEventListener('hashchange', hash);
    window.addEventListener('popstate', traversal);
    window.addEventListener('wheel', cancelInitialCorrection, { passive: true });
    window.addEventListener('touchmove', cancelInitialCorrection, { passive: true });
    window.addEventListener('pointerdown', cancelInitialCorrection, { passive: true });
    window.addEventListener('keydown', cancelInitialCorrection);
    document.addEventListener('click', explicitLink);
    if (initialSection) {
      schedule();
      void document.fonts.ready.then(() => { if (!stopped && !interrupted) schedule(); });
    }
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', hash);
      window.removeEventListener('popstate', traversal);
      window.removeEventListener('wheel', cancelInitialCorrection);
      window.removeEventListener('touchmove', cancelInitialCorrection);
      window.removeEventListener('pointerdown', cancelInitialCorrection);
      window.removeEventListener('keydown', cancelInitialCorrection);
      document.removeEventListener('click', explicitLink);
    };
  }, []);

  return (
    <>
      <SpaceBackdrop />
      <a className="skip-link" href="#indice" onClick={skipToIndex}>Ir para o índice</a>
      <SiteNavigation openingMode={openingMode} exiting={indexEntry === 'hold'} />
      <main>
        <Intro openingMode={openingMode} onFormationComplete={formationComplete} onBypass={bypassOpening} onEnterIndex={enterIndex} onIndexTransition={setIndexEntry} />
        <Contents entry={indexEntry} onEntryComplete={indexRevealed} selectedServices={selectedServices} onToggleService={toggleSelectedService} />
        <Story />
        <Portfolio />
        <Quote selectedServices={selectedServices} onToggleService={toggleSelectedService} />
      </main>
      <SiteFooter />
    </>
  );
}
