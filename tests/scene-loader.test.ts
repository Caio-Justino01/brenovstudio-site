import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startSceneLoader } from '../src/lib/sceneLoader.ts';

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function fixture(initiallyHidden?: boolean) {
  let time = 0;
  let timerId = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const clock = {
    now: () => time,
    later(fn: () => void, delay: number) { const id = ++timerId; timers.set(id, { at: time + delay, fn }); return id; },
    cancel(id: number) { timers.delete(id); },
  };
  const events: string[] = [];
  let failure: unknown;
  let hooks: Parameters<Parameters<typeof startSceneLoader>[0]['load']>[0];
  let resolve!: (value: typeof scene) => void;
  let reject!: (reason: unknown) => void;
  const scene = { restores: 0, disposals: 0, restore() { this.restores++; }, dispose() { this.disposals++; } };
  const pending = new Promise<typeof scene>((yes, no) => { resolve = yes; reject = no; });
  let hidden = initiallyHidden ?? false;
  let bypassed = false;
  const listeners = new Set<() => void>();
  const visibility = initiallyHidden === undefined ? undefined : {
    isHidden: () => hidden,
    subscribe(callback: () => void) { listeners.add(callback); return () => { listeners.delete(callback); }; },
  };
  const stop = startSceneLoader({
    load: (input) => { hooks = input; return pending; },
    shouldRestore: () => bypassed,
    onReady: () => events.push('ready'),
    onOpeningTimeout: () => events.push('release'),
    onFallback: (reason) => { failure = reason; events.push('fallback'); },
    onFormationComplete: () => events.push('formed'),
  }, clock, visibility);
  const advance = (to: number) => {
    while (true) {
      const next = [...timers].filter(([, timer]) => timer.at <= to).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      time = next[1].at;
      timers.delete(next[0]);
      next[1].fn();
    }
    time = to;
  };
  return { events, scene, stop, advance, resolve: () => resolve(scene), reject,
    jump: (to: number) => { time = to; }, hooks: () => hooks, failure: () => failure,
    visibility: (value: boolean) => { hidden = value; listeners.forEach(callback => callback()); }, listeners,
    bypass: () => { bypassed = true; } };
}

test('cena rápida preserva a abertura e notifica somente a formação real uma vez', async () => {
  const f = fixture();
  await flush();
  f.resolve(); await flush();
  assert.deepEqual(f.events, ['ready']);
  f.advance(2000);
  assert.deepEqual(f.events, ['ready']);
  f.hooks().onFormationComplete(); f.hooks().onFormationComplete();
  f.advance(4000);
  assert.deepEqual(f.events, ['ready', 'formed']);
  assert.equal(f.scene.restores, 0);
  f.stop();
  assert.equal(f.scene.disposals, 1);
});

test('três segundos liberam a interface sem abortar nem pular a formação da cena tardia', async () => {
  const f = fixture(); await flush();
  f.advance(3000);
  assert.deepEqual(f.events, ['release']);
  assert.equal(f.hooks().signal.aborted, false);
  f.advance(4500); f.resolve(); await flush();
  assert.deepEqual(f.events, ['release', 'ready']);
  assert.equal(f.scene.restores, 0);
  assert.equal(f.scene.disposals, 0);
  f.advance(11000);
  assert.deepEqual(f.events, ['release', 'ready']);
  f.stop();
});

test('formação tardia conclui uma única vez após a interface já estar disponível', async () => {
  const f = fixture(); await flush();
  f.advance(3000); f.advance(6500); f.resolve(); await flush();
  assert.deepEqual(f.events, ['release', 'ready']);
  assert.equal(f.scene.restores, 0);
  f.hooks().onFormationComplete(); f.hooks().onFormationComplete();
  assert.deepEqual(f.events, ['release', 'ready', 'formed']);
  f.stop();
});

test('cena pronta antes dos três segundos não mantém a interface oculta enquanto ainda forma', async () => {
  const f = fixture(); await flush();
  f.advance(2500); f.resolve(); await flush();
  assert.deepEqual(f.events, ['ready']);
  f.advance(3000);
  assert.deepEqual(f.events, ['ready', 'release']);
  assert.equal(f.scene.restores, 0);
  f.hooks().onFormationComplete();
  assert.deepEqual(f.events, ['ready', 'release', 'formed']);
  f.stop();
});

test('navegação explícita cancela a intenção de formação mesmo se a cena ainda estava carregando', async () => {
  const f = fixture(); await flush();
  f.advance(3200); f.bypass(); f.resolve(); await flush();
  assert.equal(f.scene.restores, 1);
  assert.deepEqual(f.events, ['release', 'ready']);
  f.stop();
});

test('tempo absoluto também libera a abertura após uma inicialização bloqueante', async () => {
  const f = fixture(); await flush();
  f.jump(4500); f.resolve(); await flush();
  assert.deepEqual(f.events, ['release', 'ready']);
  assert.equal(f.scene.restores, 0);
  f.stop();
});

test('prazo real de dez segundos registra o motivo e descarta a cena tardia', async () => {
  for (const blocking of [false, true]) {
    const f = fixture(); await flush();
    if (blocking) f.jump(10001); else f.advance(10000);
    f.resolve(); await flush();
    assert.ok(f.events.includes('fallback'));
    assert.equal(f.events.includes('ready'), false);
    assert.ok(f.failure() instanceof Error);
    assert.equal(f.hooks().signal.aborted, true);
    assert.equal(f.scene.disposals, 1);
    f.stop();
  }
});

test('falha real conserva a causa e desmontagem ignora callbacks tardios', async () => {
  const f = fixture(); await flush();
  const error = new Error('GPU de teste indisponível');
  f.reject(error); await flush();
  assert.equal(f.failure(), error);
  assert.deepEqual(f.events, ['fallback']);
  f.hooks().onFormationComplete();
  assert.deepEqual(f.events, ['fallback']);
  f.stop();

  const disposed = fixture(); await flush();
  disposed.stop(); disposed.resolve(); await flush();
  disposed.hooks().onFormationComplete();
  assert.deepEqual(disposed.events, []);
  assert.equal(disposed.scene.disposals, 1);
});

test('aba oculta não consome o prazo GPU e a interface continua liberada aos três segundos', async () => {
  const f = fixture(false); await flush();
  f.advance(2000); f.visibility(true);
  f.advance(62000);
  assert.deepEqual(f.events, ['release']);
  assert.equal(f.hooks().signal.aborted, false);
  f.visibility(false);
  f.advance(69999);
  assert.equal(f.events.includes('fallback'), false);
  f.advance(70000);
  assert.equal(f.events.includes('fallback'), true, 'oito segundos restantes em primeiro plano completam o prazo');
  assert.equal(f.listeners.size, 0);
  f.resolve(); await flush();
  assert.equal(f.scene.disposals, 1);
  f.stop();
});

test('cena carregada durante suspensão preserva a formação pendente sem falso timeout', async () => {
  const f = fixture(true); await flush();
  f.advance(60000); f.resolve(); await flush();
  assert.deepEqual(f.events, ['release', 'ready']);
  assert.equal(f.scene.restores, 0);
  assert.equal(f.hooks().signal.aborted, false);
  assert.equal(f.listeners.size, 0);
  f.stop();
});

test('desmontagem durante suspensão remove listener e não retoma prazo antigo', async () => {
  const f = fixture(true); await flush();
  assert.equal(f.listeners.size, 1);
  f.stop(); assert.equal(f.listeners.size, 0);
  f.visibility(false); f.advance(60000); f.resolve(); await flush();
  assert.deepEqual(f.events, []);
  assert.equal(f.scene.disposals, 1);
});
