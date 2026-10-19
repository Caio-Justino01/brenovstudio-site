import test from 'node:test';
import assert from 'node:assert/strict';
import { assemblyClock, assemblySamples, replayFrame, REPLAY_COLUMNS, REPLAY_ROWS, REPLAY_INTERVALS } from '../src/lib/assemblyMotion.ts';
import { EXIT_DURATION, EXIT_FOCUS } from '../src/lib/exitDissolve.ts';
import { LIQUID_SPEED, LIQUID_STEP } from '../src/lib/liquidHover.ts';

test('a abertura percorre a saída ao contrário e termina na posição nítida, sem extrapolar', () => {
  assert.ok(assemblyClock(0) < EXIT_DURATION);
  assert.ok(assemblyClock(0) > 1.9, 'começa no material disperso');
  let previous = assemblyClock(0);
  for (let frame = 0; frame <= 360; frame++) {
    const time = assemblyClock(frame / 360);
    assert.ok(time <= previous && time >= 0);
    previous = time;
  }
  assert.equal(assemblyClock(1), 0);
  assert.equal(assemblyClock(2), 0);
  assert.equal(assemblyClock(-1), assemblyClock(0));
  assert.ok(assemblyClock(.9) < EXIT_FOCUS, 'acomodação final devolve a marca ao layout');
});

test('o histórico guarda a trajetória completa nos mesmos passos físicos da saída', () => {
  const samples = assemblySamples();
  assert.equal(samples.length, REPLAY_INTERVALS + 1);
  assert.equal(samples[0], 0);
  assert.ok(Math.abs(samples.at(-1)! * LIQUID_STEP / LIQUID_SPEED - EXIT_DURATION) < 1e-12);
  const span = samples[1] - samples[0];
  for (let i = 1; i < samples.length; i++) assert.equal(samples[i] - samples[i - 1], span);
  assert.ok(samples.length <= REPLAY_COLUMNS * REPLAY_ROWS);
});

test('a leitura interpolada fica dentro dos quadros válidos, inclusive nas extremidades', () => {
  for (let t = -.2; t < EXIT_DURATION + .2; t += .0017) {
    const frame = replayFrame(t);
    assert.ok(frame.from >= 0 && frame.to <= REPLAY_INTERVALS);
    assert.ok(frame.blend >= 0 && frame.blend <= 1);
    if (t > 0 && t < EXIT_DURATION) {
      assert.ok(Math.abs((frame.from + frame.blend) / REPLAY_INTERVALS * EXIT_DURATION - t) < 1e-12);
    }
  }
  assert.deepEqual(replayFrame(0), { from: 0, to: 1, blend: 0 });
  assert.deepEqual(replayFrame(EXIT_DURATION), { from: REPLAY_INTERVALS - 1, to: REPLAY_INTERVALS, blend: 1 });
});
