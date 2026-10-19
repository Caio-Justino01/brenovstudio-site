type FrameResizeOptions = {
  request?: (callback: () => void) => number;
  cancel?: (handle: number) => void;
  observe?: (callback: () => void) => Pick<ResizeObserver, 'observe' | 'disconnect'>;
};

/** Resize delivery only schedules work; layout writes happen in the following frame. */
export function createFrameResizeObserver(callback: () => void, options: FrameResizeOptions = {}) {
  const request = options.request ?? (callback => requestAnimationFrame(callback));
  const cancel = options.cancel ?? (handle => cancelAnimationFrame(handle));
  let frame: number | null = null, disposed = false;
  const observer = (options.observe ?? (notify => new ResizeObserver(notify)))(() => {
    if (disposed || frame !== null) return;
    frame = request(() => {
      frame = null;
      if (!disposed) callback();
    });
  });
  return {
    observe(element: Element) { if (!disposed) observer.observe(element); },
    disconnect() {
      if (disposed) return;
      disposed = true; observer.disconnect();
      if (frame !== null) cancel(frame);
      frame = null;
    },
  };
}
