import {cp, mkdir, rm} from 'node:fs/promises';
const out = new URL('../dist/', import.meta.url);
await rm(out, {recursive:true, force:true});
await mkdir(out, {recursive:true});
for (const file of ['index.html','styles.css','typography.css','section-glass.css','hero-material.css','section-glass.js','fonts','app.js','assembly.js','images/editorial','images/assembly','images/projects','images/logos','images/social','files']) {
  await cp(new URL(`../${file}`, import.meta.url), new URL(file, out), {recursive:true});
}
console.log('Built dist/ — upload its contents to any static host or GitHub Pages.');
