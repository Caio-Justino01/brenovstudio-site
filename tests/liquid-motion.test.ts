import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLiquidPulse, liquidEnvelope, LIQUID_DURATION } from '../src/lib/liquidMotion.ts';

test('the independent click pulse starts inactive and eases force in over 350 ms', () => {
  const pulse = createLiquidPulse();
  assert.deepEqual(pulse.advance(1 / 60), { energy: 0, material: 0, active: false, age: LIQUID_DURATION });
  pulse.start();
  const first = pulse.advance(1 / 60);
  assert.ok(first.energy > 0 && first.energy < 1);
  assert.ok(first.material > 0 && first.material < 1);
  assert.equal(liquidEnvelope(.4).material, 1);
  assert.equal(liquidEnvelope(.4).energy, 1);
  assert.ok(liquidEnvelope(.12).energy < .3);
  assert.equal(liquidEnvelope(.35).energy, 1);
});

test('force stops before the logo crossfades, leaving time for elastic return', () => {
  assert.equal(liquidEnvelope(2.1).energy, 0);
  assert.equal(liquidEnvelope(4.8).material, 1);
  assert.equal(liquidEnvelope(6.4).material, 0);
  assert.deepEqual(liquidEnvelope(-1), { energy: 0, material: 0 });
  for (let t = 0; t < 10; t += .01) {
    const state = liquidEnvelope(t);
    assert.ok(state.energy >= 0 && state.energy <= 1);
    assert.ok(state.material >= 0 && state.material <= 1);
  }
});

test('rapid clicks restart one bounded pulse and reset cancels it', () => {
  const pulse = createLiquidPulse();
  for (let i = 0; i < 1200; i++) {
    pulse.start();
    assert.ok(pulse.advance(1 / 60).energy <= 1);
  }
  pulse.reset();
  assert.equal(pulse.advance(.01).active, false);
});

test('return completes at normal refresh rates; stalls do not skip the material return', () => {
  for (const hz of [20, 30, 60, 120, 144]) {
    const pulse = createLiquidPulse();
    pulse.start();
    let result = pulse.advance(0);
    for (let i = 0; i < Math.ceil(LIQUID_DURATION * hz) + 1; i++) result = pulse.advance(1 / hz);
    assert.equal(result.active, false);
    assert.equal(result.material, 0);
  }
  const pulse = createLiquidPulse();
  pulse.start();
  assert.equal(pulse.advance(20).age, .05);
  assert.equal(pulse.advance(-5).age, .05);
});
