export type IndexEntry = 'idle' | 'hold' | 'reveal';
export const previewStops = [0, .5, 1] as const;
export function previewAt(progress: number) { return progress < .31 ? 0 : progress < .79 ? 1 : 2; }
export function indexLayout(width: number, height: number, header: number, reduced: boolean, contentHeight = 560) {
  const available = Math.max(0, height - header - 48);
  return { pinned: !reduced && available >= Math.max(560, contentHeight), available, distance: height * (width < 768 ? 2 : 2.4) };
}

export type IndexMetrics = { width: number; height: number; header: number; reduced: boolean; contentHeight: number };
export function stableIndexMetrics(next: IndexMetrics, previous: IndexMetrics): IndexMetrics {
  const pixel = (key: 'width' | 'height' | 'header' | 'contentHeight') =>
    Math.abs(next[key] - previous[key]) < 1 ? previous[key] : Math.round(next[key]);
  return { width: pixel('width'), height: pixel('height'), header: pixel('header'), contentHeight: pixel('contentHeight'), reduced: next.reduced };
}
export function sameIndexMetrics(a: IndexMetrics, b: IndexMetrics) {
  return a.width === b.width && a.height === b.height && a.header === b.header && a.reduced === b.reduced && a.contentHeight === b.contentHeight;
}
export type IndexProgress = { scrollProgress: number; visualProgress: number };
export function captureIndexProgress(start: number, end: number, top: number, visual: number): IndexProgress | null {
  if (![start, end, top, visual].every(Number.isFinite) || end <= start || top < start || top > end) return null;
  return { scrollProgress: (top - start) / (end - start), visualProgress: Math.max(0, Math.min(1, visual)) };
}
export function restoreIndexPosition(progress: IndexProgress, start: number, end: number) {
  return start + Math.max(0, Math.min(1, progress.scrollProgress)) * Math.max(0, end - start);
}
