from pathlib import Path
import re
p=Path('index.html');s=p.read_text()
s=s.replace("<script>document.documentElement.classList.add('is-loading');window.setTimeout(function(){document.documentElement.classList.remove('is-loading')},2600);</script>","<script>window.__jotsIntroStartedAt=performance.now();document.documentElement.classList.add('is-loading');window.__jotsIntroFailSafe=window.setTimeout(function(){document.documentElement.classList.remove('is-loading')},2600);</script>")
mark=re.search(r'<div class="loader-mark">(.*?)</div>',s).group(1)
brand=f'<span class="brand-mark">{mark}</span><span class="wordmark-text">JOTS<span class="logo-dot">.</span>MEDIA</span>'
s=s.replace('<a class="wordmark" href="#top" aria-label="JOTS.MEDIA home">JOTS<span>.</span>MEDIA</a>',f'<a class="wordmark brand-lockup" href="#top" aria-label="JOTS.MEDIA home">{brand}</a>')
s=s.replace('<a class="wordmark" href="#top">JOTS<span>.</span>MEDIA</a>',f'<a class="wordmark brand-lockup" href="#top" aria-label="JOTS.MEDIA home">{brand}</a>')
s=s.replace('<div class="hero-content"><p class="eyebrow">',f'<div class="hero-content"><div class="hero-mark">{mark}</div><p class="eyebrow">',1)
s=s.replace('<button id="motionToggle" type="button" aria-pressed="false">Motion: on</button>', '<button id="motionToggle" type="button" aria-pressed="false">Motion: on</button><button id="replayIntro" type="button">Replay intro</button>')
p.write_text(s)
p=Path('app.js');s=p.read_text();start=s.index('(() => {');end=s.index('\n\n(() => {',start)
s=s[:start]+'''(() => {
  const root = document.documentElement;
  const loader = document.querySelector('.site-loader');
  let finishTimer;
  let releaseTimer;
  const clearTimers = () => {clearTimeout(finishTimer);clearTimeout(releaseTimer);};
  const finish = () => {
    if (!root.classList.contains('is-loading')) return;
    loader?.classList.add('is-leaving');
    releaseTimer = setTimeout(() => root.classList.remove('is-loading'), 380);
  };
  const play = (startedAt = performance.now()) => {
    clearTimers();
    loader?.classList.remove('is-leaving');
    root.classList.add('is-loading');
    // Give the brand a readable moment even on cached visits. No asset dependency.
    finishTimer = setTimeout(finish, Math.max(0, 1600 - (performance.now() - startedAt)));
  };
  play(window.__jotsIntroStartedAt ?? performance.now());
  document.getElementById('replayIntro')?.addEventListener('click', () => {
    // Re-arm the independent deadline before displaying a replay.
    clearTimeout(window.__jotsIntroFailSafe);
    window.__jotsIntroFailSafe = setTimeout(() => root.classList.remove('is-loading'), 2600);
    play();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && root.classList.contains('is-loading')) {
      clearTimers();root.classList.remove('is-loading');
    }
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {clearTimers();root.classList.remove('is-loading');}
  });
})();'''+s[end:];p.write_text(s)
p=Path('styles.css');s=p.read_text()+'''
/* Keep the original dotted Swarm mark visible throughout the brand identity. */
.brand-lockup{display:inline-flex;align-items:center;gap:12px}
.brand-lockup>.brand-mark{display:block;width:32px;height:36px;flex-shrink:0;color:inherit}
.brand-mark svg{display:block;width:100%;height:100%}
.wordmark>.wordmark-text{color:inherit}
.wordmark .logo-dot{color:var(--accent)}
.hero-mark{width:62px;height:55px;margin-bottom:22px;color:var(--ink)}
.hero-mark svg{display:block;width:100%;height:100%}
.loader-mark{width:88px;margin-bottom:30px}
.loader-inner>.wordmark{font-size:clamp(28px,4vw,38px)}
#replayIntro{background:none;border:0;color:inherit;font-size:9px;padding:12px 0;min-height:44px}
#replayIntro:hover{color:var(--accent)}
@media(max-width:700px){.brand-lockup{gap:8px}.brand-lockup>.brand-mark{width:27px;height:32px}.hero-mark{width:54px;height:48px;margin-bottom:22px}}
''';p.write_text(s)
p=Path('README.md');s=p.read_text();s=s.replace('- The custom Swarm loading screen releases when the deferred application script runs, with a 1.8-second application deadline, an independent 2.6-second head timer, and a three-second CSS visibility fallback.', '- The custom Swarm intro stays visible for 1.6 seconds from navigation, then fades out over 380 milliseconds. An independent 2.6-second head timer and a three-second CSS visibility fallback prevent blocking. The dotted mark also appears in the header, hero and footer, and a footer Replay intro control can show the introduction again. Escape dismisses the intro early.');p.write_text(s)
