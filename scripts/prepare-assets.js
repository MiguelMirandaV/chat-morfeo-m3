import { copyFile, mkdir } from 'node:fs/promises';

// Los módulos se sirven desde nuestro dominio; no dependemos de un CDN en ejecución.
const source = new URL('../node_modules/three/', import.meta.url);
const target = new URL('../src/vendor/three/', import.meta.url);
await mkdir(target, { recursive: true });
for (const file of ['three.module.js', 'three.core.js']) {
  await copyFile(new URL(`build/${file}`, source), new URL(file, target));
}
await copyFile(new URL('LICENSE', source), new URL('LICENSE.txt', target));
console.log('Three.js: módulos y licencia preparados.');
