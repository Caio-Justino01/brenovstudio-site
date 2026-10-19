import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldPlayOpening } from '../src/lib/opening.ts';
import { alignContentSection, alignIndex, navigateToIndex } from '../src/lib/navigation.ts';

test('abertura ocorre somente na hero no topo e sem movimento reduzido', () => {
  assert.equal(shouldPlayOpening('', 0, false), true);
  assert.equal(shouldPlayOpening('#inicio', 0, false), true);
  for (const hash of ['#indice', '#historia', '#portfolio', '#orcamento']) {
    assert.equal(shouldPlayOpening(hash, 0, false), false);
  }
  assert.equal(shouldPlayOpening('', 320, false), false);
  assert.equal(shouldPlayOpening('', 0, true), false);
});

test('âncoras de conteúdo alinham o título e preservam histórico e foco quando não solicitados', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const scrolls: unknown[] = [], focuses: unknown[] = [], events: string[] = [];
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { scrollY: 1000, scrollTo: (options: unknown) => scrolls.push(options) } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    getElementById(id: string) {
      if (['historia', 'portfolio', 'orcamento'].includes(id)) return { dataset: {}, focus: (options: unknown) => focuses.push(options), dispatchEvent: (event: Event) => events.push(event.type) };
      return { getBoundingClientRect: () => ({ top: 500 }) };
    },
    querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 68 }) }),
  } });
  try {
    alignContentSection('historia'); alignContentSection('portfolio'); alignContentSection('orcamento', true);
    assert.deepEqual(scrolls, Array(3).fill({ top: 1408, behavior: 'instant' }));
    assert.deepEqual(focuses, [{ preventScroll: true }]);
    assert.deepEqual(events, ['story:align']);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else Reflect.deleteProperty(globalThis, 'document');
  }
});

test('a âncora da História volta ao começo real do palco, mesmo com o título já fixo', () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const calls: unknown[] = [];
  const section = { dataset: { storyStart: '1400' }, focus: (options: unknown) => calls.push(['focus', options]),
    dispatchEvent: (event: Event) => calls.push(['event', event.type]) };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { scrollY: 1800, scrollTo: (options: unknown) => calls.push(['scroll', options]) } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    getElementById: (id: string) => id === 'historia' ? section : { getBoundingClientRect: () => ({ top: 92 }) },
    querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 68 }) }),
  } });
  try {
    alignContentSection('historia', true);
    alignContentSection('historia');
    assert.deepEqual(calls, [
      ['focus', { preventScroll: true }], ['scroll', { top: 1400, behavior: 'instant' }], ['event', 'story:align'],
      ['scroll', { top: 1400, behavior: 'instant' }], ['event', 'story:align'],
    ]);
    section.dataset.storyStart = '0';
    alignContentSection('historia');
    assert.deepEqual(calls.at(-2), ['scroll', { top: 0, behavior: 'instant' }]);
    section.dataset.storyStart = 'invalid';
    alignContentSection('historia');
    assert.deepEqual(calls.at(-2), ['scroll', { top: 1800, behavior: 'instant' }]);
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else Reflect.deleteProperty(globalThis, 'document');
  }
});

test('chegada alinha o título abaixo do cabeçalho, preserva o foco e não duplica a âncora', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const pushes: unknown[] = [];
  const scrolls: unknown[] = [];
  const focuses: unknown[] = [];
  const location = { hash: '#inicio' };
  const historyState = { preserved: true };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location, scrollY: 100,
    history: { state: historyState, pushState(state: unknown, _title: string, url: string) { pushes.push([state, url]); location.hash = url; } },
    scrollTo(options: unknown) { scrolls.push(options); },
  } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    getElementById(id: string) {
      if (id === 'indice') return { focus(options: unknown) { focuses.push(options); } };
      if (id === 'contents-title') return { getBoundingClientRect: () => ({ top: 800 }) };
      return null;
    },
    querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 82 }) }),
  } });
  try {
    navigateToIndex();
    navigateToIndex();
    assert.deepEqual(pushes, [[historyState, '#indice']]);
    assert.deepEqual(scrolls, [{ top: 794, behavior: 'instant' }, { top: 794, behavior: 'instant' }]);
    assert.deepEqual(focuses, [{ preventScroll: true }, { preventScroll: true }]);
    alignIndex();
    assert.equal(pushes.length, 1);
    assert.equal(scrolls.length, 3);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else Reflect.deleteProperty(globalThis, 'document');
  }
});
