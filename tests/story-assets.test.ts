import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { about, sections } from '../src/config/site.ts';

test('os quadros da piscada compartilham as dimensões declaradas para a sobreposição', () => {
  const sizes = [about.scene.open, about.scene.closed].map(src => {
    const image = readFileSync(new URL(`../public${src}`, import.meta.url));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    return [image.readUInt32BE(16), image.readUInt32BE(20)];
  });
  assert.deepEqual(sizes[0], sizes[1]);
  assert.deepEqual(sizes[0], [about.scene.width, about.scene.height]);
});

test('a prévia usa o mesmo retrato aprovado da História e o quadro de repouso correspondente', () => {
  const portrait = sections[0].preview.items[0];
  assert.equal(portrait.media.src, about.scene.open);
  assert.equal(portrait.closedSrc, about.scene.closed);
  assert.equal(portrait.media.width, about.scene.width);
  assert.equal(portrait.media.height, about.scene.height);
  assert.equal(portrait.sourceUrl, about.scene.source);
});
