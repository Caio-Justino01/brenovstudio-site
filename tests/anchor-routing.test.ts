import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnchorRouting } from '../src/lib/anchorRouting.ts';

const destinations = ['#indice', '#historia', '#portfolio', '#orcamento'];

test('Voltar e Avançar conservam a posição nativa em todos os destinos', () => {
  const routing = createAnchorRouting(destinations);
  for (const hash of destinations) { routing.traversal(hash); assert.equal(routing.hashchange(hash), false); }
});

test('link explícito alinha seu destino, inclusive se o browser emitir popstate para o fragmento', () => {
  const routing = createAnchorRouting(destinations);
  for (const hash of destinations) {
    routing.link(hash); routing.traversal(hash);
    assert.equal(routing.hashchange(hash), true);
    assert.equal(routing.hashchange(hash), false);
  }
});

test('hashchange isolado e navegação desconhecida não são tratados como cliques', () => {
  const routing = createAnchorRouting(destinations);
  assert.equal(routing.hashchange('#portfolio'), false);
  routing.link('#outro'); assert.equal(routing.hashchange('#outro'), false);
});

test('nova ação ou outro destino substitui a intenção antiga sem forçar o scroll', () => {
  const routing = createAnchorRouting(destinations);
  routing.link('#historia'); routing.cancel(); assert.equal(routing.hashchange('#historia'), false);
  routing.link('#indice'); routing.traversal('#portfolio'); assert.equal(routing.hashchange('#portfolio'), false);
  routing.link('#historia'); routing.link('#orcamento'); assert.equal(routing.hashchange('#orcamento'), true);
});
