import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiquidClock, LIQUID_STEP, LIQUID_SPEED } from '../src/lib/liquidHover.ts';

test('a física avança o mesmo número de passos entre 20 e 144 Hz', () => {
  const totals = [20, 30, 60, 120, 144].map((hz) => {
    const clock = createLiquidClock();
    let total = 0;
    for (let frame = 0; frame < hz * 3; frame++) total += clock.advance(1 / hz);
    return total;
  });
  assert.deepEqual(totals, totals.map(() => Math.round(3 * LIQUID_SPEED / LIQUID_STEP)));
});

test('reset descarta fração antiga e um travamento não lança centenas de passos', () => {
  const clock = createLiquidClock();
  assert.equal(clock.advance(.01), 0);
  clock.reset();
  assert.equal(clock.advance(.01), 0);
  assert.equal(clock.advance(10), 4);
  assert.equal(clock.advance(NaN), 0);
});
