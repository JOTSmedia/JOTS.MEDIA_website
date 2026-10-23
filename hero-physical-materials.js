'use strict';
// A material replacement for the existing, registered photography. This module
// never moves a vertex: it bakes opaque epoxy, metal and silicon into canvases
// once, then the assembly renderer projects the same source geometry as before.
(() => {
  const boardCache = new WeakMap();
  const componentCache = new WeakMap();
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  const mix = (a, b, amount) => a + (b - a) * amount;
  const smooth = (low, high, value) => {
    const p = clamp((value - low) / (high - low));
    return p * p * (3 - 2 * p);
  };
  const surface = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Physical material canvas unavailable');
    return { canvas, context };
  };
  // Stable microscopic material roughness: it belongs to the substrate, so it
  // neither crawls over the photograph nor requires work during animation.
  const grain = (x, y) => {
    let n = Math.imul(x + 13, 374761393) ^ Math.imul(y + 71, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295 - .5;
  };
  const luminances = pixels => {
    const result = new Float32Array(pixels.length / 4);
    for (let i = 0; i < result.length; i++) {
      const p = i * 4;
      result[i] = (pixels[p] * .2126 + pixels[p + 1] * .7152 + pixels[p + 2] * .0722) / 255;
    }
    return result;
  };
  const strokeRoutes = (context, circuits, color, width) => {
    context.strokeStyle = color; context.lineWidth = width;
    for (const route of circuits?.routes || []) {
      if (route.length < 2) continue;
      context.beginPath(); context.moveTo(route[0][0], route[0][1]);
      for (let i = 1; i < route.length; i++) context.lineTo(route[i][0], route[i][1]);
      context.stroke();
    }
  };
  const board = (source, width, height, circuits) => {
    const key = `${width}:${height}`;
    const existing = boardCache.get(source);
    if (existing?.has(key)) return existing.get(key);
    const { canvas, context: g } = surface(width, height);
    g.drawImage(source, 0, 0, width, height);
    const original = g.getImageData(0, 0, width, height);
    const data = original.data, light = luminances(data);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x, p = i * 4, l = light[i];
      const left = light[y * width + Math.max(0, x - 1)];
      const right = light[y * width + Math.min(width - 1, x + 1)];
      const up = light[Math.max(0, y - 1) * width + x];
      const down = light[Math.min(height - 1, y + 1) * width + x];
      const gx = right - left, gy = down - up;
      const edge = Math.hypot(gx, gy);
      const recess = smooth(.10, .44, 1 - l);
      const localLow = Math.min(left, right, up, down);
      // Polished rims are extracted from the photographed solder and grooves.
      // Blank white areas become opaque rough solder mask, not tinted glass.
      const rim = smooth(.035, .19, l - localLow) * smooth(.60, .91, l);
      const specular = Math.pow(clamp((gx * -.42 - gy * .75) * 4.6), 1.7);
      const lamp = Math.exp(-((x / width - .79) ** 2 * 2.2 + (y / height - .28) ** 2 * 1.5));
      const rough = grain(x, y) * 2.5;
      const weave = Math.sin(x * 2.06 + y * .13) * Math.sin(y * 2.34) * .30;
      const depth = 1 - recess * .61;
      let r = (7 + lamp * 8 + rough + weave) * depth;
      let green = (14 + lamp * 14 + rough + weave) * depth;
      let b = (13 + lamp * 12 + rough + weave) * depth;
      const metal = clamp(rim * .73 + specular * .52);
      const metalBrightness = 78 + l * 95;
      r = mix(r, metalBrightness * .91, metal);
      green = mix(green, metalBrightness, metal);
      b = mix(b, metalBrightness * .98, metal);
      // Small source relief remains readable without making the whole epoxy
      // field glossy. Deep source apertures stay deep black at their centers.
      const relief = clamp(edge * 1.4) * (1 - metal);
      data[p] = r + relief * 18;
      data[p + 1] = green + relief * 23;
      data[p + 2] = b + relief * 22;
      data[p + 3] = 255;
    }
    g.putImageData(original, 0, 0);
    g.save();
    g.scale(width / (circuits?.sourceWidth || 1672), height / (circuits?.sourceHeight || 941));
    g.lineCap = 'round'; g.lineJoin = 'round';
    // Every conductor uses the existing traced route. The narrow copper core
    // sits in its photographed groove; wider dark etching anchors it in epoxy.
    strokeRoutes(g, circuits, 'rgba(1,8,7,.80)', 5.5);
    strokeRoutes(g, circuits, 'rgba(73,62,39,.82)', 3.0);
    const copper = g.createLinearGradient(780, 50, 1672, 941);
    copper.addColorStop(0, '#6e5735');
    copper.addColorStop(.35, '#aa8650');
    copper.addColorStop(.58, '#d0ad70');
    copper.addColorStop(.79, '#8f713f');
    copper.addColorStop(1, '#645131');
    g.globalAlpha = .81;
    strokeRoutes(g, circuits, copper, 1.45);
    g.globalAlpha = .40;
    strokeRoutes(g, circuits, '#e2c995', .38);
    g.restore();
    const cache = existing || new Map(); cache.set(key, canvas); boardCache.set(source, cache);
    return canvas;
  };
  const path = (g, points) => {
    g.beginPath(); g.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
    g.closePath();
  };
  // Map a bitmap onto a source-traced face without moving its outline. The two
  // affine triangles meet along the same diagonal, under the enclosing mask.
  const drawTriangle = (g, bitmap, sourcePoints, points) => {
    const [a, b, c] = sourcePoints, [u, v, w] = points;
    const det = a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]);
    if (Math.abs(det) < .00001) return;
    const coefficient = values => [
      (values[0] * (b[1] - c[1]) + values[1] * (c[1] - a[1]) + values[2] * (a[1] - b[1])) / det,
      (values[0] * (c[0] - b[0]) + values[1] * (a[0] - c[0]) + values[2] * (b[0] - a[0])) / det,
      (values[0] * (b[0] * c[1] - c[0] * b[1]) + values[1] * (c[0] * a[1] - a[0] * c[1]) + values[2] * (a[0] * b[1] - b[0] * a[1])) / det
    ];
    const [xx, xy, xt] = coefficient([u[0], v[0], w[0]]);
    const [yx, yy, yt] = coefficient([u[1], v[1], w[1]]);
    const center = [(u[0] + v[0] + w[0]) / 3, (u[1] + v[1] + w[1]) / 3];
    const expanded = points.map(p => {
      const dx = p[0] - center[0], dy = p[1] - center[1], length = Math.hypot(dx, dy);
      return [p[0] + dx / length * .38, p[1] + dy / length * .38];
    });
    g.save(); path(g, expanded); g.clip();
    g.transform(xx, yx, xy, yy, xt, yt); g.drawImage(bitmap, 0, 0); g.restore();
  };
  const mainDie = (g, bitmap) => {
    const face = [[217, 52], [373, 158], [230, 266], [71, 154]];
    g.save(); path(g, face); g.clip();
    // The image is a real silicon material patch, not a replacement processor:
    // its detail is registered to the existing four corners and no other shape.
    if (bitmap && (bitmap.naturalWidth || bitmap.width)) {
      const width = bitmap.naturalWidth || bitmap.width, height = bitmap.naturalHeight || bitmap.height;
      drawTriangle(g, bitmap, [[0, 0], [width, 0], [width, height]], [face[0], face[1], face[2]]);
      drawTriangle(g, bitmap, [[0, 0], [width, height], [0, height]], [face[0], face[2], face[3]]);
    } else {
      g.fillStyle = '#283434'; g.fillRect(0, 0, 447, 327);
    }
    const reflection = g.createLinearGradient(90, 70, 340, 250);
    reflection.addColorStop(0, 'rgba(205,221,209,.11)');
    reflection.addColorStop(.42, 'rgba(205,221,209,0)');
    reflection.addColorStop(1, 'rgba(1,6,9,.22)');
    g.fillStyle = reflection; g.fillRect(0, 0, 447, 327); g.restore();
    // A subpixel machined bevel follows the exact die edge, never a new plate.
    path(g, face); g.strokeStyle = '#0b1011'; g.lineWidth = 2.6; g.stroke();
    g.beginPath(); g.moveTo(...face[3]); g.lineTo(...face[0]); g.lineTo(...face[1]);
    g.strokeStyle = 'rgba(200,207,195,.77)'; g.lineWidth = 1.0; g.stroke();
    g.beginPath(); g.moveTo(...face[1]); g.lineTo(...face[2]); g.lineTo(...face[3]);
    g.strokeStyle = 'rgba(106,120,115,.57)'; g.lineWidth = .7; g.stroke();
  };
  const component = (texture, part, dieImage) => {
    const existing = componentCache.get(texture);
    if (existing && existing.dieImage === dieImage) return existing.canvas;
    const width = texture.width, height = texture.height;
    const { canvas, context: g } = surface(width, height);
    g.drawImage(texture, 0, 0);
    const original = g.getImageData(0, 0, width, height);
    const source = new Uint8ClampedArray(original.data), data = original.data, light = luminances(source);
    const main = part.name === 'PROCESSOR' || (width === 447 && height === 327);
    const chip = main || part.name === 'CHIP';
    // Only these two photographed packages have exposed metal legs. The other
    // CHIP cutouts are ceramic/molded bodies: their warm white reflections must
    // not be mistaken for patchy silver plating on a black package.
    const exposedContacts = main || (part.name === 'CHIP' && part.source?.[2] === 174 && part.source?.[3] === 117);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x, p = i * 4;
      if (!source[p + 3]) continue;
      const l = light[i], rough = grain(x + (part.source?.[0] || 0), y + (part.source?.[1] || 0));
      const left = light[y * width + Math.max(0, x - 1)], right = light[y * width + Math.min(width - 1, x + 1)];
      const up = light[Math.max(0, y - 1) * width + x], down = light[Math.min(height - 1, y + 1) * width + x];
      const slope = clamp((left - right) * .9 + (up - down) * 1.5, -.35, .35);
      const warm = smooth(2, 15, source[p] - source[p + 2]);
      // Cyan, transparent package walls become rough molded polymer. Existing
      // warm metal pins/terminations keep their photographed shape and shading.
      const metal = chip ? (exposedContacts ? warm : 0) : clamp(warm + smooth(.88, .99, l) * .30);
      const polymerLight = .66 + .34 * (1 - y / height) + slope;
      const body = chip ? 20 : 28;
      let r = body * polymerLight + rough * 2.6;
      let green = (body + 5) * polymerLight + rough * 2.6;
      let b = (body + 7) * polymerLight + rough * 2.6;
      const silver = 21 + Math.pow(l, 1.35) * 198;
      r = mix(r, silver * .97, metal);
      green = mix(green, silver, metal);
      b = mix(b, silver * .98, metal);
      // Narrow source-derived surface highlights distinguish molded corners
      // from metal. This intentionally removes the original glass refraction.
      const bevel = Math.pow(clamp((up - down + left - right) * 2.2), 1.8) * (1 - metal);
      data[p] = r + bevel * 24;
      data[p + 1] = green + bevel * 28;
      data[p + 2] = b + bevel * 31;
    }
    g.putImageData(original, 0, 0);
    if (main) mainDie(g, dieImage);
    // Restore the exact source matte after all material operations. No new
    // body edge, pin, hole or transparent pixel can be introduced by this pass.
    const finished = g.getImageData(0, 0, width, height);
    for (let i = 3; i < finished.data.length; i += 4) finished.data[i] = source[i];
    g.putImageData(finished, 0, 0);
    componentCache.set(texture, { canvas, dieImage });
    return canvas;
  };
  window.JotsPhysicalMaterials = Object.freeze({ board, component });
})();
