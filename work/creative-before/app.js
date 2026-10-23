'use strict';
// Loader owns no scrolling, focus, or content visibility. Both the head timer and
// CSS fail-safe work independently if this file, an image, or a third party fails.
(() => {
  const root = document.documentElement;
  const loader = document.querySelector('.site-loader');
  let finishTimer;
  let releaseTimer;
  let progressFrame;
  const progressFill=loader?.querySelector('.loader-progress-fill');
  const percentage=loader?.querySelector('.loader-percentage');
  const setProgress=value=>{
    if(progressFill)progressFill.style.transform=`scaleX(${value/100})`;
    if(percentage)percentage.textContent=`${value}%`;
  };
  const quiet = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('motion-off')) return true;
    try {return localStorage.getItem('jots-motion') === 'off';} catch (_) {return false;}
  };
  const clearTimers = () => {clearTimeout(finishTimer);clearTimeout(releaseTimer);cancelAnimationFrame(progressFrame);};
  const finish = () => {
    if (!root.classList.contains('is-loading')) return;
    cancelAnimationFrame(progressFrame);setProgress(100);
    const dot = loader?.querySelector('.loader-mark circle:last-child')?.getBoundingClientRect();
    if (dot) {loader.style.setProperty('--portal-x',`${dot.x+dot.width/2}px`);loader.style.setProperty('--portal-y',`${dot.y+dot.height/2}px`);}
    loader?.classList.add('is-leaving');
    releaseTimer = setTimeout(() => root.classList.remove('is-loading'), quiet() ? 160 : 900);
  };
  const play = (startedAt = performance.now()) => {
    clearTimers();
    loader?.classList.remove('is-leaving');
    root.classList.add('is-loading');
    const duration=quiet()?300:3000;
    setProgress(0);
    // Percentage measures this timed brand introduction, not network byte counts.
    const advance=now=>{
      if(!root.classList.contains('is-loading'))return;
      setProgress(Math.min(100,Math.floor((now-startedAt)/duration*100)));
      progressFrame=requestAnimationFrame(advance);
    };
    progressFrame=requestAnimationFrame(advance);
    // Give the brand a readable moment even on cached visits. No asset dependency.
    finishTimer = setTimeout(finish, Math.max(0, duration - (performance.now() - startedAt)));
  };
  play(window.__jotsIntroStartedAt ?? performance.now());
  document.getElementById('replayIntro')?.addEventListener('click', () => {
    // Re-arm the independent deadline before displaying a replay.
    clearTimeout(window.__jotsIntroFailSafe);
    window.__jotsIntroFailSafe = setTimeout(() => root.classList.remove('is-loading'), 4800);
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
  // Each section gets a small sequence: label, heading, copy, then supporting
  // cards or imagery. The base page is always visible if animation is unavailable.
  const revealSelectors = [
    ['.hero-content > .hero-mark, .hero-heading-panel, .hero-bottom, .hero-foot', 'hero'],
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
  let lastActivity=performance.now(),timer=0,frame=0,running=false,ownPosition=scrollY;
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
    (scrollY<innerHeight*.6 && ['waiting','charging','exploding','dispersed','reassembling'].includes(hero?.dataset?.chipState));
  const halt=()=>{
    cancelAnimationFrame(frame);frame=0;running=false;
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
    let last=0,elapsed=0,position=scrollY;ownPosition=position;
    const horizontal=scrollX;
    running=true;state('running');
    const tick=now=>{
      frame=0;
      if(!running)return;
      if(blocked()){activity();return;}
      const maximum=Math.max(0,root.scrollHeight-innerHeight);
      if(last){
        const delta=Math.min(now-last,50);elapsed+=delta;
        const ramp=Math.min(1,elapsed/1200),ease=ramp*ramp*(3-2*ramp);
        position=Math.min(maximum,position+35*delta/1000*ease);
        ownPosition=position;scrollTo({left:horizontal,top:position,behavior:'instant'});
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
  addEventListener('resize',activity,{passive:true});
  addEventListener('hashchange',activity);
  addEventListener('pagehide',()=>{pageActive=false;halt();clearTimeout(timer);});
  addEventListener('pageshow',()=>{pageActive=true;pointerHeld=false;activity();});
  document.addEventListener('visibilitychange',()=>{
    pointerHeld=false;heldKeys.clear();activity();
  });
  addEventListener('blur',()=>{pointerHeld=false;heldKeys.clear();activity();});
  reduced.addEventListener('change',activity);
  new MutationObserver(()=>{
    const loading=root.classList.contains('is-loading');
    if(loading!==introWasLoading){introWasLoading=loading;activity();}
    else check();
  }).observe(root,{attributes:true,attributeFilter:['class']});
  check();
})();

// Scrolling project snapshots remain local: no remote scripts, trackers, audio,
// cross-origin frame access, or competing WebGL sites in the background.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => root.classList.contains('motion-off') || reduced.matches;
  const states = [];
  const setButton = state => {
    const paused = state.paused || motionOff();
    state.button.disabled = motionOff();
    state.button.setAttribute('aria-pressed', String(paused));
    state.button.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} ${state.name} preview`);
    state.button.innerHTML = `${paused ? 'RESUME' : 'PAUSE'} <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="${paused ? 'm8 5 11 7-11 7Z' : 'M9 5v14M15 5v14'}"/></svg>`;
  };
  const stop = state => {
    clearTimeout(state.timer); state.timer = null;
    cancelAnimationFrame(state.frame); state.frame = null; state.last = null;
  };
  const load = state => {
    if (state.loading) return state.loading;
    const width = state.viewport.clientWidth * Math.min(devicePixelRatio || 1, 2) > 640 ? 1280 : 640;
    const source = `images/projects/${state.viewport.dataset.story}-story-${width}.webp`;
    state.loading = new Promise(resolve => {
      const preload = new Image();
      preload.onload = () => {
        state.image.removeAttribute('srcset'); state.image.src = source;
        state.ready = true; resolve(true);
      };
      preload.onerror = () => {
        state.status.textContent = 'HERO VIEW / FULL PREVIEW UNAVAILABLE';
        resolve(false);
      };
      preload.src = source;
    });
    return state.loading;
  };
  const run = state => {
    if (!state.visible || state.paused || motionOff() || document.hidden) return;
    state.position = state.viewport.scrollTop;
    const tick = now => {
      if (!state.visible || state.paused || motionOff() || document.hidden) {stop(state);return;}
      if (state.last) {state.position += Math.min(now-state.last,50) * .022;state.viewport.scrollTop = state.position;}
      state.last = now;
      if (state.viewport.scrollTop >= state.viewport.scrollHeight-state.viewport.clientHeight-1) {
        stop(state);state.paused=true;state.status.textContent='END OF PAGE / SCROLL TO REVISIT';setButton(state);return;
      }
      state.frame=requestAnimationFrame(tick);
    };
    state.status.textContent='EXPLORING THE PAGE / SCROLL TO TAKE OVER';
    state.frame=requestAnimationFrame(tick);
  };
  const schedule = state => {
    stop(state);setButton(state);
    if (!state.visible || state.paused || motionOff() || document.hidden) return;
    state.timer=setTimeout(async()=>{state.timer=null;if(await load(state)) run(state);},2000);
  };
  document.querySelectorAll('.project-scroll[data-story]').forEach(viewport => {
    const card=viewport.closest('.project');
    const state={viewport,image:viewport.querySelector('img'),button:card.querySelector('.story-toggle'),status:card.querySelector('.preview-status'),name:card.querySelector('h3').textContent.trim(),visible:false,paused:false,ready:false,last:null,timer:null,frame:null};
    const manual = () => {stop(state);state.paused=true;state.status.textContent='MANUAL VIEW / SCROLL TO EXPLORE';setButton(state);load(state);};
    viewport.addEventListener('wheel',manual,{passive:true});
    viewport.addEventListener('touchstart',manual,{passive:true});
    viewport.addEventListener('focus',manual);
    state.button.addEventListener('click',async()=>{
      state.paused=!state.paused;stop(state);setButton(state);
      if (!state.paused && !motionOff()) {
        if (viewport.scrollTop>=viewport.scrollHeight-viewport.clientHeight-1) viewport.scrollTop=0;
        if(await load(state)) run(state);
      }
    });
    states.push(state);setButton(state);
  });
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const state=states.find(s=>s.viewport===entry.target);
      state.visible=entry.isIntersecting && entry.intersectionRatio>=.6;
      if(state.visible) schedule(state);else {
        stop(state);
        if(!entry.isIntersecting) {state.viewport.scrollTop=0;state.paused=false;state.status.textContent='HERO VIEW / SCROLL TO EXPLORE';setButton(state);}
      }
    }),{threshold:[0,.6,1]});
    states.forEach(state=>observer.observe(state.viewport));
  } else states.forEach(state=>load(state));
  new MutationObserver(()=>states.forEach(schedule)).observe(root,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>states.forEach(schedule));
  reduced.addEventListener('change',()=>states.forEach(schedule));
})();
