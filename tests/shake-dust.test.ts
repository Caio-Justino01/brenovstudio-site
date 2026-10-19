import test from 'node:test';
import assert from 'node:assert/strict';
import { createShakeDust } from '../src/lib/shakeDust.ts';

test('o mesmo percurso solta mais grãos quando a marca balança, em diferentes cadências', () => {
  const totals: number[] = [];
  for (const hz of [30, 60, 120, 144]) {
    const quiet = createShakeDust(false), moving = createShakeDust(false);
    let low = 0, high = 0;
    for (let frame = 0; frame < hz * 4; frame++) {
      const t = frame / hz;
      low += quiet.advance(1 / hz, 0, 0, 120 / hz, t, true).amount;
      high += moving.advance(1 / hz, Math.sin(t * 14) * 5, Math.cos(t * 11) * 3, 120 / hz, t, true).amount;
    }
    assert.ok(high > low * 2); totals.push(high);
  }
  assert.ok(Math.max(...totals) - Math.min(...totals) <= 3);
});

test('repouso não emite e balanço aumenta a emissão sem superar o teto por segundo', () => {
  for (const compact of [false, true]) {
    const still = createShakeDust(compact), moving = createShakeDust(compact);
    const emitted: number[] = [];
    for (let frame = 0; frame < 360; frame++) {
      const t = frame / 60;
      assert.equal(still.advance(1 / 60, 0, 0, 0, t, false).amount, 0);
      const step = moving.advance(1 / 60, Math.sin(t * 14) * 5, Math.cos(t * 11) * 3, 20, t, true);
      for (let i = 0; i < step.amount; i++) emitted.push(t);
    }
    assert.ok(emitted.length > 50);
    for (const t of emitted) assert.ok(emitted.filter((stamp) => stamp > t - 1 + 1e-8 && stamp <= t).length <= (compact ? 20 : 40));
  }
});
test('a cauda termina e reset remove energia e crédito de gestos anteriores', () => {
  const shake = createShakeDust(false);
  for (let i = 0; i < 60; i++) shake.advance(1 / 60, i % 2 ? 5 : -5, 0, 10, i / 60, true);
  let late = 0;
  for (let i = 60; i < 240; i++) {
    const result = shake.advance(1 / 60, 0, 0, 0, i / 60, true);
    if (i > 100) late += result.amount;
  }
  assert.equal(late, 0);
  shake.reset(); assert.deepEqual(shake.advance(1 / 60, 0, 0, 0, 10, false), { amount: 0, energy: 0 });
});
