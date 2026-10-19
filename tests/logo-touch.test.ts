import test from 'node:test';
import assert from 'node:assert/strict';
import { createLogoTouch, LOGO_TOUCH_SLOP, LOGO_TAP_DURATION } from '../src/lib/logoTouch.ts';

test('contato aceito acompanha o dedo primário e encerra no release sem exigir captura', () => {
  const touch = createLogoTouch();
  assert.equal(touch.move(1, 20, 30), false);
  touch.start(1, 20, 30, 0);
  assert.equal(touch.move(1, 60, 30), true);
  assert.equal(touch.move(2, 60, 30), false);
  assert.equal(touch.finish(2, 60, 30, 100), false);
  assert.equal(touch.move(1, 80, 32), true);
  assert.equal(touch.finish(1, 80, 32, 150), true);
  assert.equal(touch.move(1, 90, 40), false);
});

test('toque curto com pequena oscilação continua iniciando a experiência', () => {
  const touch = createLogoTouch();
  touch.start(1, 100, 100, 0);
  touch.move(1, 100 + LOGO_TOUCH_SLOP / 2, 102);
  touch.finish(1, 103, 102, 150);
  assert.equal(touch.suppressClick(1, 151, 'touch'), false);
});

test('arrastar e voltar ao ponto inicial não produz saída por click sintético', () => {
  const touch = createLogoTouch();
  touch.start(1, 100, 100, 0);
  touch.move(1, 130, 100); touch.move(1, 100, 100);
  touch.finish(1, 100, 100, 150);
  assert.equal(touch.suppressClick(1, 151), true);
  assert.equal(touch.suppressClick(0, 151, 'touch'), true);
  assert.equal(touch.suppressClick(0, 151), false, 'Enter/Espaço continuam disponíveis');
  assert.equal(touch.suppressClick(1, 951), false, 'supressão não permanece indefinidamente');
});

test('cancelamento nativo para rolagem encerra o líquido e rejeita click residual', () => {
  const touch = createLogoTouch();
  touch.start(1, 100, 100, 0);
  assert.equal(touch.finish(1, 100, 103, 40, true), true);
  assert.equal(touch.move(1, 100, 140), false);
  assert.equal(touch.suppressClick(1, 50, 'touch'), true);
});

test('pressão longa não navega, novo toque ou mouse limpam o bloqueio anterior', () => {
  const touch = createLogoTouch();
  touch.start(1, 0, 0, 0);
  touch.finish(1, 0, 0, LOGO_TAP_DURATION + 1);
  assert.equal(touch.suppressClick(1, LOGO_TAP_DURATION + 2), true);
  touch.start(2, 0, 0, 600); touch.finish(2, 0, 0, 650);
  assert.equal(touch.suppressClick(1, 651, 'touch'), false);
  touch.start(3, 0, 0, 700); touch.finish(3, 20, 0, 750);
  touch.reset();
  assert.equal(touch.suppressClick(1, 751, 'mouse'), false);
});
