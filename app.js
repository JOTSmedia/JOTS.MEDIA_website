'use strict';
// The intro clock starts with its first visible frame. Slow downloads and a
// background mobile tab cannot spend the introduction before it can be seen.
(() => {
  const root = document.documentElement;
  const loader = document.querySelector('.site-loader');
  if (!loader) {window.__jotsIntroBoot?.release();return;}
  // Once the independent fallback has exposed the site, a late download must
  // never cover it again. Explicit Replay remains available below.
  const mayAutoStart=window.__jotsIntroBoot
    ? window.__jotsIntroBoot.takeOver()
    : root.classList.contains('is-loading')&&window.getComputedStyle?.(loader)?.visibility!=='hidden';
  let progressFrame=0,deadline=0,elapsed=0,lastFrame=null,stage='intro',running=false;
  let duration=4200,returnDuration=420,parkDuration=160,exitDuration=900;
  const progressFill=loader.querySelector('.loader-progress-fill');
  const percentage=loader.querySelector('.loader-percentage');
  const progressDots=[...loader.querySelectorAll('.loader-wordmark .jots-dot')];
  const leadingDot=loader.querySelector('.loader-wordmark .jots-terminal');
  const homeX=Number(leadingDot?.getAttribute('cx')),homeY=Number(leadingDot?.getAttribute('cy'));
  const homeRadius=Number(leadingDot?.getAttribute('r'))||2.05;
  const points=progressDots.map(dot=>({x:Number(dot.getAttribute('cx')),y:Number(dot.getAttribute('cy'))}));
  const separatorIndex=progressDots.indexOf(leadingDot);
  const separator=leadingDot?.cloneNode(false);
  if(separator){
    separator.setAttribute('class','loader-separator');
    separator.setAttribute('aria-hidden','true');
    separator.setAttribute('opacity','0');
    separator.removeAttribute('fill');
    separator.removeAttribute('style');
    leadingDot.parentNode.insertBefore(separator,leadingDot);
  }
  // Keep the original progress order, but paint its cyan writer on top.
  leadingDot?.ownerSVGElement?.append(leadingDot);
  let shownProgress=-1,litDots=0,headMoving=false;
  const quiet = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('motion-off')) return true;
    try {return localStorage.getItem('jots-motion') === 'off';} catch (_) {return false;}
  };
  const setHeadMoving=moving=>{
    if(!leadingDot||headMoving===moving)return;
    headMoving=moving;
    leadingDot.classList.toggle('is-tracing',moving);
    leadingDot.setAttribute('r',String(moving?homeRadius*1.4:homeRadius));
  };
  const moveHead=(x,y)=>{
    leadingDot?.style.setProperty('--loader-head-transform',`translate(${x-homeX}px,${y-homeY}px)`);
  };
  const parkHead=()=>{
    leadingDot?.style.removeProperty('--loader-head-transform');
    setHeadMoving(false);
    separator?.classList.remove('is-loaded');
  };
  const setProgress=value=>{
    const fraction=Math.max(0,Math.min(1,value));
    const progress=Math.floor(fraction*100);
    if(progressFill)progressFill.style.transform=`scaleX(${fraction})`;
    if(progress!==shownProgress){
      shownProgress=progress;
      if(percentage)percentage.textContent=`${progress}%`;
    }
    // Arrivals, rather than rounded percentages, reveal every individual dot.
    const position=fraction*progressDots.length;
    const next=Math.floor(position);
    for(let i=litDots;i<next;i++)progressDots[i].classList.add('is-loaded');
    for(let i=next;i<litDots;i++)progressDots[i].classList.remove('is-loaded');
    litDots=next;
    const still=quiet();
    // Leave the neutral punctuation behind while the cyan writer draws MEDIA.
    separator?.classList.toggle('is-loaded',!still&&separatorIndex>=0&&next>separatorIndex);
    if(still||!points.length){parkHead();return;}
    setHeadMoving(true);
    const from=points[Math.max(0,Math.min(next-1,points.length-1))];
    const to=points[Math.min(next,points.length-1)];
    const between=position-next;
    moveHead(from.x+(to.x-from.x)*between,from.y+(to.y-from.y)*between);
  };
  const showReturn=fraction=>{
    if(!leadingDot||!points.length){parkHead();return;}
    setHeadMoving(true);
    const last=points[points.length-1];
    const eased=1-Math.pow(1-Math.max(0,Math.min(1,fraction)),3);
    moveHead(last.x+(homeX-last.x)*eased,last.y+(homeY-last.y)*eased);
  };
  const clearTimers=()=>{clearTimeout(deadline);cancelAnimationFrame(progressFrame);progressFrame=0;};
  const release=()=>{
    clearTimers();running=false;
    parkHead();
    loader.classList.remove('is-returning','is-parked');
    root.classList.remove('is-loading','intro-pending','intro-managed','intro-suspended','intro-covering');
    window.__jotsIntroBoot?.restoreScroll();
  };
  const armDeadline=()=>{
    clearTimeout(deadline);
    // Independent of RAF, images and fonts: a stalled animation cannot trap the page.
    if(running&&!document.hidden)deadline=setTimeout(release,Math.max(1400,duration+returnDuration+parkDuration+exitDuration-elapsed+1400));
  };
  const finish=()=>{
    parkHead();stage='leaving';
    root.classList.remove('intro-covering');
    loader.classList.remove('is-returning','is-parked');
    const dot=leadingDot?.getBoundingClientRect();
    if(dot){loader.style.setProperty('--portal-x',`${dot.x+dot.width/2}px`);loader.style.setProperty('--portal-y',`${dot.y+dot.height/2}px`);}
    loader.classList.add('is-leaving');armDeadline();
  };
  const advance=now=>{
    progressFrame=0;
    if(!running||document.hidden)return;
    if(!root.classList.contains('is-loading')){release();return;}
    if(lastFrame===null){
      lastFrame=now;
      root.classList.remove('intro-pending','intro-suspended');
      armDeadline();
    }else{
      elapsed+=Math.max(0,now-lastFrame);lastFrame=now;
    }
    if(elapsed<duration)setProgress(elapsed/duration);
    else{
      if(stage==='intro')setProgress(1);
      const still=quiet();
      const returnEnd=duration+(still?0:returnDuration);
      const parkEnd=returnEnd+(still?0:parkDuration);
      if(elapsed<returnEnd){
        stage='returning';loader.classList.add('is-returning');
        showReturn((elapsed-duration)/returnDuration);
      }else if(elapsed<parkEnd){
        if(stage!=='parked'){
          stage='parked';parkHead();
          loader.classList.remove('is-returning');loader.classList.add('is-parked');
        }
      }else{
        if(stage!=='leaving')finish();
        if(elapsed>=parkEnd+exitDuration){release();return;}
      }
    }
    progressFrame=requestAnimationFrame(advance);
  };
  const play=()=>{
    clearTimers();running=true;stage='intro';elapsed=0;lastFrame=null;
    shownProgress=-1;
    const still=quiet();
    duration=still?300:4200;returnDuration=still?0:420;parkDuration=still?0:160;exitDuration=still?160:900;
    loader.classList.remove('is-leaving','is-returning','is-parked');
    root.classList.add('is-loading','intro-managed','intro-pending','intro-covering');
    root.classList.toggle('intro-suspended',document.hidden);
    setProgress(0);armDeadline();
    if(!document.hidden)progressFrame=requestAnimationFrame(advance);
  };
  document.addEventListener('visibilitychange',()=>{
    if(!running)return;
    clearTimers();lastFrame=null;
    root.classList.toggle('intro-suspended',document.hidden);
    if(!document.hidden){armDeadline();progressFrame=requestAnimationFrame(advance);}
  });
  document.getElementById('replayIntro')?.addEventListener('click',play);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&running)release();
  });
  window.addEventListener('pageshow',event=>{
    // Going Back restores the visitor's page position without replaying the intro.
    if(event.persisted)release();
  });
  if(mayAutoStart)play();
  else release();
})();

