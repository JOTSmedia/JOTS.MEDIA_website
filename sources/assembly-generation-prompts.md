# Component animation asset generation

Mode: built-in image_gen image editing; no CLI/API fallback.
Input/edit target: sources/technology-white-original.png (1672 × 941).
Both generated edits preserve the original canvas framing and were copied into the project without overwriting the original hero.

## Clean board — sources/technology-board-clean.png

Use case: precise-object-edit / object removal. Edit target: the provided white circuit-board hero photograph. Make a clean background plate for an animated exploded assembly. Remove ALL raised electronic components: the large glass processor and its pins, small glass chips, capacitors, resistors, and every protruding cube or metal part. Inpaint the spaces with the continuous flat white circuit board, fine silver/cyan printed traces and empty solder/contact pads where parts once sat. Preserve EXACT original framing, perspective, scale, geometry, white material, soft lighting, depth of field and broad white negative space on left. Do not move the camera or change composition. The output must be the same landscape aspect ratio as input. Do not add text, labels, objects or shadows of removed parts. This is only the bare board, with absolutely no floating parts.

## Transparent parts — sources/technology-components-alpha.png

Use case: background-removal, production animation cutout layer. Edit target is the provided circuit-board image. Keep every raised physical electronic component exactly in its original position, perspective, scale and lighting. Preserve the main glass processor with all attached metal pins as one intact object, the smaller glass chips, white cuboid capacitors and tiny metal resistors across the entire scene. Remove ONLY the flat board, printed circuit tracks, contact pads and cast shadows; replace removed areas with actual transparent alpha. All individual objects must be separated by transparent empty space, with clean object-shaped contours, not rectangular patches of board. Keep the exact original 1672x941 landscape canvas framing and positions. Do not rearrange into a sprite grid or move any object. Retain white/silver glass materials and highlights; do not make objects transparent by mistake. No text, checkerboard texture, new objects, decorative lines or background. The image will overlay the original so exact registration and component silhouettes matter.

## Saved delivery assets

- images/assembly/board-{640,960,1600}.webp: responsive clean-board plates.
- images/assembly/components.webp: transparent packed atlas of 55 physical components, 1024 × 537.
- images/assembly/components.json: original placement and atlas rectangles.
- assembly.js: object movement and light-path animation; no image tessellation.

The original still hero and existing shared-link image remain in use. Generated edits are animation layers; no native 4K claim is made for these assets.

Circuit lights: images/assembly/circuit-paths.json records five paths sampled from cyan groove pixels in the original 1672 × 941 photograph. Object pixels were excluded using the generated alpha layer; routes along glass-component rims were rejected during visual review. These are board-channel centerlines, not freehand decorative curves.

## Silicon die material — sources/silicon-die-material.png

Mode: built-in image_gen generation; no CLI/API fallback. Output used only as a surface texture projected onto the original chip's existing die face. Original reference geometry is unchanged.

Use case: product-mockup / photorealistic material texture. Generate a square 1024x1024 production texture for the exposed silicon die of a premium real computer processor. EXACT ORTHOGRAPHIC TOP DOWN, flat square entire image filled edge to edge with the microscopic physical surface of one complex GPU silicon die. No package, no external board, no frame, no perspective, no text or logo, no letters, no background. A highly detailed realistic semiconductor die micrograph: disciplined rectangular blocks of repeated parallel transistor arrays, fine hairline copper and gold interconnects, dense dark graphite silicon memory banks arranged symmetrically, subtle muted petrol green and violet interference only in tiny highlights, metallic warm silver and fine gold lithographic traces. Central computing blocks surrounded by tight rectangular memory arrays, recognizable real fabricated chip floorplan. Real macro photography, physically realistic reflective wafer material, controlled soft studio lighting with restrained crisp highlights, rich readable detail even reduced to 250 pixels. This is a material map that will be applied to a pre-existing chip; absolutely no external object silhouette or 3D angle.

Saved source is1254×1254; compressed authoring derivative768×768. The deployed physical atlas contains the mapped die, so the full texture is not fetched during the animation. Board and package finishes are baked offline to preserve performance.
