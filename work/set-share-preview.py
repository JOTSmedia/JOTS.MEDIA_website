from pathlib import Path
import re
p=Path('index.html');s=p.read_text();s=s.replace('<html lang="en">','<html lang="en" prefix="og: https://ogp.me/ns#">',1)
s=re.sub(r'<meta property="og:[^"]+" content="[^"]*">','',s)
metadata='''
<link rel="canonical" href="https://jots.media/">
<meta property="og:site_name" content="JOTS.MEDIA">
<meta property="og:title" content="JOTS.MEDIA — MODERN MEDIA. MADE FOR YOU.">
<meta property="og:description" content="Creative vision. Digital precision. Explore selected work from JOTS.MEDIA.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://jots.media/">
<meta property="og:image" content="https://jots.media/images/social/jots-media-hero-20261023.jpg">
<meta property="og:image:secure_url" content="https://jots.media/images/social/jots-media-hero-20261023.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="JOTS.MEDIA hero with the dotted logo, MODERN MEDIA. MADE FOR YOU. headline, and white technology background.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="JOTS.MEDIA — MODERN MEDIA. MADE FOR YOU.">
<meta name="twitter:description" content="Creative vision. Digital precision. Explore selected work from JOTS.MEDIA.">
<meta name="twitter:image" content="https://jots.media/images/social/jots-media-hero-20261023.jpg">
<meta name="twitter:image:alt" content="JOTS.MEDIA hero with the dotted logo, MODERN MEDIA. MADE FOR YOU. headline, and white technology background.">
'''
s=s.replace('<script>window.__jotsIntroStartedAt',metadata+'<script>window.__jotsIntroStartedAt',1);p.write_text(s)
p=Path('scripts/build.mjs');s=p.read_text().replace("'images/logos','files'", "'images/logos','images/social','files'");p.write_text(s)
p=Path('scripts/check_site.py');s=p.read_text();s=s.replace('self.inputs=[]','self.inputs=[];self.metadata={}')
s=s.replace("  if 'id' in a:self.ids.append(a['id'])", "  if 'id' in a:self.ids.append(a['id'])\n  if tag=='meta':self.metadata[a.get('property',a.get('name',''))]=a.get('content','')")
s=s.replace("if errors:raise SystemExit", "for key in ['og:image','twitter:image']:\n value=s.metadata.get(key,'');u=urlsplit(value)\n if u.scheme!='https' or not u.netloc:errors.append('Share image requires an absolute HTTPS URL: '+key)\n if not (root/unquote(u.path.lstrip('/'))).is_file():errors.append('Missing packaged share image: '+key)\nif s.metadata.get('og:image')!=s.metadata.get('twitter:image'):errors.append('Share images do not match')\nif s.metadata.get('twitter:card')!='summary_large_image':errors.append('Missing large social card')\nif not s.metadata.get('og:image:alt') or not s.metadata.get('twitter:image:alt'):errors.append('Missing share-image description')\nif errors:raise SystemExit")
s=s.replace("all local assets, anchors and input labels valid.","all local assets, anchors, input labels and share-image metadata valid.");p.write_text(s)
p=Path('README.md');s=p.read_text();s += '''
## Shared-link hero preview

The Open Graph and X/Twitter large-image card use a 1200×630 JPEG screenshot of the actual header and hero, captured after the intro and reveal animations finish. This includes the dotted logo, headline, and white technology background; the loading screen is excluded.

The canonical URL is `https://jots.media/`, and both image tags point to `https://jots.media/images/social/jots-media-hero-20261023.jpg`. The image is bundled in `dist/images/social/`. These tags are in the saved HTML and do not require JavaScript. To publish under a different hostname or GitHub Pages subdirectory, update the canonical, `og:url`, and absolute image URLs together; ordinary page assets remain relative.

Shared previews can be verified publicly after deploying the updated HTML and JPEG to that domain. Existing cached previews may need to be re-scraped by the sharing service. When changing the hero later, capture a new screenshot, give the JPEG a new versioned filename, and update both image tags.
''';p.write_text(s)
