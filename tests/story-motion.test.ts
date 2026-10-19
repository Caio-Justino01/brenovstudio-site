import test from 'node:test';
import assert from 'node:assert/strict';
import { about } from '../src/config/site.ts';
import { canRestoreStory, captureStoryProgress, restoreStoryFlowPosition, restoreStoryPosition, sameStoryMetrics, stableStoryMetrics, storyEyeLight, storyFrame, storyLayout } from '../src/lib/storyMotion.ts';

const settings = about.presentation.scroll;
const metrics = { width: 1440, height: 900, header: 68, stageHeight: 440, reduced: false, failed: false };

test('o palco cabe inteiro e o percurso moderado respeita limites em celular, tablet e computador', () => {
  for (const [width, height, stageHeight] of [[320, 800, 681], [390, 844, 645], [768, 1024, 695], [1024, 768, 599], [1366, 768, 630], [1440, 900, 660]]) {
    const layout = storyLayout({ ...metrics, width, height, stageHeight }, settings);
    assert.equal(layout.pinned, true);
    assert.ok(layout.distance >= 600 && layout.distance <= 1000);
    assert.ok(Math.abs(layout.distance - Math.max(600, Math.min(1000, (height - 116) * 1.15))) < 1e-10);
    const short = storyFrame(120 / layout.distance, settings);
    assert.equal(short.identity, 0);
    assert.equal(short.invitation, 1);
    assert.equal(short.closed, 1);
    // Each settled title has meaningful travel reserved for reading, even on the shortest eligible screen.
    assert.ok(settings.invitation[0] * layout.distance >= 240);
    assert.ok((1 - settings.identity[1]) * layout.distance >= 170);
    assert.ok((settings.identity[1] - settings.identity[0]) * layout.distance >= 80);
  }
  assert.equal(storyLayout({ ...metrics, height: 641, stageHeight: 525 }, settings).distance, 603.75);
  assert.equal(storyLayout({ ...metrics, height: 1600 }, settings).distance, 1000);
});

test('voltar do fluxo para sticky conserva a identidade e o topo que já passou acima da tela', () => {
  const end = 2400, stickyTop = 92;
  for (const previousTop of [92, 0, -50, -200]) {
    const target = restoreStoryFlowPosition(previousTop, stickyTop, end);
    assert.equal(stickyTop - (target - end), previousTop);
    assert.ok(target >= end);
  }
  assert.equal(restoreStoryFlowPosition(92.6, stickyTop, end), end);
});

test('olhos e títulos têm intervalos estáveis, sem sobreposição, e percurso reversível', () => {
  assert.deepEqual(storyFrame(0, settings), { closed: 1, invitation: 1, identity: 0, phase: 'closed' });
  assert.deepEqual(storyFrame(.32, settings), storyFrame(0, settings));
  assert.deepEqual(storyFrame(.72, settings), { closed: 0, invitation: 0, identity: 1, phase: 'identity' });
  assert.deepEqual(storyFrame(1, settings), storyFrame(.72, settings));
  const forward = Array.from({ length: 1001 }, (_, i) => storyFrame(i / 1000, settings));
  const reverse = Array.from({ length: 1001 }, (_, i) => storyFrame(1 - i / 1000, settings)).reverse();
  forward.forEach((frame, i) => {
    assert.ok(frame.invitation === 0 || frame.identity === 0);
    for (const key of ['closed', 'invitation', 'identity'] as const) {
      assert.ok(frame[key] >= 0 && frame[key] <= 1);
      assert.ok(Math.abs(frame[key] - reverse[i][key]) < 1e-12);
      if (i) assert.ok(Math.abs(frame[key] - forward[i - 1][key]) < .014);
    }
  });
  assert.deepEqual(storyFrame(-1, settings), storyFrame(0, settings));
  assert.deepEqual(storyFrame(2, settings), storyFrame(1, settings));
  assert.deepEqual(storyFrame(Number.NaN, settings), storyFrame(0, settings));
});