(() => {
  const root = document.documentElement;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.getElementById('motionToggle');
  let saved = null;
  try {saved = localStorage.getItem('jots-motion');} catch (_) { /* Storage is optional. */ }
  let off = media.matches || saved === 'off';
  const applyMotion = () => {
    root.classList.toggle('motion-off', off);
    toggle.setAttribute('aria-pressed', String(off));
    toggle.textContent = `Motion: ${off ? 'off' : 'on'}`;
    if (off) document.getAnimations().forEach(animation => animation.cancel());
  };
  toggle.addEventListener('click', () => {
    off = !off;
    saved = off ? 'off' : 'on';
    try {localStorage.setItem('jots-motion', off ? 'off' : 'on');} catch (_) {}
    applyMotion();
  });
  media.addEventListener('change', () => {off = media.matches || saved === 'off'; applyMotion();});
  applyMotion();
  // Content stays visible; the chip and brand mark carry the authored motion.
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobileNav');
  const header = document.querySelector('.site-header');
  const navigationLinks = [...document.querySelectorAll('.site-header nav a, .mobile-nav a')];
  const destinations = ['portfolio', 'services', 'about', 'contact'].map(id => document.getElementById(id));
  let navigationFrame = 0;
  const updateNavigation = () => {
    navigationFrame = 0;
    const line = header.offsetHeight + Math.min(180, innerHeight * .22);
    let current = '';
    destinations.forEach(section => {if (section.getBoundingClientRect().top <= line) current = section.id;});
    navigationLinks.forEach(link => {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    header.classList.toggle('is-scrolled', scrollY > 16);
  };
  const queueNavigation = () => {if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);};
  addEventListener('scroll', queueNavigation, {passive:true});
  addEventListener('resize', queueNavigation);
  addEventListener('hashchange', queueNavigation);
  addEventListener('pageshow', queueNavigation);
  updateNavigation();
  const menuIcon = open => `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="${open ? 'm6 6 12 12M6 18 18 6' : 'M4 8h16M4 16h16'}"/></svg>`;
  const closeMenu = () => {menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.innerHTML = `Menu ${menuIcon(false)}`;};
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open; menuButton.setAttribute('aria-expanded',String(open));
    menuButton.innerHTML = `${open ? 'Close' : 'Menu'} ${menuIcon(open)}`;
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {if (e.key === 'Escape' && !menu.hidden) {closeMenu(); menuButton.focus();}});
  document.addEventListener('pointerdown', event => {if (!menu.hidden && !menu.contains(event.target) && !header.contains(event.target)) closeMenu();});
  document.addEventListener('focusin', event => {if (!menu.hidden && !menu.contains(event.target) && !header.contains(event.target)) closeMenu();});
  matchMedia('(min-width:701px)').addEventListener('change', e => {if (e.matches) closeMenu();});

  // Native dialogs provide focus containment, Escape dismissal and focus return.
  const openDialog = dialog => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else if (dialog.id === 'briefDialog') location.href = 'mailto:hello@jots.media';
  };
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
  document.querySelectorAll('[data-open-brief]').forEach(button => button.addEventListener('click', () => openDialog(document.getElementById('briefDialog'))));
  document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
    const image = document.getElementById('projectPreview');
    image.src = `images/projects/${button.dataset.preview}-1280.webp`;
    image.alt = `${button.dataset.title} website snapshot`;
    document.getElementById('projectTitle').textContent = button.dataset.title;
    document.getElementById('projectVisit').href = button.dataset.url;
    openDialog(document.getElementById('projectDialog'));
  }));
  document.querySelectorAll('[data-legal]').forEach(link => link.addEventListener('click', event => {
    if (typeof document.getElementById('legalDialog').showModal !== 'function') return;
    event.preventDefault();
    const privacy = link.dataset.legal === 'privacy';
    document.getElementById('legalTitle').textContent = privacy ? 'Privacy policy' : 'Terms of service';
    document.getElementById('legalContent').innerHTML = document.getElementById(privacy ? 'privacyPolicyText' : 'termsOfServiceText').innerHTML;
    openDialog(document.getElementById('legalDialog'));
  }));
  const form = document.getElementById('contactForm');
  let briefText = '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    if (!values.name.trim() || !values.company.trim() || !values.message.trim()) {
      const field = ['name','company','message'].find(key => !values[key].trim());
      const input = form.elements[field];
      input.setCustomValidity('Please enter a few details.'); input.reportValidity();
      input.addEventListener('input', () => input.setCustomValidity(''), {once:true}); return;
    }
    briefText = `JOTS.MEDIA project brief\n\nName: ${values.name}\nCompany / brand: ${values.company}\nEmail: ${values.email}\nPhone: ${values.phone || 'Not provided'}\n\nProject overview:\n${values.message}`;
    const draft = document.getElementById('emailDraft');
    draft.href = `mailto:hello@jots.media?subject=${encodeURIComponent(`Project brief — ${values.company}`)}&body=${encodeURIComponent(briefText)}`;
    document.getElementById('briefResult').hidden = false;
    draft.focus();
  });
  // Any edit invalidates the prepared draft so stale details cannot be sent.
  form.addEventListener('input', () => {document.getElementById('briefResult').hidden = true;});
  document.getElementById('downloadBrief').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([briefText], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'JOTS-MEDIA-project-brief.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById('year').textContent = new Date().getFullYear();
})();

