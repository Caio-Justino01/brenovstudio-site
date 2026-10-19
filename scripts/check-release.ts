import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as content from '../src/config/site.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors: string[] = [];
const localMedia = new Set<string>();

/** Check spelling as Linux does, even when validation runs on a Windows checkout. */
function exactFile(path: string) {
  const parts = relative(root, path).split(sep);
  if (parts[0] === '..') return false;
  let current = root;
  try {
    for (const part of parts) {
      if (!readdirSync(current).includes(part)) return false;
      current = join(current, part);
    }
    return statSync(current).isFile() && statSync(current).size > 0;
  } catch { return false; }
}
function collect(value: unknown) {
  if (typeof value === 'string' && value.startsWith('/media/')) localMedia.add(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
}
function files(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(folder, entry.name)) : [join(folder, entry.name)]);
}

collect(content);
for (const src of localMedia) {
  for (const directory of ['public', 'dist']) {
    if (!exactFile(join(root, directory, src.slice(1)))) errors.push(`Mídia ausente, vazia ou com caixa incorreta: ${directory}${src}`);
  }
}
let imports = 0;
for (const file of files(join(root, 'src')).filter(file => ['.ts', '.tsx', '.css'].includes(extname(file)))) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g)) {
    imports++;
    const target = resolve(dirname(file), match[1]);
    const candidates = [target, ...['.ts', '.tsx', '.css', '/index.ts', '/index.tsx'].map(suffix => target + suffix)];
    if (!candidates.some(exactFile)) errors.push(`Import local inválido: ${relative(root, file)} → ${match[1]}`);
  }
}
const html = readFileSync(join(root, 'dist', 'index.html'), 'utf8');
const references = [...html.matchAll(/(?:src|href|content)=["'](\/(?:assets|media)\/[^"']+)["']/g)].map(match => match[1]);
for (const path of references) if (!exactFile(join(root, 'dist', path.slice(1)))) errors.push(`Arquivo referenciado no HTML ausente: ${path}`);
let styles = 0;
for (const file of files(join(root, 'dist', 'assets')).filter(file => extname(file) === '.css')) {
  for (const match of readFileSync(file, 'utf8').matchAll(/url\(\s*["']?(\/assets\/[^)"'\s]+)["']?\s*\)/g)) {
    styles++;
    if (!exactFile(join(root, 'dist', match[1].slice(1)))) errors.push(`Arquivo referenciado no CSS ausente: ${match[1]}`);
  }
}
if (!/<html\s+lang="pt-BR"/.test(html) || !html.includes('id="root"') || !references.some(path => path.endsWith('.js'))) errors.push('HTML de entrada incompleto.');
if (content.site.whatsappNumber !== null) errors.push('WhatsApp deve permanecer desativado nesta entrega.');

const seen = new Set<string>();
for (const item of content.navigationItems) {
  if (seen.has(item.id)) errors.push(`Âncora duplicada no cadastro: ${item.id}`);
  seen.add(item.id);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Entrega estática verificada: ${localMedia.size} mídias, ${imports} imports locais, ${references.length} referências do HTML e ${styles} recursos do CSS. Caixa dos caminhos conferida para Linux.`);
  console.log('Este comando não substitui a inspeção visual e funcional no navegador.');
}
