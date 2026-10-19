export const EXIT_DURATION = 2.5;
export const EXIT_FOCUS = .35;
export const EXIT_HANDOFF = 1.9;
export const EXIT_RELEASE_END = 1.6;
export const EXIT_LIFE_MIN = .55;
export const EXIT_LIFE_MAX = .85;

export function exitFocus(seconds: number, originalSize: number, width: number, height: number) {
  const t = Math.max(0, Math.min(1, seconds / EXIT_FOCUS));
  const progress = t * t * (3 - 2 * t);
  const target = Math.min(originalSize * 1.04, Math.min(width, height) * .88);
  return { progress, scale: 1 + (target / Math.max(originalSize, 1) - 1) * progress };
}

/** Shared spatial timing: image removal and particle release use the same home position. */
export const dissolveGLSL = /* glsl */ `
float releaseTime(vec2 home) {
  float field=clamp(noise(home*3.1+vec2(2.,7.))*.68
    +noise(home*8.3+10.)*.22+(home.y+.5)*.10,0.,1.);
  return ${EXIT_FOCUS} + field*${EXIT_RELEASE_END - EXIT_FOCUS};
}
float exitAge(vec2 home,float progress) { return progress*${EXIT_DURATION}-releaseTime(home); }
float exitAt(vec2 homePx,float size,float progress) {
  return smoothstep(0.,.10,exitAge(homePx/max(size,1.),progress));
}
`;
