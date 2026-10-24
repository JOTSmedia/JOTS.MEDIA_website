'use strict';
/* The round cyan terminal writes the dotted name, parks in its own
   separator, then a finite pixel chase travels through the completed letters. */
(() => {
  const mark=document.querySelector('.jots-wordmark');
  if(!mark)return;
  const root=document.documentElement,media=matchMedia('(prefers-reduced-motion: reduce)');
  const dots=[...mark.querySelectorAll('.jots-pixel')];
  const terminal=mark.querySelector('.jots-terminal');
  if(!dots.length||!terminal||typeof dots[0].animate!=='function')return;
  const home=[Number(terminal.getAttribute('cx')),Number(terminal.getAttribute('cy'))];
  const letters=['J','O','T','S','M','E','D','I','A'];
  const routes=[
    [[15,3],[27,3],[21,3],[21,33],[15,39],[9,39],[3,33],[3,27]],
    [[51,3],[63,3],[69,9],[69,33],[63,39],[51,39],[45,33],[45,9],[51,3]],
    [[87,3],[111,3],[99,3],[99,39]],
    [[153,3],[135,3],[129,9],[129,15],[135,21],[147,21],[153,27],[153,33],[147,39],[129,39]],
    [[189,39],[189,3],[201,15],[201,21],[201,15],[213,3],[213,39]],
    [[255,3],[231,3],[231,21],[249,21],[231,21],[231,39],[255,39]],
    [[273,39],[273,3],[291,3],[297,9],[297,33],[291,39],[273,39]],
    [[315,3],[339,3],[327,3],[327,39],[315,39],[339,39]],
    [[357,39],[357,9],[363,3],[375,3],[381,9],[381,39],[381,21],[357,21]]
  ];
  const LETTER=400,APPROACH=320,HANDOFF=70,RETURN=500,SETTLE=240,STEP=28,FADE=280,REST=2400;
  const segments=[];let duration=0,separatorAt=Infinity;
  const add=(a,b,time,ink=false,letter='')=>{
    segments.push({a,b,start:duration,end:duration+time,ink,letter});duration+=time;
  };
  routes.forEach((route,i)=>{
    if(i===4){
      // Write the separator between S and M within the existing handoff time.
      add(routes[i-1].at(-1),home,HANDOFF*.7);separatorAt=duration;
      add(home,route[0],HANDOFF*.3);
    }else add(i?routes[i-1].at(-1):home,route[0],i?HANDOFF:APPROACH);
    const length=route.slice(1).reduce((sum,p,j)=>sum+Math.hypot(p[0]-route[j][0],p[1]-route[j][1]),0);
    route.slice(1).forEach((p,j)=>add(route[j],p,LETTER*Math.hypot(p[0]-route[j][0],p[1]-route[j][1])/length,true,letters[i]));
  });
  const returnStart=duration;
  add(routes.at(-1).at(-1),home,RETURN);
  const pixels=dots.map(node=>{
    const x=Number(node.getAttribute('cx'));
    const y=Number(node.getAttribute('cy'));
    let revealAt=Infinity;
    segments.forEach(s=>{
      if(!s.ink)return;
      const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],length=dx*dx+dy*dy;
      const t=length?Math.max(0,Math.min(1,((x-s.a[0])*dx+(y-s.a[1])*dy)/length)):0;
      if(Math.hypot(x-s.a[0]-t*dx,y-s.a[1]-t*dy)<.02)revealAt=Math.min(revealAt,s.start+(s.end-s.start)*t);
    });
    return{node,revealAt};
  }).sort((a,b)=>a.revealAt-b.revealAt);
  // Incompatible artwork remains readable instead of hiding unmatched pixels.
  if(pixels.some(pixel=>!Number.isFinite(pixel.revealAt)))return;
  // This ink stays behind after the cyan pen writes the separator. The pen
  // becomes the blue separator only when the entire name has been completed.
  const separator=document.createElementNS('http://www.w3.org/2000/svg','circle');
  separator.setAttribute('class','wordmark-separator-placeholder');separator.setAttribute('aria-hidden','true');
  ['cx','cy','r'].forEach(name=>separator.setAttribute(name,terminal.getAttribute(name)));
  mark.append(separator);
  // A stationary light layer fades over the live base color. The chip can
  // change its material mid-pass without freezing a stale animation color.
  const glowLayer=document.createElementNS('http://www.w3.org/2000/svg','g');
  glowLayer.setAttribute('class','wordmark-afterglows');glowLayer.setAttribute('aria-hidden','true');
  const lights=new Map();
  dots.forEach(dot=>{
    const light=document.createElementNS('http://www.w3.org/2000/svg','circle');
    light.setAttribute('class','jots-afterglow');
    ['cx','cy','r'].forEach(name=>light.setAttribute(name,dot.getAttribute(name)));
    lights.set(dot,light);glowLayer.append(light);
  });
  mark.append(glowLayer);
  // The existing terminal is the pen, painted above every pixel it writes.
  mark.append(terminal);
  const SIGNAL=(pixels.length-1)*STEP+FADE;
  let visible=false,frame=0,timer=0,animations=[],started=null,pending=true,revealed=0,separatorDrawn=false;
  let loading=root.classList.contains('is-loading');
  const quiet=()=>media.matches||root.classList.contains('motion-off');
  const blocked=()=>quiet()||document.hidden||root.classList.contains('is-loading')||!visible;
  const setPhase=value=>{mark.dataset.wordmarkState=value;};
  const clearAnimations=()=>{animations.forEach(animation=>animation.cancel());animations=[];};
  const restore=()=>{
    dots.forEach(node=>node.style.removeProperty('opacity'));
    separator.style.removeProperty('opacity');separatorDrawn=false;
    terminal.style.removeProperty('transform');delete mark.dataset.wordmarkLetter;
  };
  const clear=()=>{cancelAnimationFrame(frame);clearTimeout(timer);frame=0;timer=0;clearAnimations();restore();};
  const stop=()=>{clear();setPhase('rest');};
  const ignite=(node,delay=0)=>lights.get(node).animate([
    {opacity:1},
    {opacity:.8,offset:.18},
    {opacity:0}
  ],{duration:FADE,delay,easing:'linear',fill:'none'});
  const draw=elapsed=>{
    if(!separatorDrawn&&elapsed>=separatorAt){separator.style.opacity='1';separatorDrawn=true;}
    while(revealed<pixels.length&&pixels[revealed].revealAt<=elapsed){
      const pixel=pixels[revealed++];pixel.node.style.opacity='1';
      const age=elapsed-pixel.revealAt;
      if(age<FADE){const animation=ignite(pixel.node);animation.currentTime=age;animations.push(animation);}
    }
    const segment=segments.find(s=>elapsed<=s.end)||segments.at(-1);
    let t=Math.max(0,Math.min(1,(elapsed-segment.start)/(segment.end-segment.start)));
    if(!segment.ink)t=t*t*(3-2*t);
    const x=segment.a[0]+(segment.b[0]-segment.a[0])*t,y=segment.a[1]+(segment.b[1]-segment.a[1])*t;
    terminal.style.transform=`translate(${x-home[0]}px,${y-home[1]}px)`;
    if(segment.ink)mark.dataset.wordmarkLetter=segment.letter;
  };
  const tick=now=>{
    frame=0;if(blocked()){stop();return;}
    if(started===null)started=now;
    const elapsed=now-started;draw(Math.min(duration,elapsed));
    if(elapsed>=duration){
      clearAnimations();restore();setPhase('settled');timer=setTimeout(startSignal,SETTLE);return;
    }
    setPhase(elapsed>=returnStart?'returning':'drawing');
    frame=requestAnimationFrame(tick);
  };
  function startSignal(){
    timer=0;if(blocked()){stop();return;}
    clearAnimations();setPhase('signal');
    // Only the dot fills change. There are no connecting paths or extra heads.
    animations=pixels.map((pixel,i)=>ignite(pixel.node,i*STEP));
    timer=setTimeout(()=>{
      timer=0;if(blocked()){stop();return;}
      clearAnimations();setPhase('rest');timer=setTimeout(startSignal,REST);
    },SIGNAL);
  }
  const writeName=()=>{
    if(blocked())return;
    clear();pending=false;revealed=0;started=null;
    dots.forEach(node=>{node.style.opacity='0';});setPhase('drawing');
    frame=requestAnimationFrame(tick);
  };
  const sync=()=>{
    const nextLoading=root.classList.contains('is-loading');
    if(nextLoading&&!loading)pending=true;
    loading=nextLoading;
    if(blocked()){
      stop();if(loading&&!quiet()&&pending)setPhase('waiting');return;
    }
    if(frame||timer)return;
    if(pending)writeName();else{setPhase('rest');timer=setTimeout(startSignal,REST);}
  };
  mark.classList.add('has-wordmark-motion');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{visible=entry.isIntersecting&&entry.intersectionRatio>=.35;});sync();
    },{threshold:[0,.35]});observer.observe(mark);
  }else{
    const updateVisible=()=>{const box=mark.getBoundingClientRect();visible=box.width>0&&box.height>0&&box.bottom>0&&box.top<innerHeight;sync();};
    window.addEventListener('scroll',updateVisible,{passive:true});window.addEventListener('resize',updateVisible);updateVisible();
  }
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class']});
  media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  window.addEventListener('pageshow',sync);sync();
})();
