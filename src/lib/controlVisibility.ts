export const CONTROL_VISIBLE_RATIO = .25;

/** The observer threshold and the mount policy must agree during native scrolling. */
export function controlIntersectionVisible(entry: { isIntersecting: boolean; intersectionRatio: number }) {
  return entry.isIntersecting && entry.intersectionRatio >= CONTROL_VISIBLE_RATIO;
}
