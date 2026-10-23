from pathlib import Path
import re

def icon(path):
 return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+path+'"/></svg>'
icons={'↗':icon('M6 18 18 6M6 6h12v12'),'↘':icon('m6 6 12 12M6 18h12V6'),'↓':icon('M12 4v16m-6-6 6 6 6-6'),'＋':icon('M12 5v14M5 12h14'),'Ⅱ':icon('M9 5v14M15 5v14'),'×':icon('m6 6 12 12M6 18 18 6')}
p=Path('index.html');s=p.read_text()
s=re.sub(r'<span class="strip-mark"[^>]*>.*?</span>','',s)
s=re.sub(r'<span class="service-cross"[^>]*>.*?</span>','',s)
s=re.sub(r'<span class="accent"[^>]*>\*</span>','',s)
for symbol,svg in icons.items():s=s.replace(symbol,svg)
# The navigation uses an actual drawn menu icon rather than a typographic plus.
menu=icon('M4 8h16M4 16h16')
s=s.replace('Menu <span aria-hidden="true">'+icons['＋']+'</span>','Menu '+menu)
p.write_text(s)
p=Path('app.js');s=p.read_text()
s=s.replace("  const closeMenu = () =>", "  const menuIcon = open => `<svg class=\"ui-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"${open ? 'm6 6 12 12M6 18 18 6' : 'M4 8h16M4 16h16'}\"/></svg>`;\n  const closeMenu = () =>")
s=s.replace("menuButton.innerHTML = 'Menu <span aria-hidden=\"true\">＋</span>';", "menuButton.innerHTML = `Menu ${menuIcon(false)}`;")
s=s.replace("menuButton.innerHTML = `${open ? 'Close' : 'Menu'} <span aria-hidden=\"true\">${open ? '−' : '＋'}</span>`;", "menuButton.innerHTML = `${open ? 'Close' : 'Menu'} ${menuIcon(open)}`;")
s=s.replace("state.button.innerHTML = `${paused ? 'RESUME' : 'PAUSE'} <span aria-hidden=\"true\">${paused ? '▶' : 'Ⅱ'}</span>`;", "state.button.innerHTML = `${paused ? 'RESUME' : 'PAUSE'} <svg class=\"ui-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"${paused ? 'm8 5 11 7-11 7Z' : 'M9 5v14M15 5v14'}\"/></svg>`;")
s=s.replace(".textContent.replace('↗','').trim()", ".textContent.trim()")
p.write_text(s)
