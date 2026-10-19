export type LogoTransform = { x: number; y: number; angle: number };

/** CSS-pixel coordinates, with Y pointing up, as in the orthographic scene. */
export function logoTransform(time: number, mobile: boolean, hoverX: number, hoverY: number,
  reactionAge: number, reactionX: number, reactionY: number): LogoTransform {
  const amplitude = mobile ? .5 : 1;
  const reaction = reactionAge >= 0 && reactionAge < 2
    ? Math.sin(reactionAge * 6) * Math.exp(-reactionAge * 2.5) : 0;
  const maxHover = mobile ? 3 : 5;
  return {
    x: Math.sin(time * Math.PI * 2 / 14) * 3 * amplitude - Math.max(-1, Math.min(1, hoverX)) * maxHover
      + reactionX * 3 * amplitude * reaction,
    y: Math.sin(time * Math.PI * 2 / 10) * 5 * amplitude - Math.max(-1, Math.min(1, hoverY)) * maxHover
      + reactionY * 3 * amplitude * reaction,
    angle: Math.sin(time * Math.PI * 2 / 14) * .35 * Math.PI / 180 * amplitude,
  };
}

export function inverseLogoPoint(x: number, y: number, transform: LogoTransform) {
  const dx = x - transform.x, dy = y - transform.y;
  const c = Math.cos(transform.angle), s = Math.sin(transform.angle);
  return { x: dx * c + dy * s, y: -dx * s + dy * c };
}
