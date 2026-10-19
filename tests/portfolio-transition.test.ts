import test from 'node:test';
import assert from 'node:assert/strict';
import { rebasePortfolioLayers } from '../src/lib/portfolioTransition.ts';

function composite(order: readonly number[], alphas: readonly number[]) {
  const weights = alphas.map(() => 0);
  for (const id of order) {
    for (let i = 0; i < weights.length; i++) weights[i] *= 1 - alphas[id];
    weights[id] += alphas[id];
  }
  return weights;
}
const close = (actual: readonly number[], expected: readonly number[]) => actual.forEach((value, i) => {
  assert.ok(Math.abs(value - expected[i]) < 1e-9, `${value} corresponde a ${expected[i]}`);
});

test('a próxima foto chega sobre uma base opaca, sem abrir o fundo durante a transição', () => {
  const layers = rebasePortfolioLayers([0, 1, 2], [1, 0, 0], 1);
  assert.deepEqual(layers.order, [0, 2, 1]);
  for (let alpha = 0; alpha <= 1; alpha += .025) {
    const current = [...layers.opacities]; current[1] = alpha;
    const weights = composite(layers.order, current);
    assert.ok(Math.abs(weights.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  }
});

test('voltar para a foto anterior no meio do fade mantém exatamente a mistura visível', () => {
  const before = composite([0, 2, 1], [1, .5, 0]);
  assert.deepEqual(before, [.5, .5, 0]);
  const layers = rebasePortfolioLayers([0, 2, 1], [1, .5, 0], 0);
  assert.equal(layers.order.at(-1), 0);
  close(composite(layers.order, layers.opacities), before);
  assert.deepEqual(layers.opacities, [.5, 1, 0]);
});

test('escolhas rápidas das três imagens não alteram o quadro ao reordenar as camadas', () => {
  let order = [0, 1, 2], opacities = [1, 0, 0];
  for (let i = 0; i < 120; i++) {
    const target = [1, 2, 0, 2, 1, 0][i % 6];
    const before = composite(order, opacities);
    const next = rebasePortfolioLayers(order, opacities, target);
    close(composite(next.order, next.opacities), before);
    assert.equal(next.order.at(-1), target);
    order = next.order; opacities = next.opacities;
    // O gesto seguinte chega antes de terminar a transição atual.
    opacities[target] += (1 - opacities[target]) * .23;
    assert.ok(Math.abs(composite(order, opacities).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  }
});

test('a conclusão da camada escolhida substitui integralmente as demais', () => {
  const layers = rebasePortfolioLayers([1, 0, 2], [.6, 1, .3], 0);
  layers.opacities[0] = 1;
  close(composite(layers.order, layers.opacities), [1, 0, 0]);
});
