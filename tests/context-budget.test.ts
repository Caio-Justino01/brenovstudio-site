import test from 'node:test';
import assert from 'node:assert/strict';
import { ContextBudget } from '../src/lib/contextBudget.ts';

test('reservas pendentes também contam no teto de seis contextos', () => {
  const pool = new ContextBudget(6), started: number[] = [];
  const releases = Array.from({ length: 20 }, (_, id) => pool.request(() => { started.push(id); }));
  assert.deepEqual(started, [0, 1, 2, 3, 4, 5]);
  assert.equal(pool.activeCount, 6); assert.equal(pool.waitingCount, 14);
  releases[0](); releases[0]();
  assert.equal(pool.activeCount, 6); assert.deepEqual(started, [0, 1, 2, 3, 4, 5, 6]);
  for (const release of releases) release();
  assert.equal(pool.activeCount, 0); assert.equal(pool.waitingCount, 0);
});

test('um controle descartado na fila não inicializa depois de sair da tela', () => {
  const pool = new ContextBudget(1), started: string[] = [];
  const first = pool.request(() => { started.push('visible'); });
  const cancelled = pool.request(() => { started.push('gone'); });
  const next = pool.request(() => { started.push('next'); });
  cancelled(); first();
  assert.deepEqual(started, ['visible', 'next']);
  next(); assert.equal(pool.activeCount, 0);
});

test('falha de inicialização libera a reserva e não bloqueia os próximos controles', () => {
  const pool = new ContextBudget(1);
  const failed = pool.request(() => { throw new Error('WebGL unavailable'); });
  assert.equal(pool.activeCount, 0);
  let mounted = 0;
  const valid = pool.request(() => { mounted++; });
  failed(); assert.equal(pool.activeCount, 1); assert.equal(mounted, 1);
  valid(); assert.equal(pool.activeCount, 0);
});

test('desmontagem e remontagem não deixam reservas ou inicializações antigas', () => {
  const pool = new ContextBudget(6);
  for (let cycle = 0; cycle < 50; cycle++) {
    const release = pool.request(() => {});
    release(); release();
    assert.equal(pool.activeCount, 0); assert.equal(pool.waitingCount, 0);
  }
});
