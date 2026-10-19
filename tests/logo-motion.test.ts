import test from 'node:test';
import assert from 'node:assert/strict';
import { inverseLogoPoint, logoTransform } from '../src/lib/logoMotion.ts';

test('o mouse afasta a marca nos quatro sentidos e respeita a amplitude por dispositivo', () => {
  for (const mobile of [false, true]) {
    const limit = mobile ? 3 : 5;
    const idle = logoTransform(4, mobile, 0, 0, 3, 0, 0);
    for (const [x, y] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const motion = logoTransform(4, mobile, x * 2, y * 2, 3, 0, 0);
      assert.ok(Math.abs(motion.x - idle.x + x * limit) < 1e-12);
      assert.ok(Math.abs(motion.y - idle.y + y * limit) < 1e-12);
    }
  }
});

test('a transformação inversa mantém o ponteiro no material durante flutuação e reação', () => {
  for (let time = 0; time < 30; time += .17) {
    const motion = logoTransform(time, false, .4, -.7, time % 3, .6, -.8);
    const x = 135, y = -78, c = Math.cos(motion.angle), s = Math.sin(motion.angle);
    const home = inverseLogoPoint(x * c - y * s + motion.x, x * s + y * c + motion.y, motion);
    assert.ok(Math.abs(home.x - x) < 1e-10);
    assert.ok(Math.abs(home.y - y) < 1e-10);
  }
});

test('a flutuação é pequena e a reação termina em dois segundos sem acumulação', () => {
  for (const mobile of [false, true]) {
    const factor = mobile ? .5 : 1;
    for (let time = 0; time < 60; time += .03) {
      const idle = logoTransform(time, mobile, 0, 0, 3, 0, 0);
      assert.ok(Math.abs(idle.x) <= 3 * factor);
      assert.ok(Math.abs(idle.y) <= 5 * factor);
      assert.ok(Math.abs(idle.angle) <= .35 * Math.PI / 180 * factor);
      const reaction = logoTransform(time, mobile, 0, 0, time % 2, 1, 0);
      assert.ok(Math.abs(reaction.x - idle.x) <= 3 * factor);
      assert.deepEqual(logoTransform(time, mobile, 0, 0, 2, 1, 1), idle);
    }
  }
});
