import { getPageVisibility, type PageVisibility } from './pageVisibility.ts';

/** Yield a long setup task without leaving an uncancellable timer behind. */
export function yieldToBrowser(signal?: AbortSignal, visibility: PageVisibility | undefined = getPageVisibility()) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopVisibility = () => {};
    const cleanup = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined; stopVisibility();
      signal?.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      reject(signal?.reason);
    };
    const schedule = () => {
      if (visibility?.isHidden()) {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
      } else if (timer === undefined) timer = setTimeout(() => { cleanup(); resolve(); }, 0);
    };
    stopVisibility = visibility?.subscribe(schedule) ?? stopVisibility;
    signal?.addEventListener('abort', abort, { once: true });
    schedule();
  });
}

/** Keep every physical step, in order, while allowing navigation and cancellation between batches. */
export async function runCooperativeSteps(total: number, step: (index: number) => void, options: {
  signal?: AbortSignal; batchSize?: number; yieldTask?: (signal?: AbortSignal) => Promise<void>;
} = {}) {
  const { signal, batchSize = 8, yieldTask = yieldToBrowser } = options;
  const batch = Math.max(1, Math.floor(batchSize));
  signal?.throwIfAborted();
  for (let index = 1; index <= total; index++) {
    signal?.throwIfAborted();
    step(index);
    if (index < total && index % batch === 0) {
      await yieldTask(signal);
      signal?.throwIfAborted();
    }
  }
}
