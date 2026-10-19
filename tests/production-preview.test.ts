import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { productionPreview, projects, sections, services, type ServiceId } from '../src/config/site.ts';
import { toggleService } from '../src/lib/serviceSelection.ts';
import { buildBriefing } from '../src/lib/briefing.ts';
import { navigateToQuote } from '../src/lib/navigation.ts';
import { indexLayout } from '../src/lib/indexMotion.ts';

test('seleção compartilhada preserva ordem, remove itens e não altera o estado anterior', () => {
  const initial: ServiceId[] = [];
  const first = toggleService(initial, 'shot');
  const second = toggleService(first, 'edit');
  assert.deepEqual(initial, []);
  assert.deepEqual(first, ['shot']);
  assert.deepEqual(second, ['shot', 'edit']);
  const removed = toggleService(second, 'shot');
  assert.deepEqual(removed, ['edit']);
  const reselected = toggleService(removed, 'shot');
  assert.equal(reselected.at(-1), 'shot');
  assert.equal(services.find(service => service.id === reselected.at(-1))?.description, 'Captação de foto e vídeo.');
  assert.deepEqual(toggleService(toggleService(reselected, 'edit'), 'shot'), []);
});

test('briefing preparado novamente usa a seleção atual e conserva os outros campos', () => {
  const draft = { name: 'Teste local', date: '2026-12-20', place: 'Belo Horizonte', idea: 'Ensaio de lançamento.' };
  const selected: ServiceId[] = ['shot', 'edit'];
  const first = buildBriefing({ ...draft, services: selected });
  const changed = toggleService(toggleService(selected, 'edit'), 'vfx');
  const next = buildBriefing({ ...draft, services: changed });
  assert.match(first, /Serviços: SHOT, EDIT/);
  assert.match(next, /Serviços: SHOT, VFX/);
  assert.doesNotMatch(next, /EDIT/);
  for (const text of ['Nome: Teste local', '20/12/2026', 'Belo Horizonte', 'Ensaio de lançamento.']) assert.ok(next.includes(text));
});

test('janela tem projetos locais creditados e somente Orçamento troca de variante', () => {
  assert.deepEqual(sections.map(section => section.variant), ['folder', 'folder', 'production']);
  assert.deepEqual(productionPreview.choices.map(choice => choice.id), ['shot', 'edit', 'vfx', 'art']);
  for (const id of productionPreview.projectIds) {
    const project = projects.find(item => item.id === id);
    assert.ok(project, `Projeto não encontrado: ${id}`);
    assert.ok(project.credits && project.sourceUrl);
    assert.equal(project.cover.kind, 'image');
    assert.ok(existsSync(new URL(`../public${project.cover.src}`, import.meta.url)));
  }
});

test('palco libera o fluxo quando a janela medida não cabe, mesmo acima do limite antigo', () => {
  for (const [width, height] of [[320, 800], [390, 844], [768, 1024], [1024, 900], [1440, 900], [844, 390]]) {
    const available = height - 76 - 48;
    assert.equal(indexLayout(width, height, 76, false, available + 1).pinned, false);
    assert.equal(indexLayout(width, height, 76, false, available).pinned, available >= 560);
    assert.equal(indexLayout(width, height, 76, true, 400).pinned, false);
  }
});

test('continuar sem escolhas navega abaixo do cabeçalho e foca o nome sem duplicar histórico', () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const calls: unknown[] = [];
  const location = { hash: '#indice' };
  const state = { preserved: true };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location, scrollY: 200,
    history: { state, pushState(value: unknown, _title: string, url: string) { calls.push(['history', value, url]); location.hash = url; } },
    scrollTo(options: unknown) { calls.push(['scroll', options]); },
  } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    getElementById(id: string) {
      if (id === 'orcamento') return {};
      if (id === 'contact-title') return { getBoundingClientRect: () => ({ top: 900 }) };
      if (id === 'briefing-name') return { focus(options: unknown) { calls.push(['focus', options]); } };
      return null;
    },
    querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 76 }) }),
  } });
  try {
    navigateToQuote(); navigateToQuote();
    assert.deepEqual(calls, [
      ['history', state, '#orcamento'], ['focus', { preventScroll: true }], ['scroll', { top: 1000, behavior: 'instant' }],
      ['focus', { preventScroll: true }], ['scroll', { top: 1000, behavior: 'instant' }],
    ]);
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else Reflect.deleteProperty(globalThis, 'document');
  }
});
