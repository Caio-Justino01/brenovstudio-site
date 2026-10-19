export type OpeningMode = 'hidden' | 'fade' | 'visible';

export const OPENING_WAIT_TIMEOUT = 3000;
export const SCENE_INITIALIZATION_TIMEOUT = 10000;

export function shouldPlayOpening(hash: string, scrollY: number, reducedMotion: boolean) {
  return !reducedMotion && scrollY <= 1 && (!hash || hash === '#inicio');
}
