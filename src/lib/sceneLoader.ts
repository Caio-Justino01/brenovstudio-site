import { OPENING_WAIT_TIMEOUT, SCENE_INITIALIZATION_TIMEOUT } from './opening.ts';
import { getPageVisibility, type PageVisibility } from './pageVisibility.ts';

type Scene = { restore: () => void; dispose: () => void };
type Clock = { now: () => number; later: (fn: () => void, delay: number) => number; cancel: (id: number) => void };
type Hooks = { signal: AbortSignal; onFailure: (reason?: unknown) => void; onFormationComplete: () => void };

export function startSceneLoader<T extends Scene>(options: {
  load: (hooks: Hooks) => Promise<T>;
  shouldRestore: () => boolean;
  onReady: (scene: T) => void;
  onOpeningTimeout: () => void;
  onFallback: (reason: unknown) => void;
  onFormationComplete: () => void;
}, clock: Clock = {
  now: () => performance.now(),
  later: (fn, delay) => window.setTimeout(fn, delay),
  cancel: (id) => window.clearTimeout(id),
}, visibility: PageVisibility | undefined = getPageVisibility()) {
  const startedAt = clock.now();
  const abort = new AbortController();
  let cancelled = false;
  let failed = false;
  let openingReleased = false;
  let formationNotified = false;
  let scene: T | undefined;
  let openingTimer: number | undefined, sceneTimer: number | undefined;
  let hiddenAt: number | undefined = visibility?.isHidden() ? startedAt : undefined;
  let hiddenTime = 0;
  let stopVisibility = () => {};
  const foregroundElapsed = () => {
    const now = clock.now();
    return Math.max(0, now - startedAt - hiddenTime - (hiddenAt === undefined ? 0 : now - hiddenAt));
  };
  const clearTimers = () => {
    if (openingTimer !== undefined) clock.cancel(openingTimer);
    if (sceneTimer !== undefined) clock.cancel(sceneTimer);
    openingTimer = sceneTimer = undefined;
    stopVisibility();
  };
  const releaseOpening = () => {
    if (cancelled || failed || scene || openingReleased) return;
    openingReleased = true;
    options.onOpeningTimeout();
  };
  const fail = (reason: unknown = new Error('O contexto WebGL foi perdido.')) => {
    if (cancelled || failed) return;
    failed = true;
    clearTimers();
    abort.abort(reason);
    scene?.dispose();
    scene = undefined;
    options.onFallback(reason);
  };
  const complete = () => {
    if (cancelled || failed || formationNotified) return;
    formationNotified = true;
    options.onFormationComplete();
  };
  const armSceneTimer = () => {
    if (sceneTimer !== undefined) clock.cancel(sceneTimer);
    sceneTimer = undefined;
    if (hiddenAt !== undefined || cancelled || failed || scene) return;
    sceneTimer = clock.later(() => fail(new Error('A cena não iniciou em dez segundos com a aba visível.')),
      Math.max(0, SCENE_INITIALIZATION_TIMEOUT - foregroundElapsed()));
  };
  stopVisibility = visibility?.subscribe(() => {
    if (cancelled || failed || scene) return;
    if (visibility.isHidden()) { hiddenAt ??= clock.now(); }
    else if (hiddenAt !== undefined) { hiddenTime += clock.now() - hiddenAt; hiddenAt = undefined; }
    armSceneTimer();
  }) ?? stopVisibility;
  openingTimer = clock.later(releaseOpening, OPENING_WAIT_TIMEOUT);
  armSceneTimer();
  void Promise.resolve().then(() => {
    if (cancelled || failed) return;
    return options.load({ signal: abort.signal, onFailure: fail, onFormationComplete: complete });
  }).then((created) => {
    if (!created) return;
    if (!cancelled && !failed && foregroundElapsed() >= SCENE_INITIALIZATION_TIMEOUT) {
      fail(new Error('A inicialização da cena excedeu dez segundos com a aba visível.'));
    }
    if (cancelled || failed) { created.dispose(); return; }
    if (clock.now() - startedAt >= OPENING_WAIT_TIMEOUT) releaseOpening();
    clearTimers();
    scene = created;
    options.onReady(created);
    if (openingReleased || options.shouldRestore()) created.restore();
  }).catch(fail);

  return () => {
    cancelled = true;
    clearTimers();
    abort.abort();
    scene?.dispose();
    scene = undefined;
  };
}
