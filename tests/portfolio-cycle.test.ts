import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { portfolioShowcase, projects } from '../src/config/site.ts';
import { PortfolioCycle } from '../src/lib/portfolioCycle.ts';

function setup() {
  let now = 0, id = 0;
  const tasks = new Map<number, { at: number; callback: () => void }>();
  const changes: number[] = [];
  const cycle = new PortfolioCycle(3, 5000, 4000, index => changes.push(index), {
    schedule: (callback, delay) => { const handle = ++id; tasks.set(handle, { at: now + delay, callback }); return handle; },
    cancel: handle => { tasks.delete(handle as number); },
  });
  const advance = (ms: number) => {
    const end = now + ms;
    while (true) {
      const next = [...tasks.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      now = next[1].at; tasks.delete(next[0]); next[1].callback();
    }
    now = end;
  };
  return { cycle, changes, advance, tasks };
}

test('ciclo começa em Clandestina, avança a cada cinco segundos e volta ao início', () => {
  const { cycle, changes, advance, tasks } = setup();
  advance(15000); assert.deepEqual(changes, []);
  cycle.hold('offscreen', false);
  advance(4999); assert.deepEqual(changes, []);
  advance(1); assert.deepEqual(changes, [1]);
  advance(10000); assert.deepEqual(changes, [1, 2, 0]);
  assert.equal(tasks.size, 1);
});

test('mouse e foco assumem a seleção sem filas; retoma quatro segundos depois de ambos saírem', () => {
  const { cycle, changes, advance, tasks } = setup();
  cycle.hold('offscreen', false); advance(1000);
  cycle.hold('pointer', true); cycle.select(2); cycle.select(0); cycle.select(1);
  cycle.hold('focus', true); cycle.hold('pointer', false);
  advance(15000); assert.deepEqual(changes, [2, 0, 1]); assert.equal(tasks.size, 0);
  cycle.hold('focus', false); advance(3999); assert.equal(changes.length, 3);
  advance(1); assert.deepEqual(changes, [2, 0, 1, 2]);
});

test('aba, movimento reduzido, galeria e pausa manual são bloqueios independentes', () => {
  const { cycle, changes, advance, tasks } = setup();
  cycle.hold('offscreen', false);
  cycle.hold('hidden', true); cycle.hold('reduced', true); cycle.hold('dialog', true); cycle.hold('manual', true);
  advance(50000); assert.deepEqual(changes, []);
  cycle.hold('hidden', false); cycle.hold('reduced', false); cycle.hold('dialog', false);
  assert.equal(tasks.size, 0);
  cycle.select(2); assert.deepEqual(changes, [2]);
  advance(10000); assert.deepEqual(changes, [2]);
  cycle.hold('manual', false); advance(4000); assert.deepEqual(changes, [2, 0]);
});

test('voltar à tela não acumula tempo oculto e descarte elimina o temporizador', () => {
  const { cycle, changes, advance, tasks } = setup();
  cycle.hold('offscreen', false); advance(4900); cycle.hold('offscreen', true);
  advance(90000); cycle.hold('offscreen', false);
  advance(4999); assert.deepEqual(changes, []);
  advance(1); assert.deepEqual(changes, [1]);
  cycle.destroy(); cycle.hold('offscreen', false); cycle.select(0);
  advance(50000); assert.deepEqual(changes, [1]); assert.equal(tasks.size, 0);
});

test('curadoria mantém três projetos, cinco mídias locais com origem e os reels fora do palco', () => {
  assert.deepEqual(portfolioShowcase.items.map(item => item.projectId), ['clandestina', 'dops', 'peppnx-capa']);
  const chosen = portfolioShowcase.items.map(item => projects.find(project => project.id === item.projectId)!);
  assert.ok(chosen.every(project => project && project.sourceUrl && project.credits && project.temporary));
  assert.equal(chosen.flatMap(project => project.media).length, 5);
  assert.ok(chosen.every(project => project.format !== 'Vídeo'));
  for (const project of chosen) for (const media of project.media) {
    assert.ok(media.alt && media.width > 0 && media.height > 0);
    assert.ok(existsSync(new URL(`../public${media.src}`, import.meta.url)));
  }
  assert.ok(projects.some(project => project.id === 'kayg' && project.services.includes('edit')));
});