test('o fallback não reserva percurso extra quando não cabe, há falha ou movimento reduzido', () => {
  for (const changes of [{ height: 390 }, { stageHeight: 785 }, { reduced: true }, { failed: true }, { stageHeight: 0 }, { height: Number.NaN }, { header: Number.NaN }, { header: -1 }]) {
    const layout = storyLayout({ ...metrics, ...changes }, settings);
    assert.equal(layout.pinned, false);
    assert.equal(layout.distance, 0);
    assert.equal(Number.isFinite(layout.top), true);
  }
});

test('a luz nasce depois da abertura, alcança o auge com olhos abertos e se dissipa sem saltos', () => {
  let previous = 0;
  for (let index = 0; index <= 1000; index++) {
    const progress = index / 1000;
    const light = storyEyeLight(progress, settings);
    assert.ok(light >= 0 && light <= 1);
    if (storyFrame(progress, settings).closed > .35) assert.equal(light, 0);
    assert.ok(Math.abs(light - previous) < .011);
    assert.ok(Math.abs(light - storyEyeLight(1 - (1 - progress), settings)) < 1e-12);
    previous = light;
  }
  assert.equal(storyEyeLight(.75, settings), 1);
  assert.equal(storyFrame(.75, settings).closed, 0);
  for (const progress of [0, 1, -1, 2, Number.NaN]) assert.equal(storyEyeLight(progress, settings), 0);
});

test('a composição completa mede o painel e libera o fluxo quando as descrições deixam de caber', () => {
  const collapsed = { ...metrics, height: 768, stageHeight: 630 };
  const compact = storyLayout(collapsed, settings);
  assert.equal(compact.pinned, true);
  const expanded = storyLayout({ ...collapsed, stageHeight: 760 }, settings);
  assert.equal(expanded.pinned, false);
  assert.equal(expanded.distance, 0);
  // Collapsing after reading in flow retains the identity instead of replaying the invitation.
  const restored = restoreStoryFlowPosition(40, compact.top, 2200);
  assert.equal(restored, 2252);
  assert.deepEqual(storyFrame(1, settings), { closed: 0, invitation: 0, identity: 1, phase: 'identity' });
});

test('resize conserva progresso de leitura e quadro visual, sem forçar posições de fora do palco', () => {
  for (const progress of [0, .2, .45, .65, 1]) {
    const saved = captureStoryProgress(1400, 2027.2, 1400 + 627.2 * progress, Math.max(0, progress - .04))!;
    assert.ok(saved);
    const restored = restoreStoryPosition(saved, 1800, 2347.2);
    assert.ok(Math.abs((restored - 1800) / 547.2 - progress) < 1e-12);
    assert.deepEqual(storyFrame(saved.visualProgress, settings), storyFrame(Math.max(0, progress - .04), settings));
  }
  for (const y of [0, 1399, 2028, 4000]) assert.equal(captureStoryProgress(1400, 2027.2, y, .5), null);
  assert.equal(captureStoryProgress(1400, 1400, 1400, .5), null);
  assert.equal(captureStoryProgress(1400, 2027.2, 1700, Number.NaN), null);
  assert.equal(canRestoreStory(3, 4, 0, 50), false);
  assert.equal(canRestoreStory(3, 3, 1500, 1000), false);
  assert.equal(canRestoreStory(3, 3, 1500, 1500), true);
});

test('oscilações subpixel não reiniciam a cena; alteração de fonte, altura e preferência são detectadas', () => {
  assert.equal(sameStoryMetrics(stableStoryMetrics({ ...metrics, stageHeight: 440.7, header: 68.8 }, metrics), metrics), true);
  const changed = stableStoryMetrics({ ...metrics, stageHeight: 472.3, reduced: true }, metrics);
  assert.equal(sameStoryMetrics(changed, metrics), false);
  assert.equal(changed.stageHeight, 472);
  assert.equal(changed.reduced, true);
});