// Idle scrolling yields immediately to the visitor, including touch momentum.
// It resumes from their current position only after a fresh quiet interval.
(() => {
  const root=document.documentElement;
  const hero=document.querySelector('.hero');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const idleDelay=5000;
  const sections=[...document.querySelectorAll('main > section, .site-footer')];
  const projects=[...document.querySelectorAll('#portfolio .project')];
  const header=document.querySelector('.site-header');
  const mobilePace={portfolio:20,heading:48,content:60,transition:108};
  const desktopPace={portfolio:32,heading:80,content:100,transition:180};
  let pace=mobilePace;
  let geometryDirty=true,sectionMetrics=[],previewMetrics=[],readingOffset=0,viewInset=0;
  // Measurements change only after a layout event, never on ordinary tour frames.
  const invalidateGeometry=()=>{geometryDirty=true;};
  const measureGeometry=()=>{
    // Match the work wall's desktop layout; resizing refreshes this profile
    // through the same quiet interval as the other layout measurements.
    pace=innerWidth>700?desktopPace:mobilePace;
    const pageTop=scrollY;
    const headerHeight=header?.offsetHeight||56;
    readingOffset=headerHeight+Math.min(150,innerHeight*.2);
    viewInset=headerHeight+24;
    sectionMetrics=sections.map(section=>{
      const rect=section.getBoundingClientRect();
      const style=getComputedStyle(section);
      const paddingTop=parseFloat(style.paddingTop)||0,paddingBottom=parseFloat(style.paddingBottom)||0;
      const heading=section.querySelector('h1,h2');
      const title=heading?.getBoundingClientRect();
      return{
        portfolio:section.id==='portfolio',
        top:rect.top+pageTop,bottom:rect.bottom+pageTop,
        contentTop:rect.top+pageTop+paddingTop,contentBottom:rect.bottom+pageTop-paddingBottom,
        headingStart:title?title.top+pageTop-80:Infinity,
        headingEnd:title?title.bottom+pageTop+Math.min(140,innerHeight*.15):-Infinity
      };
    });
    // The frame starts at its stationary article's top. Its small decorative
    // drift must not move the tour's reading zone or trigger fresh layout reads.
    previewMetrics=projects.map(project=>{
      const top=project.getBoundingClientRect().top+pageTop;
      const height=project.querySelector('.project-image')?.offsetHeight||0;
      return{top,bottom:top+height,height};
    }).filter(preview=>preview.height>0);
    geometryDirty=false;
  };
  const paceAt=position=>{
    if(geometryDirty)measureGeometry();
    const viewTop=position+viewInset,viewBottom=position+innerHeight-48;
    const visibleHeight=Math.max(0,viewBottom-viewTop);
    // Ease down before an arriving preview reaches the reading line, and keep
    // the last one watchable as the next section approaches.
    if(visibleHeight&&previewMetrics.some(preview=>
      Math.min(viewBottom,preview.bottom)-Math.max(viewTop,preview.top)>=Math.min(preview.height,visibleHeight)*.35
    ))return pace.portfolio;
    if(!sectionMetrics.length)return pace.content;
    const readingPoint=position+readingOffset;
    const section=sectionMetrics.find(item=>readingPoint>=item.top&&readingPoint<item.bottom);
    if(!section)return pace.transition;
    if(section.portfolio&&readingPoint>=section.contentTop&&readingPoint<=section.contentBottom)return pace.portfolio;
    if(readingPoint>=section.headingStart&&readingPoint<=section.headingEnd)return pace.heading;
    return readingPoint<section.contentTop||readingPoint>section.contentBottom?pace.transition:pace.content;
  };
  let lastActivity=performance.now(),timer=0,frame=0,running=false,ownPosition=scrollY;
  let previousScrollBehavior='';
  let introWasLoading=root.classList.contains('is-loading'),pointerHeld=false,pageActive=true;
  let pointerOrigin=null;
  const heldKeys=new Set();
  const focusBusy=()=>{
    const active=document.activeElement;
    if(!active || active===document.body)return false;
    return active.matches('input,textarea,select,[contenteditable="true"]');
  };
  const blocked=()=>!pageActive || document.hidden || pointerHeld || heldKeys.size>0 || reduced.matches ||
    root.classList.contains('motion-off') || root.classList.contains('is-loading') ||
    Boolean(document.querySelector('dialog[open],.menu-toggle[aria-expanded="true"]')) || focusBusy() ||
    (scrollY<innerHeight*.6 && hero?.dataset?.heroIntroComplete!=='true' &&
      ['waiting','charging','exploding','dispersed','reassembling'].includes(hero?.dataset?.chipState));
  const halt=()=>{
    const wasRunning=running;
    cancelAnimationFrame(frame);frame=0;running=false;
    if(wasRunning && root.style){
      // Cancel a browser's queued smooth movement before returning control.
      // 'auto' plus the explicit inline style also works in WebKit versions
      // that do not honor the non-standard 'instant' behavior value.
      root.style.scrollBehavior='auto';
      scrollTo({left:scrollX,top:scrollY,behavior:'auto'});
      root.style.scrollBehavior=previousScrollBehavior;
    }
  };
  const state=value=>{if(root.dataset.autoScroll!==value)root.dataset.autoScroll=value;};
  const check=()=>{
    clearTimeout(timer);timer=0;
    if(blocked()){
      halt();state('suspended');
    }else if(scrollY>=root.scrollHeight-innerHeight-1){
      halt();state('finished');
    }else if(!running && performance.now()-lastActivity>=idleDelay){
      start();
    }else if(!running){state('waiting');}
    if(pageActive && !document.hidden)timer=setTimeout(check,200);
  };
  const activity=()=>{
    halt();lastActivity=performance.now();state('waiting');
    check();
  };
  const start=()=>{
    if(blocked())return;
    let last=0,elapsed=0,position=scrollY,velocity=paceAt(scrollY);ownPosition=position;
    const horizontal=scrollX;
    if(root.style){previousScrollBehavior=root.style.scrollBehavior;root.style.scrollBehavior='auto';}
    running=true;state('running');
    const tick=now=>{
      frame=0;
      if(!running)return;
      if(blocked()){activity();return;}
      const maximum=Math.max(0,root.scrollHeight-innerHeight);
      if(last){
        const delta=Math.min(now-last,50);elapsed+=delta;
        const ramp=Math.min(1,elapsed/1200),ease=ramp*ramp*(3-2*ramp);
        const target=paceAt(position);
        // A time-based low-pass keeps section changes smooth at every frame rate.
        velocity+=(target-velocity)*(1-Math.exp(-delta/700));
        position=Math.min(maximum,position+velocity*delta/1000*ease);
        ownPosition=position;scrollTo({left:horizontal,top:position,behavior:'auto'});
      }
      last=now;
      if(position>=maximum-1){halt();state('finished');return;}
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
  };
  const passive={passive:true,capture:true};
  document.addEventListener('pointerdown',()=>{pointerHeld=true;activity();},passive);
  addEventListener('pointerup',()=>{pointerHeld=false;activity();},passive);
  addEventListener('pointercancel',()=>{pointerHeld=false;activity();},passive);
  document.addEventListener('touchstart',()=>{pointerHeld=true;activity();},passive);
  addEventListener('touchend',event=>{pointerHeld=Boolean(event.touches?.length);activity();},passive);
  addEventListener('touchcancel',()=>{pointerHeld=false;activity();},passive);
  document.addEventListener('wheel',activity,passive);
  document.addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Tab'].includes(event.key))heldKeys.add(event.key);
    activity();
  },passive);
  document.addEventListener('keyup',event=>{if(heldKeys.delete(event.key))activity();},passive);
  document.addEventListener('focusin',activity,true);
  document.addEventListener('focusout',activity,true);
  document.addEventListener('pointermove',event=>{
    if(!pointerOrigin){pointerOrigin=[event.clientX,event.clientY];return;}
    if(Math.hypot(event.clientX-pointerOrigin[0],event.clientY-pointerOrigin[1])>=12){
      pointerOrigin=[event.clientX,event.clientY];activity();
    }
  },passive);
  // Scroll events keep postponing the restart through wheel/touch inertia and
  // scrollbar dragging. Our own frame steps are ignored only while running.
  addEventListener('scroll',()=>{
    if(!running || Math.abs(scrollY-ownPosition)>3)activity();
  },{passive:true});
  addEventListener('resize',()=>{invalidateGeometry();activity();},{passive:true});
  addEventListener('hashchange',activity);
  addEventListener('pagehide',()=>{pageActive=false;halt();clearTimeout(timer);});
  addEventListener('pageshow',()=>{pageActive=true;pointerHeld=false;invalidateGeometry();activity();});
  document.addEventListener('visibilitychange',()=>{
    pointerHeld=false;heldKeys.clear();activity();
  });
  addEventListener('blur',()=>{pointerHeld=false;heldKeys.clear();activity();});
  reduced.addEventListener('change',activity);
  new MutationObserver(()=>{
    invalidateGeometry();
    const loading=root.classList.contains('is-loading');
    if(loading!==introWasLoading){introWasLoading=loading;activity();}
    else check();
  }).observe(root,{attributes:true,attributeFilter:['class']});
  if(typeof ResizeObserver==='function'){
    const layoutObserver=new ResizeObserver(invalidateGeometry);
    sections.forEach(section=>layoutObserver.observe(section));
    projects.forEach(project=>layoutObserver.observe(project));
    if(header)layoutObserver.observe(header);
  }
  document.addEventListener('load',invalidateGeometry,true);
  document.fonts?.ready.then(invalidateGeometry);
  check();
})();

