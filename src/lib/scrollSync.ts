type ScrollProgressSource = { update: () => unknown; progress: number };

/** Native scroll events arrive later; flush the library cache before synchronizing a frame. */
export function syncScrollProgress(source: ScrollProgressSource, flush: () => void) {
  flush();
  source.update();
  return source.progress;
}
