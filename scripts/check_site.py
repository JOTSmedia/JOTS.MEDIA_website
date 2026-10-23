"""Check the actual static document and asset graph, including srcset/hash routes."""
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
class Site(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.refs=[];self.alts=[];self.labels=[];self.inputs=[];self.metadata={}
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='meta':self.metadata[a.get('property',a.get('name',''))]=a.get('content','')
  for key in ['src','href']:
   if a.get(key):self.refs.append(a[key])
  if 'srcset' in a:self.refs += [v.strip().split()[0] for v in a['srcset'].split(',')]
  if tag=='img':self.alts.append(a.get('alt'))
  if tag=='label':self.labels.append(a.get('for'))
  if tag in ['input','textarea']:self.inputs.append(a.get('id'))
s=Site();s.feed((root/'index.html').read_text());errors=[]
for ref in s.refs:
 u=urlsplit(ref)
 if u.scheme or u.netloc:continue
 if ref.startswith('/') and not ref.startswith('//'):errors.append('Absolute path: '+ref)
 if u.path and not (root/unquote(u.path)).is_file():errors.append('Missing file: '+ref)
 if u.fragment and not u.path and unquote(u.fragment) not in s.ids:errors.append('Missing anchor: '+ref)
for ref in re.findall(r'url\([\"\x27]?([^\)\"\x27]+)',(root/'styles.css').read_text()):
 if not urlsplit(ref).scheme and not (root/ref).is_file():errors.append('Missing CSS asset: '+ref)
if len(s.ids)!=len(set(s.ids)):errors.append('Duplicate IDs')
if any(a is None for a in s.alts):errors.append('Image without alt')
if any(i not in s.labels for i in s.inputs):errors.append('Unlabelled form control')
expected=['https://www.thegreatnotchinn.com/','https://jotsmedia.github.io/beth-elise-site-v9/','https://jotsmedia.github.io/elev8mi_v57/','https://jotsmedia.github.io/SYMZ_v13/','https://jotsmedia.github.io/TRENATION_v10/','https://jotsmedia.github.io/NELSONS_v12/','https://jotsmedia.github.io/LE-DEAUX/']
for url in expected:
 if url not in s.refs:errors.append('Missing project link: '+url)
for slug in ['great-notch','beth-elise','elev8mi','symz','tre-nation','martinez','le-deaux']:
 for width in [640,1280]:
  if not (root/f'images/projects/{slug}-story-{width}.webp').is_file():errors.append('Missing full-page preview: '+slug)
for key in ['og:image','twitter:image']:
 value=s.metadata.get(key,'');u=urlsplit(value)
 if u.scheme!='https' or not u.netloc:errors.append('Share image requires an absolute HTTPS URL: '+key)
 if not (root/unquote(u.path.lstrip('/'))).is_file():errors.append('Missing packaged share image: '+key)
if s.metadata.get('og:image')!=s.metadata.get('twitter:image'):errors.append('Share images do not match')
if s.metadata.get('twitter:card')!='summary_large_image':errors.append('Missing large social card')
if not s.metadata.get('og:image:alt') or not s.metadata.get('twitter:image:alt'):errors.append('Missing share-image description')
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(s.ids)} unique IDs; {len(s.refs)} asset/link references; 7 project URLs; all local assets, anchors, input labels and share-image metadata valid.')