// Scrolling project snapshots remain local: no remote scripts, trackers, audio,
// cross-origin frame access, or competing WebGL sites in the background.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => root.classList.contains('motion-off') || reduced.matches;
  const states = [];
  let pageActive = true;
  const canRun = state => state.visible && !state.paused && !motionOff() &&
    pageActive && !document.hidden && !root.classList.contains('is-loading');
  const setButton = state => {
    const paused = state.paused || motionOff();
    state.button.disabled = motionOff();
    state.button.setAttribute('aria-pressed', String(paused));
    state.button.setAttribute('aria-label', `${state.failed ? 'Retry' : paused ? 'Resume' : 'Pause'} ${state.name} preview`);
    state.button.innerHTML = `${state.failed ? 'RETRY' : paused ? 'RESUME' : 'PAUSE'} <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="${paused ? 'm8 5 11 7-11 7Z' : 'M9 5v14M15 5v14'}"/></svg>`;
  };
  const stop = state => {
    state.generation++;state.playing=false;
    clearTimeout(state.timer); state.timer = null;
    cancelAnimationFrame(state.frame); state.frame = null; state.last = null;
  };
  const load = state => {
    if (state.loading) return state.loading;
    const frameWidth = state.viewport.clientWidth;
    const width = frameWidth <= 400 ? 640 : frameWidth * Math.min(devicePixelRatio || 1, 2) > 640 ? 1280 : 640;
    const source = `images/projects/${state.viewport.dataset.story}-story-${width}.webp`;
    state.loading = new Promise(resolve => {
      const preload = new Image();
      let settled=false,committed=false,cleanupReady=()=>{};
      const finish = ready => {
        if(settled)return;
        settled=true;clearTimeout(deadline);cleanupReady();preload.onload=null;preload.onerror=null;
        state.ready=ready;state.failed=!ready;
        if(!ready){
          state.loading=null;state.paused=true;
          if(committed){
            state.image.src=state.poster;
            if(state.posterSet)state.image.setAttribute('srcset',state.posterSet);
          }
          state.status.textContent='FULL PREVIEW UNAVAILABLE / RETRY';
        }
        setButton(state);resolve(ready);
      };
      // Neither a lost response nor a stalled decode can hold a pending start.
      const deadline=setTimeout(()=>finish(false),8000);
      preload.onload = async () => {
        if(settled)return;
        try{
          state.image.removeAttribute('srcset');state.image.src=source;committed=true;
          if(typeof state.image.decode==='function')await state.image.decode();
          else await new Promise((ready,failed)=>{
            if(state.image.complete && state.image.naturalWidth){ready();return;}
            cleanupReady=()=>{state.image.removeEventListener('load',ready);state.image.removeEventListener('error',failed);};
            state.image.addEventListener('load',ready,{once:true});
            state.image.addEventListener('error',failed,{once:true});
          });
          finish(true);
        }catch{finish(false);}
      };
      preload.onerror = () => finish(false);
      preload.src = source;
    });
    return state.loading;
  };
  const run = (state,generation) => {
    if(generation!==state.generation || !canRun(state) || state.playing)return;
    state.playing=true;state.position=state.viewport.scrollTop;state.last=null;
    const tick = now => {
      // A stale callback must never cancel a newer playback generation.
      if(generation!==state.generation)return;
      state.frame=null;
      if(!canRun(state)){stop(state);return;}
      if(state.last){state.position+=Math.min(now-state.last,50)*.022;state.viewport.scrollTop=state.position;}
      state.last=now;
      if(state.viewport.scrollTop>=state.viewport.scrollHeight-state.viewport.clientHeight-1){
        stop(state);state.paused=true;state.status.textContent='END OF PAGE / SCROLL TO REVISIT';setButton(state);return;
      }
      state.frame=requestAnimationFrame(tick);
    };
    state.status.textContent='EXPLORING THE PAGE / SCROLL TO TAKE OVER';
    state.frame=requestAnimationFrame(tick);
  };
  const schedule = state => {
    stop(state);setButton(state);
    if(!canRun(state))return;
    const generation=state.generation;
    state.timer=setTimeout(async()=>{
      state.timer=null;
      if(await load(state))run(state,generation);
    },2000);
  };
  document.querySelectorAll('.project-scroll[data-story]').forEach(viewport => {
    const card=viewport.closest('.project');
    const state={viewport,image:viewport.querySelector('img'),button:card.querySelector('.story-toggle'),status:card.querySelector('.preview-status'),name:card.querySelector('h3').textContent.trim(),visible:false,paused:false,ready:false,failed:false,playing:false,generation:0,last:null,timer:null,frame:null};
    state.poster=state.image.getAttribute('src');state.posterSet=state.image.getAttribute('srcset');
    const manual = () => {stop(state);state.paused=true;state.status.textContent='MANUAL VIEW / SCROLL TO EXPLORE';setButton(state);load(state);};
    viewport.addEventListener('wheel',manual,{passive:true});
    viewport.addEventListener('touchstart',manual,{passive:true});
    viewport.addEventListener('focus',manual);
    state.button.addEventListener('click',async()=>{
      state.paused=!state.paused;stop(state);setButton(state);
      if (!state.paused && !motionOff()) {
        const generation=state.generation;
        if (viewport.scrollTop>=viewport.scrollHeight-viewport.clientHeight-1) viewport.scrollTop=0;
        if(await load(state)) run(state,generation);
      }
    });
    states.push(state);setButton(state);
  });
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const state=states.find(s=>s.viewport===entry.target);
      const wasVisible=state.visible;
      state.visible=entry.isIntersecting && entry.intersectionRatio>=.6;
      // Threshold1 is only a geometry update, not a new two-second dwell.
      if(state.visible && !wasVisible)schedule(state);else if(!state.visible){
        if(wasVisible)stop(state);
        if(!entry.isIntersecting) {state.viewport.scrollTop=0;state.paused=state.failed;state.status.textContent=state.failed?'FULL PREVIEW UNAVAILABLE / RETRY':'HERO VIEW / SCROLL TO EXPLORE';setButton(state);}
      }
    }),{threshold:[0,.6,1]});
    states.forEach(state=>observer.observe(state.viewport));
  } else states.forEach(state=>load(state));
  new MutationObserver(()=>states.forEach(schedule)).observe(root,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>states.forEach(schedule));
  addEventListener('pagehide',()=>{pageActive=false;states.forEach(schedule);});
  addEventListener('pageshow',()=>{pageActive=true;states.forEach(schedule);});
  reduced.addEventListener('change',()=>states.forEach(schedule));
})();

