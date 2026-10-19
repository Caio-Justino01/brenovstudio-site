/** The visual release and its physical integration consume the same bounded frame time. */
export function createExitClock(duration: number, handoff: number) {
  let seconds = 0, active = false;
  return {
    start() { seconds = 0; active = true; },
    reset() { seconds = 0; active = false; },
    advance(delta: number) {
      if (active) {
        seconds = Math.min(duration, seconds + Math.max(0, Math.min(.05, Number.isFinite(delta) ? delta : 0)));
        if (duration - seconds < 1e-9) { seconds = duration; active = false; }
      }
      return { seconds, progress: seconds / duration, covered: seconds >= handoff, complete: seconds >= duration };
    },
  };
}

/** Exactly-once handoff and settlement, also used for cancellation/disposal. */
export function createExitTransition() {
  let pending: { promise: Promise<void>; resolve: () => void; covered?: () => void; handed: boolean } | undefined;
  return {
    start(covered?: () => void) {
      if (pending) return pending.promise;
      let resolve!: () => void;
      const promise = new Promise<void>((done) => { resolve = done; });
      pending = { promise, resolve, covered, handed: false };
      return promise;
    },
    cover() { if (pending && !pending.handed) { pending.handed = true; pending.covered?.(); } },
    finish() { const current = pending; pending = undefined; current?.resolve(); },
    get active() { return Boolean(pending); },
  };
}

export async function runIndexExit(burst: (covered: () => void) => Promise<void>, active: () => boolean,
  handoff: () => void, reveal: () => void) {
  let handed = false;
  const cover = () => { if (!handed && active()) { handed = true; handoff(); } };
  await burst(cover);
  if (!active()) return;
  // Context loss or reduced motion can resolve the scene before its midpoint.
  cover(); reveal();
}
