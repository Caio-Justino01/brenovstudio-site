import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBriefing, whatsappLink } from '../src/lib/briefing.ts';

test('mantém a data escolhida sem conversão de fuso e aceita vários serviços', () => {
  const message = buildBriefing({ name: '  Caio  ', services: ['shot', 'edit'], date: '2026-12-01', place: '  Belo Horizonte  ', idea: '  Registro de um evento.  ' });
  assert.match(message, /Nome: Caio\n/);
  assert.match(message, /Serviços: SHOT, EDIT\n/);
  assert.match(message, /Data: 01\/12\/2026\nLocal: Belo Horizonte/);
  assert.ok(message.endsWith('Ideia:\nRegistro de um evento.'));
});

test('data e local desconhecidos permanecem a definir', () => {
  const message = buildBriefing({ name: 'Ana', services: ['vfx'], date: '', place: '  ', idea: 'Efeitos para um clipe.' });
  assert.match(message, /Data: A definir\nLocal: A definir/);
});

test('sem telefone não gera destino de WhatsApp', () => {
  assert.equal(whatsappLink(null, 'Teste'), null);
  assert.equal(whatsappLink('sem número', 'Teste'), null);
});

test('codifica acentos, quebras de linha e caracteres reservados no link', () => {
  const message = 'Captação & edição\nIdeia: A + B? #evento';
  const link = whatsappLink('+55 (31) 99999-9999', message);
  assert.ok(link);
  const url = new URL(link);
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/5531999999999');
  assert.equal(url.searchParams.get('text'), message);
});
