import test from 'node:test';
import assert from 'node:assert/strict';
import { footerContent, navigationItems, productionPreview, site } from '../src/config/site.ts';
import { whatsappLink } from '../src/lib/briefing.ts';
test('destinos são únicos e compartilhados; WhatsApp permanece desativado', () => {
  assert.deepEqual(navigationItems.map(item => item.id), ['inicio', 'indice', 'historia', 'portfolio', 'orcamento']);
  assert.deepEqual(navigationItems.filter(item => item.header).map(item => item.id), ['historia', 'portfolio', 'orcamento']);
  assert.equal(site.whatsappNumber, null);
  assert.equal(whatsappLink(site.whatsappNumber, 'Teste'), null);
  assert.equal(footerContent.contacts.length, 2);
  assert.ok(footerContent.contacts.every(contact => new URL(contact.href).hostname === 'www.instagram.com'));
  assert.equal(productionPreview.accessibleName, 'Orçamento do Bemov Studio');
  assert.equal('title' in productionPreview, false);
});
