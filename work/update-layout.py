from pathlib import Path
import re
p=Path('index.html');s=p.read_text()
img='<div class="hero-visual"><img id="heroImage" fetchpriority="high" decoding="async" src="images/editorial/coding-960.webp" srcset="'+', '.join(f'images/editorial/coding-{w}.webp {w}w' for w in [640,960,1600,2560,3840])+'" sizes="(min-width: 701px) 25vw, 90vw" width="3840" height="2560" alt="A laptop displaying a code editor with HTML and web development code"></div>'
s=s.replace('<section class="hero" aria-labelledby="hero-title">','<section class="hero" aria-labelledby="hero-title">'+img,1)
s=s.replace('class="project project-featured"','class="project"').replace('class="project "','class="project"')
s=re.sub(r'sizes="\(min-width: 900px\) (?:65|46)vw, 100vw"','sizes="(min-width: 1100px) 29vw, (min-width: 701px) 44vw, 90vw"',s)
placeholders=''
for n in [8,9]:
 placeholders+=f'<article class="project project-placeholder" data-reveal aria-label="Project placeholder {n}"><div class="project-image"><div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>FUTURE PROJECT</span></div><div class="placeholder-stage" aria-hidden="true"><span>&lt;/&gt;</span></div><div class="project-controls"><span class="preview-status">RESERVED / PROJECT PLACEHOLDER</span></div></div><div class="project-info"><p class="eyebrow">{n:02d} / FUTURE WORK</p><h3>PLACEHOLDER {n:02d}</h3><p>Reserved for a future project.</p><span class="placeholder-label">PROJECT PLACEHOLDER</span></div></article>'
needle='</article></div><p class="work-note">Seven live projects.'
assert needle in s
s=s.replace(needle,'</article>'+placeholders+'</div><p class="work-note">Seven live projects.',1)
p.write_text(s)
p=Path('styles.css');s=p.read_text();s=re.sub(r'\.project-featured[^{}]*\{[^{}]*\}', '', s)
s=s.replace('.project-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px 32px}', '.project-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:48px 28px}')
s+='''
/* Coding imagery sits within the quiet white hero, clear of the text. */
.hero-visual{position:absolute;inset:58px var(--pad) 125px 70%;overflow:hidden;background:#111a21;border:1px solid #1a2b2012}
.hero-visual img{width:100%;height:100%;object-fit:cover;object-position:43% center;filter:saturate(.55)}
.hero h1{max-width:72%}
/* Equal-size client cards, including two explicitly reserved slots. */
.project{display:flex;flex-direction:column}
.project-image{flex-shrink:0}
.project-info{display:flex;flex-direction:column;flex:1}
.project-info>.eyebrow{min-height:30px}
.project-info h3{font-size:clamp(20px,1.85vw,28px);min-height:2.4em}
.project-info>p:not(.eyebrow){min-height:3.4em;margin-bottom:12px}
.project-info .preview-button{align-self:flex-start;margin-top:auto}
.placeholder-stage{aspect-ratio:16/9;display:grid;place-items:center;background:linear-gradient(135deg,#eff1e9,#e3e9dd)}
.placeholder-stage span{font-family:monospace;font-size:clamp(40px,5vw,72px);font-weight:300;color:#8b9d8b;letter-spacing:-.1em}
.placeholder-label{margin-top:auto;min-height:44px;display:flex;align-items:center;font-size:10px;color:#657561;letter-spacing:.07em}
@media(min-width:701px) and (max-width:1099px){.project-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:701px) and (max-width:1000px){.hero-visual{left:73%}.hero h1{max-width:80%}}
@media(max-width:700px){.hero{justify-content:flex-start}.hero-content{order:1;padding:58px var(--pad) 30px}.hero h1{max-width:100%}.hero-visual{position:relative;inset:auto;order:2;margin:0 var(--pad) 95px;height:190px;flex-shrink:0}.hero-visual img{object-position:center 45%}.project-grid{grid-template-columns:1fr;grid-auto-rows:auto}.project-info h3{font-size:25px;min-height:0}.project-info>.eyebrow{min-height:0}.project-info>p:not(.eyebrow){min-height:0}.project-info .preview-button{margin-top:4px}}
'''
p.write_text(s)
p=Path('app.js');s=p.read_text().replace('This deferred script runs when the text-only hero is ready.', 'The hero never waits on a photograph to finish loading.');p.write_text(s)
p=Path('README.md');s=p.read_text().replace('and a text-only composition.', 'and a restrained coding photograph.').replace('The studio photograph uses a 3840px original.', 'The coding hero and studio photographs use 3840px originals.').replace('- Seven real website snapshots show', '- The portfolio uses nine equally sized slots: seven live projects and two labeled placeholders. Desktop uses three columns and three rows, with two columns on tablets and one on phones.\n- Seven real website snapshots show');p.write_text(s)
p=Path('ASSET-CREDITS.md');s=p.read_text();s=s.replace('- Camera photograph:', '- Coding hero photograph: Unsplash photographic asset, downloaded at 3840px width and optimized locally: https://images.unsplash.com/photo-1555066931-4365d14bab8c\n- Archived camera photograph:');p.write_text(s)
