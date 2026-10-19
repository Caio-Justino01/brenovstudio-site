/** Repeated clicks restart one bounded pulse instead of adding force. */
export const LIQUID_DURATION = 6.4;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export function liquidEnvelope(age: number) {
  if (age < 0 || age >= LIQUID_DURATION) return { energy: 0, material: 0 };
  return {
    energy: (1 - smooth(.45, 2.1, age)) * smooth(0, .35, age),
    material: smooth(0, .18, age) * (1 - smooth(4.8, LIQUID_DURATION, age)),
  };
}
export function createLiquidPulse() {
  let age = LIQUID_DURATION;
  return {
    start() { age = 0; },
    reset() { age = LIQUID_DURATION; },
    advance(dt: number) {
      age = Math.min(LIQUID_DURATION, age + Math.max(0, Math.min(dt, .05)));
      return { ...liquidEnvelope(age), active: age < LIQUID_DURATION, age };
    },
  };
}
