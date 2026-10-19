import test from 'node:test';
import assert from 'node:assert/strict';
import { EXIT_DURATION, EXIT_FOCUS, EXIT_HANDOFF, EXIT_RELEASE_END, EXIT_LIFE_MIN, EXIT_LIFE_MAX, exitFocus } from '../src/lib/exitDissolve.ts';

test('o foco começa na transformação atual, termina suavemente e não cresce além de 4%', () => {
  assert.deepEqual(exitFocus(0, 600, 1440, 900), { progress: 0, scale: 1 });
  const middle = exitFocus(EXIT_FOCUS / 2, 600, 1440, 900);
  assert.equal(middle.progress, .5);
  assert.equal(middle.scale, 1.02);
  assert.equal(exitFocus(EXIT_FOCUS, 600, 1440, 900).scale, 1.04);
  assert.deepEqual(exitFocus(20, 600, 1440, 900), exitFocus(EXIT_FOCUS, 600, 1440, 900));
});

test('o enquadramento final cabe no menor lado, incluindo celular e paisagem', () => {
  for (const [width, height, original] of [[320, 800, 300], [390, 844, 360], [768, 1024, 800], [1024, 900, 900], [1440, 900, 700], [844, 390, 550]]) {
    const focused = original * exitFocus(EXIT_FOCUS, original, width, height).scale;
    assert.ok(focused <= Math.min(width, height) * .88 + 1e-9);
    assert.ok(focused <= original * 1.04 + 1e-9);
  }
});

test('a entrega acontece durante a dissipação e nenhum grão é cortado pelo fim da Promise', () => {
  assert.ok(EXIT_FOCUS < EXIT_RELEASE_END);
  assert.ok(EXIT_RELEASE_END < EXIT_HANDOFF && EXIT_HANDOFF < EXIT_DURATION);
  assert.ok(EXIT_LIFE_MIN > .1, 'a partícula deve sobreviver à passagem da imagem para os grãos');
  assert.ok(EXIT_RELEASE_END + EXIT_LIFE_MAX < EXIT_DURATION);
});
