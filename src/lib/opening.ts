export type OpeningMode = 'hidden' | 'fade' | 'visible';

export const OPENING_WAIT_TIMEOUT = 3000;
export const SCENE_INITIALIZATION_TIMEOUT = 10000;

export type DocumentNavigation = 'navigate' | 'reload' | 'back_forward';

export function shouldPlayOpening(hash: string, reducedMotion: boolean, navigation: DocumentNavigation = 'navigate') {
  return !reducedMotion && navigation !== 'back_forward' && (!hash || hash === '#inicio');
}

/** A handoff can consume a late opening while the same scene is still dissolving. */
export function restoreBypassedOpening(scene: { restore: () => void } | null, pending: boolean, exiting: boolean) {
  if (!pending && !exiting) scene?.restore();
}
