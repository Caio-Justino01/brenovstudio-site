import test from 'node:test';
import assert from 'node:assert/strict';
import { captureIndexProgress, indexLayout, previewAt, previewStops, restoreIndexPosition, sameIndexMetrics, stableIndexMetrics } from '../src/lib/indexMotion.ts';

test('as três posições estáveis mantêm a prévia correspondente e permitem reversão', () => {
  assert.deepEqual(previewStops.map(previewAt), [0, 1, 2]);
  assert.deepEqual([0, .2, .4, .7, .9, 1, .7, .2, 0].map(previewAt), [0, 0, 1, 1, 2, 2, 1, 0, 0]);
});

test('medidas subpixel não reconstroem a geometria; mudanças reais e preferência permanecem detectáveis', () => {
  const previous = { width: 1440, height: 900, header: 76, reduced: false, contentHeight: 560 };
  const jitter = stableIndexMetrics({ ...previous, header: 76.6, contentHeight: 560.8 }, previous);
  assert.equal(sameIndexMetrics(jitter, previous), true);
  const changed = stableIndexMetrics({ ...previous, header: 78.3, contentHeight: 564.2, reduced: true }, previous);
  assert.deepEqual(changed, { ...previous, header: 78, contentHeight: 564, reduced: true });
  assert.equal(sameIndexMetrics(changed, previous), false);
});

test('reconstrução preserva posição relativa e quadro visual dentro do pin, incluindo reversão', () => {
  for (const progress of [0, .2, .5, .8, 1]) {
    const saved = captureIndexProgress(900, 3060, 900 + 2160 * progress, Math.max(0, progress - .03))!;
    assert.ok(saved);
    const next = restoreIndexPosition(saved, 1024, 3481.6);
    assert.ok(Math.abs((next - 1024) / 2457.6 - progress) < 1e-10);
    assert.equal(saved.visualProgress, Math.max(0, progress - .03));
    assert.equal(previewAt(saved.visualProgress), previewAt(Math.max(0, progress - .03)));
  }
});

test('fora do pin e geometrias inválidas não produzem posição forçada durante uma mudança de layout', () => {
  for (const top of [0, 899, 3061, 5000]) assert.equal(captureIndexProgress(900, 3060, top, .5), null);
  assert.equal(captureIndexProgress(900, 900, 900, .5), null);
  assert.equal(captureIndexProgress(900, 3060, 1800, Number.NaN), null);
  assert.equal(captureIndexProgress(Number.NaN, 3060, 1800, .5), null);
});
test('o percurso reserva leitura e libera telas baixas ou movimento reduzido', () => {
  assert.deepEqual(indexLayout(1440, 900, 76, false), { pinned: true, available: 776, distance: 2160 });
  assert.equal(indexLayout(320, 800, 76, false).distance, 1600);
  assert.equal(indexLayout(1440, 600, 76, false).pinned, false);
  assert.equal(indexLayout(390, 683, 76, false).pinned, false);
  assert.equal(indexLayout(390, 684, 76, false).pinned, true);
  assert.equal(indexLayout(1440, 900, 76, true).pinned, false);
});

test('120 px não atravessam duas opções, em nenhum ponto ou sentido do percurso', () => {
  for (const [width, height] of [[320, 800], [390, 844], [768, 1024], [1024, 900], [1440, 900]]) {
    const { distance } = indexLayout(width, height, 76, false);
    for (let offset = 0; offset <= distance; offset += 1) {
      for (const direction of [-1, 1]) {
        const next = Math.max(0, Math.min(distance, offset + 120 * direction));
        assert.ok(Math.abs(previewAt(next / distance) - previewAt(offset / distance)) <= 1);
      }
    }
  }
});

test('a composição compacta mantém as pastas fixas com a barra do navegador móvel aberta', () => {
  for (const [width, height] of [[390, 664], [393, 659], [375, 667]]) {
    const layout = indexLayout(width, height, 68, false, 536);
    assert.equal(layout.pinned, true);
    assert.equal(previewAt(120 / layout.distance), 0);
    assert.equal(indexLayout(width, height, 68, false, layout.available + 1).pinned, false);
    assert.equal(indexLayout(width, height, 68, true, 536).pinned, false);
  }
  assert.equal(indexLayout(844, 390, 68, false, 536).pinned, false);
});
