import test from 'node:test';
import assert from 'node:assert/strict';
import { captureOpeningStartup, createOpeningStartup, holdOpeningPosition, prepareOpeningPosition, readDocumentNavigation } from '../src/lib/openingStartup.ts';

test('entrada e recarga em raiz/início pedem a formação inteira mesmo com scroll restaurado', () => {
  for (const navigation of ['navigate', 'reload'] as const) {
    for (const hash of ['', '#inicio']) {
      const browser = {
        location: { hash }, scrollY: 1750,
        matchMedia: () => ({ matches: false }),
        performance: { getEntriesByType: () => [{ type: navigation }] },
      };
      const startup = captureOpeningStartup(browser as unknown as Window);
      assert.equal(startup.playFormation, true);
      assert.equal(startup.startAtTop, true);
      assert.equal(startup.alignInitialSection, false);
      browser.location.hash = '#portfolio';
      assert.equal(startup.playFormation, true, 'a intenção é capturada uma vez por documento');
    }
  }
});

test('Voltar e Avançar preservam posição e dispensam correções em qualquer âncora inicial', () => {
  for (const hash of ['', '#inicio', '#indice', '#historia', '#portfolio', '#orcamento']) {
    const startup = createOpeningStartup(hash, false, 'back_forward');
    assert.equal(startup.playFormation, false);
    assert.equal(startup.startAtTop, false);
    assert.equal(startup.alignInitialSection, false);
  }
});

test('âncoras diretas alinham a seção sem entrar no replay nem impor o topo da hero', () => {
  for (const hash of ['#indice', '#historia', '#portfolio', '#orcamento']) {
    const startup = createOpeningStartup(hash, false, 'navigate');
    assert.equal(startup.playFormation, false);
    assert.equal(startup.startAtTop, false);
    assert.equal(startup.alignInitialSection, true);
  }
  assert.equal(createOpeningStartup('#inicio', true, 'reload').playFormation, false);
});

test('tipo moderno prevalece e a restauração do Safari antigo usa o timing legado', () => {
  assert.equal(readDocumentNavigation({ getEntriesByType: () => [{ type: 'reload' }], navigation: { type: 2 } }), 'reload');
  assert.equal(readDocumentNavigation({ getEntriesByType: () => [], navigation: { type: 2 } }), 'back_forward');
  assert.equal(readDocumentNavigation({ getEntriesByType: () => [], navigation: { type: 1 } }), 'reload');
  assert.equal(readDocumentNavigation({ getEntriesByType: () => [] }), 'navigate');
});

test('posição inicial é corrigida uma vez e restauração nativa volta ao terminar ou navegar', () => {
  const positions: ScrollToOptions[] = [];
  const events = new EventTarget();
  const browser = { history: { scrollRestoration: 'auto' as ScrollRestoration }, scrollTo: (value: ScrollToOptions) => positions.push(value),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  const release = holdOpeningPosition(browser, true);
  assert.equal(browser.history.scrollRestoration, 'manual');
  assert.deepEqual(positions, [{ top: 0, left: 0, behavior: 'instant' }]);
  release(); release();
  assert.equal(browser.history.scrollRestoration, 'auto');
  const repeated = holdOpeningPosition(browser, false);
  assert.equal(positions.length, 1, 'o segundo setup do StrictMode não reaplica scrollTo');
  repeated();
  assert.equal(browser.history.scrollRestoration, 'auto');
  browser.history.scrollRestoration = 'manual';
  const alreadyManual = holdOpeningPosition(browser, false);
  alreadyManual();
  assert.equal(browser.history.scrollRestoration, 'manual', 'a preferência existente é preservada');
});

test('sair do documento devolve a restauração nativa mesmo sem desmontagem do React', () => {
  const events = new EventTarget();
  let writes = 0;
  const browser = { history: { scrollRestoration: 'auto' as ScrollRestoration }, scrollTo: () => { writes++; },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  const release = holdOpeningPosition(browser, true);
  events.dispatchEvent(new Event('pagehide'));
  assert.equal(browser.history.scrollRestoration, 'auto');
  browser.history.scrollRestoration = 'manual';
  events.dispatchEvent(new Event('pagehide'));
  release();
  assert.equal(browser.history.scrollRestoration, 'manual', 'o listener e cleanup já liberados não alteram outra navegação');
  assert.equal(writes, 1);
});

test('bootstrap zera antes da medição dos filhos e sincroniza a memória que um refresh restauraria', () => {
  const events = new EventTarget();
  let top = 6229, cachedTop = 6229;
  let libraryRestoration: ScrollRestoration = 'auto';
  const writes: number[] = [];
  const browser = { history: { scrollRestoration: 'auto' as ScrollRestoration },
    scrollTo: ({ top: value = 0 }: ScrollToOptions) => { writes.push(value); top = value; },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  const synchronize = (mode: ScrollRestoration) => { libraryRestoration = mode; cachedTop = top; };
  const position = prepareOpeningPosition(browser, createOpeningStartup('#inicio', false, 'reload'), synchronize)!;
  assert.equal(top, 0, 'a posição já está correta antes do primeiro efeito de layout');
  assert.equal(cachedTop, 0);
  // ScrollTrigger refresh reapplies its own saved restoration preference and scroll cache.
  const refresh = () => { browser.history.scrollRestoration = libraryRestoration; top = cachedTop; };
  refresh();
  assert.equal(browser.history.scrollRestoration, 'manual');
  assert.equal(top, 0, 'o refresh não ressuscita o offset do documento anterior');
  const first = position.acquire();
  first();
  const second = position.acquire();
  refresh();
  assert.equal(browser.history.scrollRestoration, 'manual');
  assert.deepEqual(writes, [0], 'StrictMode não reaplica o reset inicial');
  position.release(); second();
  refresh();
  assert.equal(browser.history.scrollRestoration, 'auto');
  assert.equal(libraryRestoration, 'auto');
});

test('bootstrap de histórico ou âncora direta não escreve posição nem preferência de restauração', () => {
  const events = new EventTarget(), writes: unknown[] = [];
  const browser = { history: { scrollRestoration: 'auto' as ScrollRestoration }, scrollTo: (value: unknown) => writes.push(value),
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  for (const startup of [createOpeningStartup('#inicio', false, 'back_forward'), createOpeningStartup('#historia', false, 'navigate')]) {
    assert.equal(prepareOpeningPosition(browser, startup, mode => writes.push(mode)), null);
  }
  assert.deepEqual(writes, []);
  assert.equal(browser.history.scrollRestoration, 'auto');
});
