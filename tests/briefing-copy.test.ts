import test from 'node:test';
import assert from 'node:assert/strict';
import { BriefingCopy } from '../src/lib/briefingCopy.ts';

function pendingCopy() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function setup() {
  const requests: { message: string; task: ReturnType<typeof pendingCopy> }[] = [];
  const copied: string[] = [], focused: string[] = [], selected: string[] = [];
  let currentBriefing = 'A';
  const copy = new BriefingCopy(message => {
    const task = pendingCopy(); requests.push({ message, task }); return task.promise;
  }, {
    copied: () => copied.push(currentBriefing),
    manual: () => { focused.push(currentBriefing); selected.push(currentBriefing); },
  });
  const replaceBriefing = (message: string) => { copy.invalidate(); currentBriefing = message; };
  return { copy, requests, copied, focused, selected, replaceBriefing };
}

test('a cópia atual envia seu texto e confirma somente após a conclusão', async () => {
  const { copy, requests, copied } = setup();
  const result = copy.copy('Briefing A');
  assert.equal(requests[0].message, 'Briefing A');
  assert.deepEqual(copied, []);
  requests[0].task.resolve(); await result;
  assert.deepEqual(copied, ['A']);
});

test('sucesso antigo não marca o briefing novo enquanto a nova cópia está pendente', async () => {
  const { copy, requests, copied, focused, selected, replaceBriefing } = setup();
  const first = copy.copy('Briefing A');
  replaceBriefing('B');
  const second = copy.copy('Briefing B');
  requests[0].task.resolve(); await first;
  assert.deepEqual(copied, []); assert.deepEqual(focused, []); assert.deepEqual(selected, []);
  requests[1].task.resolve(); await second;
  assert.deepEqual(copied, ['B']);
});

test('falha antiga não foca nem seleciona o novo resultado; falha atual oferece cópia manual', async () => {
  const { copy, requests, copied, focused, selected, replaceBriefing } = setup();
  const first = copy.copy('Briefing A');
  replaceBriefing('B');
  const second = copy.copy('Briefing B');
  requests[0].task.reject(new Error('Permissão recusada')); await first;
  assert.deepEqual(copied, []); assert.deepEqual(focused, []); assert.deepEqual(selected, []);
  requests[1].task.reject(new Error('Clipboard indisponível')); await second;
  assert.deepEqual(focused, ['B']); assert.deepEqual(selected, ['B']); assert.deepEqual(copied, []);
});

test('editar o briefing invalida uma cópia mesmo sem iniciar outra', async () => {
  for (const fail of [false, true]) {
    const { copy, requests, copied, focused, selected, replaceBriefing } = setup();
    const result = copy.copy('Briefing A');
    replaceBriefing('');
    if (fail) requests[0].task.reject(); else requests[0].task.resolve();
    await result;
    assert.deepEqual(copied, []); assert.deepEqual(focused, []); assert.deepEqual(selected, []);
  }
});

test('nova tentativa substitui a anterior mesmo copiando o mesmo briefing', async () => {
  const { copy, requests, copied, focused, selected } = setup();
  const first = copy.copy('Briefing A'), second = copy.copy('Briefing A');
  requests[1].task.resolve(); await second;
  requests[0].task.reject(); await first;
  assert.deepEqual(copied, ['A']); assert.deepEqual(focused, []); assert.deepEqual(selected, []);
});

test('descarte impede callbacks tardios e novas operações', async () => {
  for (const fail of [false, true]) {
    const { copy, requests, copied, focused, selected } = setup();
    const result = copy.copy('Briefing A');
    copy.dispose();
    if (fail) requests[0].task.reject(); else requests[0].task.resolve();
    await result;
    await copy.copy('Briefing B');
    assert.equal(requests.length, 1);
    assert.deepEqual(copied, []); assert.deepEqual(focused, []); assert.deepEqual(selected, []);
  }
});
