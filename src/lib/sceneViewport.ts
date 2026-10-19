/** 100svh keeps browser chrome expansion from rebuilding a scroll scene mid-gesture. */
export function sceneViewportHeight(root: HTMLElement | null, fallback: number) {
  const height = root?.querySelector<HTMLElement>('.scene-viewport-measure')?.offsetHeight;
  return height && height > 0 ? height : fallback;
}
