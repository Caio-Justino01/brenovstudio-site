type DrawingBufferRenderer = { setDrawingBufferSize: (width: number, height: number, pixelRatio: number) => void };
const drawingBuffers = new WeakMap<DrawingBufferRenderer, { width: number; height: number; pixelRatio: number }>();

/** Set the logical size and DPR together, avoiding two canvas reallocations per resize. */
export function resizeDrawingBuffer(renderer: DrawingBufferRenderer, width: number, height: number, pixelRatio: number) {
  const previous = drawingBuffers.get(renderer);
  if (previous?.width === width && previous.height === height && previous.pixelRatio === pixelRatio) return false;
  renderer.setDrawingBufferSize(width, height, pixelRatio);
  drawingBuffers.set(renderer, { width, height, pixelRatio });
  return true;
}

/** Three disposes its objects separately from relinquishing the browser's context slot. */
export function releaseRenderer(renderer: { dispose: () => void; forceContextLoss: () => void }) {
  try { renderer.dispose(); }
  finally { renderer.forceContextLoss(); }
}
