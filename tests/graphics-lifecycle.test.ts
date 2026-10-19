import test from 'node:test';
import assert from 'node:assert/strict';
import { assemblySamples } from '../src/lib/assemblyMotion.ts';
import { runCooperativeSteps, yieldToBrowser } from '../src/lib/cooperativeWork.ts';
import { releaseRenderer, resizeDrawingBuffer } from '../src/lib/graphicsResources.ts';
import { CONTROL_VISIBLE_RATIO, controlIntersectionVisible } from '../src/lib/controlVisibility.ts';
import { startSceneLoader } from '../src/lib/sceneLoader.ts';

test('preparo cooperativo preserva todos os passos e as mesmas amostras da abertura', async () => {
  const samples = assemblySamples();
  const total = samples.at(-1)!;
  const steps: number[] = [], captured = [0];
  let yields = 0;
  await runCooperativeSteps(total, index => {
    steps.push(index);
    if (samples.includes(index)) captured.push(index);
  }, { yieldTask: async () => { yields++; } });
  assert.deepEqual(steps, Array.from({ length: total }, (_, i) => i + 1));
  assert.deepEqual(captured, samples);
  assert.equal(yields, Math.floor((total - 1) / 8));
});

test('cancelamento durante um lote impede os passos seguintes e não conclui a inicialização', async () => {
  const abort = new AbortController();
  const reason = new Error('Navegação interrompeu o preparo');
  const steps: number[] = [];
  let completed = false;
  const setup = runCooperativeSteps(195, index => steps.push(index), {
    signal: abort.signal,
    yieldTask: async () => { abort.abort(reason); },
  }).then(() => { completed = true; });
  await assert.rejects(setup, error => error === reason);
  assert.deepEqual(steps, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(completed, false);
});

test('abortar antes do preparo não executa trabalho nem cede timers', async () => {
  const abort = new AbortController(); abort.abort();
  let calls = 0;
  await assert.rejects(runCooperativeSteps(195, () => { calls++; }, {
    signal: abort.signal, yieldTask: async () => { calls++; },
  }), { name: 'AbortError' });
  assert.equal(calls, 0);
});

test('o yield real permite um cancelamento externo antes do próximo lote', async () => {
  const abort = new AbortController();
  const steps: number[] = [];
  const setup = runCooperativeSteps(195, index => steps.push(index), { signal: abort.signal });
  abort.abort();
  await assert.rejects(setup, { name: 'AbortError' });
  assert.equal(steps.length, 8);
});

test('falha física é propagada sem executar quadros posteriores', async () => {
  const reason = new Error('Falha GPU');
  const steps: number[] = [];
  await assert.rejects(runCooperativeSteps(195, index => {
    steps.push(index); if (index === 3) throw reason;
  }), error => error === reason);
  assert.deepEqual(steps, [1, 2, 3]);
});

test('descarte gráfico devolve o contexto depois dos recursos e também em falha de limpeza', () => {
  const calls: string[] = [];
  releaseRenderer({ dispose: () => { calls.push('resources'); }, forceContextLoss: () => { calls.push('context'); } });
  assert.deepEqual(calls, ['resources', 'context']);
  calls.length = 0;
  assert.throws(() => releaseRenderer({
    dispose: () => { calls.push('resources'); throw new Error('cleanup'); },
    forceContextLoss: () => { calls.push('context'); },
  }), /cleanup/);
  assert.deepEqual(calls, ['resources', 'context']);
});

test('timeout do carregador interrompe o preparo cooperativo e descarta recursos sem callback tardio', async () => {
  let now = 0, next = 0, disposed = 0, ready = 0, fallback = 0, formed = 0;
  const timers = new Map<number, { callback: () => void; delay: number }>();
  const steps: number[] = [];
  const stop = startSceneLoader({
    load: async ({ signal }) => {
      const scene = { restore() {}, dispose() { disposed++; } };
      try {
        await runCooperativeSteps(195, index => steps.push(index), { signal });
        return scene;
      } catch (error) { scene.dispose(); throw error; }
    },
    shouldRestore: () => false,
    onReady: () => { ready++; },
    onOpeningTimeout() {},
    onFallback: () => { fallback++; },
    onFormationComplete: () => { formed++; },
  }, {
    now: () => now,
    later: (callback, delay) => { const id = ++next; timers.set(id, { callback, delay }); return id; },
    cancel: id => { timers.delete(id); },
  });
  await Promise.resolve();
  assert.equal(steps.length, 8, 'primeiro lote cede antes do restante da simulação');
  const timeout = [...timers.values()].find(timer => timer.delay === 10000)!;
  now = 10000; timeout.callback();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(steps.length, 8);
  assert.equal(disposed, 1);
  assert.equal(ready, 0);
  assert.equal(formed, 0);
  assert.equal(fallback, 1);
  assert.equal(timers.size, 0);
  stop();
  assert.equal(disposed, 1);
});

test('resize aloca uma vez por medida real e conserva mudanças de DPR e orientação', () => {
  const calls: number[][] = [];
  const renderer = { setDrawingBufferSize: (width: number, height: number, dpr: number) => { calls.push([width, height, dpr]); } };
  assert.equal(resizeDrawingBuffer(renderer, 1440, 900, 1.5), true);
  for (let frame = 0; frame < 50; frame++) assert.equal(resizeDrawingBuffer(renderer, 1440, 900, 1.5), false);
  assert.deepEqual(calls, [[1440, 900, 1.5]]);
  assert.equal(resizeDrawingBuffer(renderer, 1440, 900, 2), true);
  assert.equal(resizeDrawingBuffer(renderer, 390, 844, 1.5), true);
  assert.equal(resizeDrawingBuffer(renderer, 844, 390, 1.5), true);
  assert.deepEqual(calls.slice(1), [[1440, 900, 2], [390, 844, 1.5], [844, 390, 1.5]]);
  const second = { setDrawingBufferSize: renderer.setDrawingBufferSize };
  assert.equal(resizeDrawingBuffer(second, 844, 390, 1.5), true, 'cada contexto mantém sua própria medida');
});

test('entrada e saída do controle usam o mesmo limiar de 25% durante scroll nativo', () => {
  const ratios = [0, .10, CONTROL_VISIBLE_RATIO - .0001, CONTROL_VISIBLE_RATIO, .5, 1, .5, .2499, .10, 0];
  const states = ratios.map(ratio => controlIntersectionVisible({ isIntersecting: ratio > 0, intersectionRatio: ratio }));
  assert.deepEqual(states, [false, false, false, true, true, true, true, false, false, false]);
  assert.equal(controlIntersectionVisible({ isIntersecting: false, intersectionRatio: 1 }), false);
});

test('preparo GPU aguarda a aba visível e pode ser descartado enquanto suspenso', async () => {
  let hidden = true, completed = false;
  const listeners = new Set<() => void>();
  const visibility = {
    isHidden: () => hidden,
    subscribe(callback: () => void) { listeners.add(callback); return () => { listeners.delete(callback); }; },
  };
  const waiting = yieldToBrowser(undefined, visibility).then(() => { completed = true; });
  await new Promise(resolve => setTimeout(resolve, 2));
  assert.equal(completed, false);
  hidden = false; listeners.forEach(callback => callback());
  await waiting;
  assert.equal(completed, true);
  assert.equal(listeners.size, 0);
  hidden = true;
  const abort = new AbortController(), cancelled = yieldToBrowser(abort.signal, visibility);
  abort.abort(); await assert.rejects(cancelled, { name: 'AbortError' });
  assert.equal(listeners.size, 0);
});