// Service detail changes only in response to an intentional selection.
(() => {
 const art=document.querySelector('.service-art');
 const rows=[...document.querySelectorAll('.service')];
 if(!art||!rows.length)return;
 const labels=['DESIGN.','INTELLIGENCE.','IDENTITY.','CONNECT.','MERCH.','MENUS.','DEVELOP.','PRODUCTION.','PERSPECTIVE.'];
 const descriptions=['DISTINCTIVE WEBSITES. BUILT AROUND YOU.','THOUGHTFUL TOOLS. ROOM FOR BETTER WORK.','A CLEAR IDENTITY. AT EVERY TOUCHPOINT.','CONTENT THAT STARTS A CONVERSATION.','YOUR BRAND. MADE TO WEAR, USE AND KEEP.','CLEAR, INVITING MENUS. PRINT AND DIGITAL.','INTUITIVE EXPERIENCES. BUILT TO WORK.','SOUND AND MOTION. WITH PURPOSE.','ORIGINAL PERSPECTIVES. SHARP FOCUS.'];
 const select=index=>{
  art.dataset.service=String(index);
  art.setAttribute('aria-label',`Selected service: ${rows[index].querySelector('h3').textContent.trim()}`);
  rows.forEach((row,i)=>{row.classList.toggle('is-active',i===index);row.querySelector('button').setAttribute('aria-pressed',String(i===index));});
  art.querySelector('.signal-word').textContent=labels[index];
  art.querySelector('.signal-description').textContent=descriptions[index];
  art.querySelector('.signal-index').textContent=`${String(index+1).padStart(2,'0')} / ${String(rows.length).padStart(2,'0')}`;
 };
 rows.forEach((row,i)=>{const button=row.querySelector('button');button.addEventListener('click',()=>select(i));button.addEventListener('focus',()=>select(i));});
 select(0);
})();
