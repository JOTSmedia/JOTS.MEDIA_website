from pathlib import Path
import re
p=Path('index.html');s=p.read_text()
for cls,tone in [('hero','light'),('work section-pad','dark'),('services section-pad','light'),('about section-pad','dark'),('process section-pad','light'),('contact section-pad','dark')]:
 s=s.replace(f'<section class="{cls}"',f'<section class="{cls}" data-tone="{tone}"',1)
s=s.replace('<div class="intro-strip">','<div class="intro-strip" data-tone="dark">')
s=s.replace('<footer class="site-footer">','<footer class="site-footer" data-tone="light">')
s=s.replace('<div class="section-heading" data-reveal>','<div class="section-heading" data-reveal-group>')
s=s.replace('<div class="about-copy" data-reveal>','<div class="about-copy" data-reveal-group>')
s=s.replace('<div class="about-photo" data-reveal>','<div class="about-photo" data-reveal="image">')
# Draw a subtle rule when each section arrives, without affecting document flow.
s=re.sub(r'(<section\b[^>]*class="[^"]*section-pad[^"]*"[^>]*>)', r'\1<span class="section-divider" data-reveal="line" aria-hidden="true"></span>',s)
p.write_text(s)
p=Path('app.js');s=p.read_text();start=s.index('  // Animate only when entering the viewport.');end=s.index('\n  const menuButton',start)
s=s[:start]+'''  // Each section gets a small sequence: label, heading, copy, then supporting
  // cards or imagery. The base page is always visible if animation is unavailable.
  const revealSelectors = [
    ['.hero-content > .hero-mark, .hero-content > .eyebrow, .hero-content > h1, .hero-bottom, .hero-foot', 'hero'],
    ['.intro-strip > p, .intro-strip > .strip-mark', 'strip'],
    ['.section-heading > .eyebrow, .section-heading > h2, .section-heading > .section-aside', 'heading'],
    ['.about-copy > *, .process-heading > *, .contact > .eyebrow, .contact-heading > *, .contact-bottom > *', 'section'],
    ['.footer-top > *, .footer-bottom > *', 'footer']
  ];
  revealSelectors.forEach(([selector, group]) => {
    document.querySelectorAll(selector).forEach((el, index) => {
      el.dataset.reveal = el.matches('h1, h2') ? 'heading' : 'rise';
      el.dataset.revealOrder = String(index % (group === 'hero' ? 5 : 3));
    });
  });
  document.querySelectorAll('.project-grid > .project, .services-grid > .service, .process-grid > article').forEach(el => {
    el.dataset.reveal = 'card';
  });
  const pendingReveals = new Set();
  const animateReveal = el => {
    if (off || media.matches || !el.animate) return;
    const type = el.dataset.reveal;
    let delay = Number(el.dataset.revealOrder || 0) * 90;
    if (type === 'card') {
      const columns = getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length;
      delay = Array.from(el.parentElement.children).indexOf(el) % Math.max(1, columns) * 95;
    }
    const frames = type === 'line'
      ? [{transform:'scaleX(0)', opacity:.25}, {transform:'scaleX(1)', opacity:1}]
      : type === 'image'
        ? [{opacity:.25, transform:'translateY(28px) scale(.975)', clipPath:'inset(0 0 8% 0)'}, {opacity:1, transform:'none', clipPath:'inset(0)'}]
        : [{opacity:.12, transform:`translateY(${type === 'heading' ? 34 : 22}px)`}, {opacity:1, transform:'none'}];
    el.animate(frames, {
      duration: type === 'image' ? 1050 : type === 'line' ? 1100 : type === 'heading' ? 950 : 780,
      delay, easing:'cubic-bezier(.16,1,.3,1)', fill:'backwards'
    });
  };
  const flushReveals = () => {
    if (root.classList.contains('is-loading')) return;
    pendingReveals.forEach(el => {
      const bounds = el.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < innerHeight) animateReveal(el);
      pendingReveals.delete(el);
    });
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        pendingReveals.add(entry.target);
        observer.unobserve(entry.target);
      });
      flushReveals();
    }, {threshold:.1, rootMargin:'0px 0px -4% 0px'});
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    new MutationObserver(flushReveals).observe(root, {attributes:true, attributeFilter:['class']});
  }
''' +s[end:]
p.write_text(s)
p=Path('styles.css');s=p.read_text()+'''
/* White / black rhythm follows the order of the main sections. */
[data-tone="light"]{--surface:#f9faf6;--foreground:#111615;--muted:#58635c;--section-rule:#cbd3c7;background:var(--surface);color:var(--foreground)}
[data-tone="dark"]{--surface:#0b0f0d;--foreground:#f4f4ee;--muted:#b4c0b7;--line:#ffffff30;--section-rule:#ffffff32;background:var(--surface);color:var(--foreground)}
[data-tone="dark"] :focus-visible{outline-color:var(--accent)}
[data-tone="dark"] .section-aside p{color:var(--muted)}
.section-pad{position:relative}
.section-divider{display:block;position:absolute;top:0;left:var(--pad);right:var(--pad);height:1px;background:var(--section-rule,var(--line));transform-origin:left center;pointer-events:none}
.intro-strip[data-tone="dark"]{border-color:#ffffff26}
.intro-strip[data-tone="dark"] .strip-mark{color:var(--accent)}
.work[data-tone="dark"] .work-note{border-color:#ffffff30}
.work[data-tone="dark"] .work-note a{color:var(--foreground)}
.work[data-tone="dark"] .project-info h3 a:hover,.work[data-tone="dark"] .text-link:hover{color:var(--accent)}
.work[data-tone="dark"] .preview-button{border-color:#66746a}
.work[data-tone="dark"] .project-image{border-color:#ffffff24;background:#17201b}
.work[data-tone="dark"] .browser-bar,.work[data-tone="dark"] .project-controls{background:#19221d;color:#bcc8be;border-color:#3b4940}
.work[data-tone="dark"] .browser-bar i{background:#6c7c70}
.work[data-tone="dark"] .preview-status{color:#b5c4b7}
.work[data-tone="dark"] .story-toggle:hover{color:var(--accent)}
.work[data-tone="dark"] .placeholder-stage{background:linear-gradient(135deg,#18211b,#101711)}
.work[data-tone="dark"] .placeholder-stage span{color:#809c8b}
.work[data-tone="dark"] .placeholder-label{color:#b5c4b7}
.services[data-tone="light"] .section-aside p,.services[data-tone="light"] .service p{color:var(--muted)}
.services[data-tone="light"] .service{border-color:var(--section-rule)}
.services[data-tone="light"] .service>.eyebrow{color:#657466}
.services[data-tone="light"] .service-cross{color:#007c86}
.services[data-tone="light"] .button-outline{color:var(--foreground);border-color:#788a79}
.services[data-tone="light"] .button-outline:hover{background:var(--foreground);color:var(--surface)}
.about[data-tone="dark"] .about-mark{color:var(--foreground)}
.about[data-tone="dark"] .text-link:hover{color:var(--accent)}
.process[data-tone="light"]{border-top:0}
.process[data-tone="light"] .process-grid article{border-color:var(--section-rule)}
.contact[data-tone="dark"] .contact-round{color:var(--foreground);border-color:#ffffff70}
.contact[data-tone="dark"] .contact-round:hover{background:var(--accent);border-color:var(--accent);color:#111615}
.contact[data-tone="dark"] .contact-bottom{border-color:#ffffff35}
.contact[data-tone="dark"] .contact-bottom .text-link:hover,.contact[data-tone="dark"] .contact-bottom>a:hover{color:var(--accent)}
.site-footer[data-tone="light"] .footer-top p,.site-footer[data-tone="light"] .footer-bottom{color:var(--muted)}
.site-footer[data-tone="light"] .footer-bottom{border-color:var(--section-rule)}
.site-footer[data-tone="light"] a:hover,.site-footer[data-tone="light"] #replayIntro:hover{color:#007c86}
/* Native scroll-linked depth stays subtle and requires no scrolling script. */
@supports(animation-timeline:view()){
  @media(prefers-reduced-motion:no-preference){
    html:not(.motion-off) .hero-visual img{animation:hero-scroll-depth linear both;animation-timeline:view();animation-range:exit 0% exit 100%}
  }
}
@keyframes hero-scroll-depth{from{transform:translateY(0) scale(1.025)}to{transform:translateY(3%) scale(1.09)}}
@media(prefers-reduced-motion:reduce){.hero-visual img{transform:none!important}}
.motion-off .hero-visual img{transform:none!important}
''';p.write_text(s)
p=Path('README.md');s=p.read_text();needle='## Design and behavior\n';s=s.replace(needle,needle+'\n- Main sections alternate white (hero), black (work), white (services), black (studio), white (process), and black (contact), followed by a white footer. Cyan remains an accent.\n- Scroll-triggered sequences reveal section labels, headings, copy, equal-size cards, images and divider rules with short staggers. The hero background has subtle native scroll-linked depth where supported. Content is visible by default; reduced motion and the footer motion control disable these effects. Initial reveals wait for the brand intro to finish.\n');p.write_text(s)
