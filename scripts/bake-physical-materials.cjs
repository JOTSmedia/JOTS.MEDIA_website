#!/usr/bin/env node
'use strict';
// Build-time only: turn the registered source photographs into physical
// materials, so visitors only decode images and never run pixel shaders.
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const project = path.resolve(__dirname, '..');
const bundled = process.env.JOTS_NODE_MODULES || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
function dependency(name) {
  try { return require(name); } catch (_) {
    try { return require(path.join(bundled, name)); } catch (_) {
      throw new Error(`Material baking needs ${name}. Install it locally or set JOTS_NODE_MODULES to the dependency directory.`);
    }
  }
}
const { createCanvas, loadImage } = dependency('@napi-rs/canvas');
const sharp = dependency('sharp');
const file = relative => path.join(project, relative);
const sourceAlpha = (canvas, part, atlas) => {
  const g = canvas.getContext('2d');
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(atlas, ...part.atlas, 0, 0, canvas.width, canvas.height);
  g.globalCompositeOperation = 'source-over';
};
async function main() {
  const began = performance.now();
  const [manifest, circuits, photo, originalAtlas, cleanBoard, die, moduleSource] = await Promise.all([
    fs.readFile(file('images/assembly/components.json'), 'utf8').then(JSON.parse),
    fs.readFile(file('images/assembly/circuit-paths.json'), 'utf8').then(JSON.parse),
    loadImage(file('sources/technology-white-original.png')),
    loadImage(file('images/assembly/components.webp')),
    loadImage(file('sources/technology-board-clean.png')),
    loadImage(file('images/assembly/silicon-die.webp')),
    fs.readFile(file('hero-physical-materials.js'), 'utf8')
  ]);
  if (photo.width !== manifest.sourceWidth || photo.height !== manifest.sourceHeight) throw new Error('Source photo dimensions do not match the assembly manifest');
  const sandbox = { window: {}, document: { createElement: name => {
    if (name !== 'canvas') throw new Error('Unexpected material DOM request');
    return createCanvas(1, 1);
  } } };
  vm.runInNewContext(moduleSource, sandbox, { filename: 'hero-physical-materials.js' });
  const materials = sandbox.window.JotsPhysicalMaterials;
  const board = createCanvas(manifest.sourceWidth, manifest.sourceHeight), boardG = board.getContext('2d');
  boardG.drawImage(photo, 0, 0, board.width, board.height);
  boardG.globalCompositeOperation = 'destination-out';
  for (const part of manifest.parts) boardG.drawImage(originalAtlas, ...part.atlas, ...part.source);
  boardG.globalCompositeOperation = 'destination-over';
  boardG.drawImage(cleanBoard, 0, 0, board.width, board.height);
  boardG.globalCompositeOperation = 'source-over';
  const atlas = createCanvas(originalAtlas.width, originalAtlas.height), atlasG = atlas.getContext('2d');
  for (const part of manifest.parts) {
    const texture = createCanvas(part.atlas[2], part.atlas[3]), g = texture.getContext('2d');
    g.drawImage(photo, ...part.source, 0, 0, texture.width, texture.height);
    sourceAlpha(texture, part, originalAtlas);
    const result = materials.component(texture, part, die);
    atlasG.drawImage(result, part.atlas[0], part.atlas[1]);
  }
  // Canvas premultiplication can round partial alpha during an atlas composite.
  // The release atlas takes its alpha directly from the original decoded atlas,
  // byte for byte, after every material and compositing operation has finished.
  const { data: originalPixels, info: originalInfo } = await sharp(file('images/assembly/components.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: physicalPixels, info: physicalInfo } = await sharp(atlas.toBuffer('image/png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (originalInfo.width !== physicalInfo.width || originalInfo.height !== physicalInfo.height) throw new Error('Physical atlas size drift');
  for (let i = 3; i < physicalPixels.length; i += 4) physicalPixels[i] = originalPixels[i];
  const atlasOutput = file('images/assembly/components-physical.webp');
  await sharp(physicalPixels, { raw: physicalInfo }).webp({ quality: 94, alphaQuality: 100, effort: 6 }).toFile(atlasOutput);
  const decodedPhysical = await sharp(atlasOutput).ensureAlpha().raw().toBuffer();
  let alphaMismatches = 0;
  for (let i = 3; i < decodedPhysical.length; i += 4) if (decodedPhysical[i] !== originalPixels[i]) alphaMismatches++;
  if (alphaMismatches) throw new Error(`Physical atlas has ${alphaMismatches} alpha mismatches`);
  const results = [{ file: path.relative(project, atlasOutput), width: atlas.width, height: atlas.height, bytes: (await fs.stat(atlasOutput)).size }];
  for (const width of [640, 960, 1600]) {
    const started = performance.now(), height = Math.round(width * manifest.sourceHeight / manifest.sourceWidth);
    const physical = materials.board(board, width, height, circuits);
    const output = file(`images/assembly/board-physical-${width}.webp`);
    await sharp(physical.toBuffer('image/png')).webp({ quality: 92, effort: 6 }).toFile(output);
    results.push({ file: path.relative(project, output), width, height, bytes: (await fs.stat(output)).size, bakeMs: Math.round(performance.now() - started) });
  }
  console.log(JSON.stringify({ results, components: manifest.parts.length, alphaMismatches, totalMs: Math.round(performance.now() - began) }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
