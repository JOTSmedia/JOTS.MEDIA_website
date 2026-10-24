/* Decorative Matrix decoding. The original, accessible text never changes. */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SELECTOR = 'h1,h2,.kicker,.intro,#missionTerrain,#missionTime,#missionGoalList strong,#missionGoalList p,.report-stat>span,.report-stat>strong,.end-stats strong,.step,.matrix-transmission>span';
export function cipherFrame(value, progress, tick = 0, seed = 0) {
  const chars = Array.from(value), edge = Math.floor(Math.max(0, Math.min(1, progress)) * chars.length);
  return chars.map((char, i) => {
    if (i < edge || !/[\p{L}\p{N}]/u.test(char)) return char;
    const index = Math.abs(Math.imul(i + 7, 31) + Math.imul(tick + seed, 17)) % GLYPHS.length;
    return GLYPHS[index];
  }).join('');
}
export function createMatrixText({ root, reduced = false, now = () => performance.now(), requestFrame = cb => requestAnimationFrame(cb), cancelFrame = id => cancelAnimationFrame(id) }) {
  const doc = root.ownerDocument;
  let active = null, runs = [], frame = 0, queued = 0, started = 0, lastPaint = -Infinity, nextPulse = Infinity, pulse = false, motionOff = reduced, ticker = null, briefing = false;
  const known = new WeakMap();
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const disabled = () => motionOff || !!media?.matches;
  function settle() {
    for (const run of runs) { run.el.classList.remove('is-decoding'); run.cipher.hidden = true; }
  }
  function cancel() {
    if (queued) cancelFrame(queued);
    if (frame) cancelFrame(frame);
    queued = frame = 0; settle();
    active?.classList.remove('matrix-text-active');
    ticker?.remove(); ticker = null; active = null; runs = [];
  }
  function collect(container) {
    const nodes = [], seen = new Set();
    function visit(node) {
      if (node.nodeType === 3) {
        if (node.textContent.trim().length > 1 && !seen.has(node)) { seen.add(node); nodes.push(node); }
        return;
      }
      if (node.nodeType !== 1 || node.closest('[aria-hidden="true"]')) return;
      if (node.classList.contains('matrix-text-run')) {
        const entry = known.get(node); if (entry && !seen.has(node)) { seen.add(node); nodes.push(entry); }
        return;
      }
      for (const child of Array.from(node.childNodes)) visit(child);
    }
    // Keep mission instructions and launch controls readable from the first frame.
    const selector = container.id === 'missionBrief' ? 'h1,h2,.kicker' : SELECTOR;
    for (const element of container.querySelectorAll(selector)) {
      if (!element.closest('[hidden],button,a,select,input,label')) visit(element);
    }
    return nodes.map((node, index) => {
      if (node.el) return { ...node, delay: briefing ? 0 : Math.min(index * 35, 360) };
      const el = doc.createElement('span'), source = doc.createElement('span'), cipher = doc.createElement('span');
      el.className = 'matrix-text-run'; source.className = 'matrix-text-source'; cipher.className = 'matrix-text-cipher';
      const text = node.textContent; source.textContent = text; cipher.setAttribute('aria-hidden', 'true'); cipher.hidden = true;
      el.append(source, cipher); node.replaceWith(el);
      const entry = { el, source, cipher, text, title: !!el.closest('h1,h2'), seed: index * 13 };
      known.set(el, entry); return { ...entry, delay: briefing ? 0 : Math.min(index * 35, 360) };
    });
  }
  function beginCycle(time, ambient = false) {
    started = time; pulse = ambient; lastPaint = -Infinity;
    for (const run of runs) {
      if (ambient && !run.title) continue;
      run.el.classList.add('is-decoding'); run.cipher.hidden = false;
    }
  }
  function paint(time) {
    frame = 0;
    if (!active || active.hidden || !active.isConnected || disabled()) { settle(); active?.classList.remove('matrix-text-active'); return; }
    if (time - lastPaint >= 48) {
      lastPaint = time;
      let unfinished = false;
      for (const run of runs) {
        if (pulse && !run.title) continue;
        const delay = pulse ? 0 : run.delay, duration = briefing ? (run.title ? 320 : 180) : pulse ? 750 : run.title ? 1350 : 850;
        const progress = Math.max(0, Math.min(1, (time - started - delay) / duration));
        if (progress >= 1) { run.el.classList.remove('is-decoding'); run.cipher.hidden = true; continue; }
        unfinished = true;
        run.cipher.textContent = cipherFrame(run.text, progress, Math.floor(time / 65), run.seed);
        run.cipher.style.color = Math.floor(time / 110 + run.seed) % 5 === 0 ? '#bd94ff' : '#00ff66';
      }
      if (ticker) ticker.textContent = cipherFrame('01 10 SIGNAL LINK 01 10', .32 + Math.sin(time / 1000) * .12, Math.floor(time / 100), 19);
      // Briefings decode once, then stay still while the pilot reads the goals.
      if (!unfinished && briefing) return;
      if (!unfinished && nextPulse === Infinity) nextPulse = time + 6400;
      if (time >= nextPulse) { nextPulse = Infinity; beginCycle(time, true); }
    }
    frame = requestFrame(paint);
  }
  function reveal(container) {
    cancel(); if (!container || disabled()) return;
    active = container; briefing = container.id === 'missionBrief';
    queued = requestFrame(() => {
      queued = 0; if (!active || active.hidden || disabled()) return;
      runs = collect(active); active.classList.add('matrix-text-active');
      if (!briefing) { ticker = doc.createElement('span'); ticker.className = 'matrix-live-text'; ticker.setAttribute('aria-hidden', 'true'); ticker.dataset.linkLabel = 'DECODING / '; active.append(ticker); }
      nextPulse = Infinity; beginCycle(now()); frame = requestFrame(paint);
    });
  }
  function setReducedMotion(value) {
    motionOff = !!value; const previous = active;
    if (disabled()) cancel(); else if (previous) reveal(previous);
  }
  const preferenceChanged = () => { if (disabled()) cancel(); };
  media?.addEventListener?.('change', preferenceChanged);
  return { reveal, cancel, setReducedMotion, destroy() { cancel(); media?.removeEventListener?.('change', preferenceChanged); } };
}
