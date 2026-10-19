export type StoryScrollSettings = {
  distanceRatio: number; minDistance: number; maxDistance: number; inset: number; scrub: number;
  eyes: readonly [number, number]; invitation: readonly [number, number]; identity: readonly [number, number];
  light: { appear: readonly [number, number]; fade: readonly [number, number] };
};
export type StoryMetrics = { width: number; height: number; header: number; stageHeight: number; reduced: boolean; failed: boolean };
export type StoryProgress = { scrollProgress: number; visualProgress: number };
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const ramp = (value: number, range: readonly [number, number]) => {
  const t = clamp((value - range[0]) / Math.max(.001, range[1] - range[0]));
  return t * t * (3 - 2 * t);
};

export function storyLayout(metrics: StoryMetrics, settings: StoryScrollSettings) {
  const valid = [metrics.width, metrics.height, metrics.header, metrics.stageHeight].every(Number.isFinite) && metrics.header >= 0;
  const available = valid ? Math.max(0, metrics.height - metrics.header - settings.inset * 2) : 0;
  const pinned = valid && metrics.width > 0 && metrics.stageHeight > 0 && metrics.stageHeight <= available && !metrics.reduced && !metrics.failed;
  const distance = pinned ? Math.max(settings.minDistance, Math.min(settings.maxDistance, available * settings.distanceRatio)) : 0;
  return { pinned, available, distance, top: (Number.isFinite(metrics.header) ? Math.max(0, metrics.header) : 0) + settings.inset };
}

/** Every visual state is a function of distance, with no elapsed-time input. */
export function storyFrame(progress: number, settings: StoryScrollSettings) {
  const p = clamp(progress);
  return {
    closed: 1 - ramp(p, settings.eyes), invitation: 1 - ramp(p, settings.invitation), identity: ramp(p, settings.identity),
    phase: p <= settings.eyes[0] ? 'closed' : p < settings.eyes[1] ? 'opening' : 'identity',
  };
}

/** One scroll-driven bloom, emitted only after the eyelids have opened. */
export function storyEyeLight(progress: number, settings: StoryScrollSettings) {
  const p = clamp(progress);
  return ramp(p, settings.light.appear) * (1 - ramp(p, settings.light.fade));
}

export function stableStoryMetrics(next: StoryMetrics, previous: StoryMetrics): StoryMetrics {
  const pixel = (key: 'width' | 'height' | 'header' | 'stageHeight') =>
    Math.abs(next[key] - previous[key]) < 1 ? previous[key] : Math.round(next[key]);
  return { width: pixel('width'), height: pixel('height'), header: pixel('header'), stageHeight: pixel('stageHeight'), reduced: next.reduced, failed: next.failed };
}
export function sameStoryMetrics(a: StoryMetrics, b: StoryMetrics) {
  return a.width === b.width && a.height === b.height && a.header === b.header && a.stageHeight === b.stageHeight && a.reduced === b.reduced && a.failed === b.failed;
}
export function captureStoryProgress(start: number, end: number, top: number, visual: number): StoryProgress | null {
  if (![start, end, top, visual].every(Number.isFinite) || end <= start || top < start || top > end) return null;
  return { scrollProgress: clamp((top - start) / (end - start)), visualProgress: clamp(visual) };
}
export function restoreStoryPosition(progress: StoryProgress, start: number, end: number) {
  return start + clamp(progress.scrollProgress) * Math.max(0, end - start);
}
/** A reader past the top of a flow scene stays past that top when extra sticky travel is inserted. */
export function restoreStoryFlowPosition(previousTop: number, stickyTop: number, end: number) {
  return end + Math.max(0, stickyTop - previousTop);
}
export function canRestoreStory(savedRevision: number, revision: number, navigationUntil: number, now: number) {
  return savedRevision === revision && now >= navigationUntil;
}
