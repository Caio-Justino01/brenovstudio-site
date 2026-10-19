import test from 'node:test';
import assert from 'node:assert/strict';
import { syncScrollProgress } from '../src/lib/scrollSync.ts';

test('alinhamento lê a posição nova mesmo antes de o evento scroll nativo invalidar o cache', () => {
  let nativeTop = 1800, cachedTop = nativeTop;
  const source = { progress: 1, update() { this.progress = Math.max(0, Math.min(1, (cachedTop - 1400) / 400)); } };
  nativeTop = 1400;
  source.update(); assert.equal(source.progress, 1);
  const progress = syncScrollProgress(source, () => { cachedTop = nativeTop; });
  assert.equal(progress, 0);
  assert.equal(source.progress, 0);
});

test('restauração de resize usa o progresso físico atualizado antes de reaplicar o quadro visual', () => {
  let nativeTop = 2200, cachedTop = nativeTop;
  const source = { progress: .5, update() { this.progress = (cachedTop - 1800) / 800; } };
  nativeTop = 2400;
  const progress = syncScrollProgress(source, () => { cachedTop = nativeTop; });
  assert.equal(progress, .75);
  assert.equal(cachedTop, 2400);
});
