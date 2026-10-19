import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameResizeObserver } from '../src/lib/frameResizeObserver.ts';

function setup() {
  let notify!: () => void, next = 0, writes = 0, disconnected = 0;
  const frames = new Map<number, () => void>();
  const observer = createFrameResizeObserver(() => { writes++; }, {
    request: callback => { const id = ++next; frames.set(id, callback); return id; },
    cancel: handle => { frames.delete(handle); },
    observe: callback => {
      notify = callback;
      return { observe() {}, disconnect() { disconnected++; } };
    },
  });
  const flush = () => {
    const current = [...frames.entries()];
    for (const [id, callback] of current) { frames.delete(id); callback(); }
  };
  return { observer, notify: () => notify(), frames, flush, writes: () => writes, disconnected: () => disconnected };
}

test('notificações de resize não escrevem no ciclo do observer e coalescem no próximo frame', () => {
  const state = setup();
  for (let i = 0; i < 40; i++) state.notify();
  assert.equal(state.writes(), 0);
  assert.equal(state.frames.size, 1);
  state.flush();
  assert.equal(state.writes(), 1);
  state.notify(); state.flush();
  assert.equal(state.writes(), 2);
});

test('descarte cancela o RAF pendente e ignora notificações tardias', () => {
  const state = setup();
  state.notify();
  const stale = [...state.frames.values()][0];
  state.observer.disconnect(); state.observer.disconnect();
  assert.equal(state.frames.size, 0);
  stale(); state.notify(); state.flush();
  assert.equal(state.writes(), 0);
  assert.equal(state.disconnected(), 1);
});
