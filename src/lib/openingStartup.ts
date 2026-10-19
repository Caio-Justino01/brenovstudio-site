import { shouldPlayOpening, type DocumentNavigation } from './opening.ts';

const sectionHashes = ['#indice', '#historia', '#portfolio', '#orcamento'];
type NavigationPerformance = {
  getEntriesByType: (type: string) => readonly { type?: string }[];
  navigation?: { type: number };
};

export type OpeningStartup = Readonly<{
  navigation: DocumentNavigation;
  playFormation: boolean;
  startAtTop: boolean;
  alignInitialSection: boolean;
}>;

/** Read once per document, before React mounts. A restored scroll offset is not an entry intent. */
export function readDocumentNavigation(performance: NavigationPerformance): DocumentNavigation {
  const navigation = performance.getEntriesByType('navigation')[0]?.type;
  if (navigation === 'navigate' || navigation === 'reload' || navigation === 'back_forward') return navigation;
  // Older Safari exposes the legacy timing object instead of the navigation entry.
  if (performance.navigation?.type === 2) return 'back_forward';
  return performance.navigation?.type === 1 ? 'reload' : 'navigate';
}

export function createOpeningStartup(hash: string, reducedMotion: boolean, navigation: DocumentNavigation): OpeningStartup {
  const restored = navigation === 'back_forward';
  return {
    navigation,
    playFormation: shouldPlayOpening(hash, reducedMotion, navigation),
    startAtTop: !restored && (!hash || hash === '#inicio'),
    alignInitialSection: !restored && sectionHashes.includes(hash),
  };
}

export function captureOpeningStartup(browser: Pick<Window, 'location' | 'matchMedia' | 'performance'>): OpeningStartup {
  return createOpeningStartup(browser.location.hash, browser.matchMedia('(prefers-reduced-motion: reduce)').matches,
    readDocumentNavigation(browser.performance as NavigationPerformance));
}

type PositionHost = {
  history: { scrollRestoration: ScrollRestoration };
  scrollTo: (options: ScrollToOptions) => void;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};
type SyncRestoration = (mode: ScrollRestoration) => void;

/** Own the initial top only. Later gestures and history traversal remain native. */
export function holdOpeningPosition(browser: PositionHost, reset: boolean, synchronize: SyncRestoration = () => {},
  previous = browser.history.scrollRestoration) {
  browser.history.scrollRestoration = 'manual';
  if (reset) browser.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  synchronize('manual');
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    browser.removeEventListener('pagehide', release);
    browser.history.scrollRestoration = previous;
    synchronize(previous);
  };
  // A document can leave without React unmounting, including bfcache snapshots.
  browser.addEventListener('pagehide', release);
  return release;
}

export type OpeningPosition = { acquire: () => () => void; release: () => void };

/** Prepare before any child can measure a restored offset or initialize a scroll pin. */
export function prepareOpeningPosition(browser: PositionHost, startup: OpeningStartup, synchronize: SyncRestoration): OpeningPosition | null {
  if (!startup.startAtTop) return null;
  const previous = browser.history.scrollRestoration;
  let held: (() => void) | null = holdOpeningPosition(browser, true, synchronize, previous);
  return {
    acquire() {
      held ??= holdOpeningPosition(browser, false, synchronize, previous);
      const current = held;
      return () => { current(); if (held === current) held = null; };
    },
    release() { held?.(); held = null; },
  };
}
