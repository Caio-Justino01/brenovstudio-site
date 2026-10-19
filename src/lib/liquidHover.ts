export const HOVER_FIELD_SIZE = 128;
export const MAX_HOVER_SEGMENTS = 16;
export const HOVER_LIFETIME = 3.4;
export const LIQUID_SPEED = .65;
export const LIQUID_STEP = 1 / 120;
export type HoverSegment = { fromX: number; fromY: number; toX: number; toY: number };

/** Fixed physical steps keep damping and velocity limits independent of display refresh. */
export function createLiquidClock() {
  let remainder = 0;
  return {
    advance(delta: number) {
      remainder += Math.max(0, Math.min(.05, Number.isFinite(delta) ? delta : 0)) * LIQUID_SPEED;
      const steps = Math.floor((remainder + 1e-10) / LIQUID_STEP);
      remainder = Math.max(0, remainder - steps * LIQUID_STEP);
      return steps;
    },
    reset() { remainder = 0; },
  };
}

/** Home coordinates, centered on the logo. Stop breaks the path, not its pending stamps. */
export function createHoverTrail() {
  let previous: { x: number; y: number } | undefined;
  let segments: HoverSegment[] = [];
  return {
    move(x: number, y: number, active: boolean) {
      if (!active || !Number.isFinite(x) || !Number.isFinite(y)) { previous = undefined; return false; }
      if (previous && Math.hypot(x - previous.x, y - previous.y) < .0005) return false;
      const next = { fromX: previous?.x ?? x, fromY: previous?.y ?? y, toX: x, toY: y };
      if (segments.length < MAX_HOVER_SEGMENTS) segments.push(next);
      else if (!previous) { segments.shift(); segments.push(next); }
      else Object.assign(segments[segments.length - 1], { toX: x, toY: y });
      previous = { x, y };
      return true;
    },
    take() { const pending = segments; segments = []; return pending; },
    reset() { previous = undefined; segments = []; },
    get pending() { return segments.length; },
  };
}
