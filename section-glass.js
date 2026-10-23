'use strict';
/* Five short physical-glass studies. Content remains untouched and visible.
   Geometry runs only on entry; the browser owns each bounded WAAPI sequence. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width:700px)');
  const running = new Set();
  const scenes = [];
  const maxConcurrent = 2;
  const duration = 2500;
  const supported = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function' && 'IntersectionObserver' in window;
  const isQuiet = () => reduced.matches || root.classList.contains('motion-off');
  const isSuspended = () => document.hidden || root.classList.contains('is-loading');
  const definitions = [
    {name:'work',section:'.work',host:'.project-image'},
    {name:'services',section:'.services',host:'.signal-field'},
    {name:'studio',section:'.about',host:'.about-photo'},
    {name:'process',section:'.process',before:'.process-heading'},
    {name:'contact',section:'.contact',before:'.contact-heading'}
  ];

  const setState = (scene, state) => { scene.section.dataset.glassState = state; };
  const removeScene = scene => {
    clearTimeout(scene.deadline);
    scene.animations.forEach(animation => {
      try { animation.cancel(); } catch (_) { /* A finished animation can already be detached. */ }
    });
    scene.animations.length = 0;
    scene.layer?.remove();
    scene.layer = null;
    running.delete(scene);
    delete scene.section.dataset.glassFragments;
  };
  const settle = (scene, state = 'settled') => {
    if (scene.done && !running.has(scene)) return;
    scene.done = true;
    removeScene(scene);
    if (scene.isSculpture) mountRest(scene);
    setState(scene, state);
  };
  const flush = () => {
    if (!supported || isSuspended() || isQuiet()) return;
    for (const scene of scenes) {
      if (running.size >= maxConcurrent) break;
      if (!scene.done && !running.has(scene) && scene.inView) play(scene);
    }
  };
  const finish = scene => {
    settle(scene, isQuiet() ? 'quiet' : 'settled');
    flush();
  };

  /* Different constructions share one material: a tiled lens, a glass wafer,
     a photographic lens, an exploded three-step bar and a folded fan. */
  const geometry = (scene, width, height, compact) => {
    const pieces = [];
    const add = (x,y,w,h,rx,ry,rz,depth,index) => {
      const outwardX = x === 0 ? (index % 2 ? 1 : -1) * width * .055 : x * .38;
      const outwardY = y === 0 ? (index % 2 ? 1 : -1) * height * .1 : y * .52;
      pieces.push({x,y,w,h,rx,ry,rz,depth,ex:x + outwardX,ey:y + outwardY - height*.035,
        ez:depth + (compact ? 56 : 110) + index % 3 * (compact ? 11 : 24),
        erx:rx + (index % 2 ? -1 : 1) * (compact ? 20 : 28),
        ery:ry + (index % 2 ? 1 : -1) * (compact ? 24 : 35),
        erz:rz + (index % 2 ? 1 : -1) * (scene.name === 'contact' ? 15 : 9)});
    };
    if (scene.name === 'contact') {
      const count = compact ? 3 : 5;
      const size = Math.min(width * (compact ? .25 : .15), compact ? 100 : 160);
      for (let i=0; i<count; i++) {
        const n=i-(count-1)/2;
        add(n*size*.74,Math.abs(n)*height*.045-height*.035,size,size*.72,-14,22,n*9,i*5,i);
      }
    } else {
      const cols = compact ? 2 : 3;
      const rows = scene.name === 'studio' && !compact ? 3 : 2;
      const spanW = Math.min(width * (scene.name === 'process' ? .71 : .65), scene.name === 'process' ? 700 : 850);
      const spanH = Math.min(height * (scene.name === 'process' ? .6 : .58), spanW * (scene.name === 'services' ? .85 : .63));
      const w=spanW/cols, h=spanH/rows;
      for (let row=0;row<rows;row++) for (let col=0;col<cols;col++) {
        const index=row*cols+col;
        const x=(col-(cols-1)/2)*(w+3), y=(row-(rows-1)/2)*(h+3);
        const rx=scene.name==='process' ? 18 : scene.name==='services' ? -10 : 9;
        const ry=scene.name==='process' ? -28 : scene.name==='studio' ? 17 : -16;
        add(x,y,w,h,rx,ry,scene.name==='process' ? -7 : -3,index%2*3,index);
      }
    }
    return pieces;
  };
  const transform = (p, exploded = false) => {
    const x=exploded?p.ex:p.x,y=exploded?p.ey:p.y,z=exploded?p.ez:p.depth;
    const rx=exploded?p.erx:p.rx,ry=exploded?p.ery:p.ry,rz=exploded?p.erz:p.rz;
    return `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
  };
  const mount = scene => {
    const bounds=scene.host.getBoundingClientRect();
    if (bounds.width<1 || bounds.height<1) return null;
    const layer=document.createElement('div');
    layer.className=`section-glass-scene section-glass-scene--${scene.name}`;
    layer.setAttribute('aria-hidden','true');
    const rig=document.createElement('div');
    rig.className='section-glass-rig';
    layer.append(rig);
    scene.layer=layer;
    scene.host.append(layer);
    const frame=layer.getBoundingClientRect();
    const pieces=geometry(scene,frame.width,frame.height,phone.matches);
    const shards=pieces.map(piece=>{
      const shard=document.createElement('div');
      shard.className='section-glass-shard';
      shard.style.setProperty('--glass-w',`${piece.w.toFixed(2)}px`);
      shard.style.setProperty('--glass-h',`${piece.h.toFixed(2)}px`);
      shard.style.transform=transform(piece);
      shard.style.opacity='.62';
      const face=document.createElement('span');face.className='section-glass-face';
      const back=document.createElement('span');back.className='section-glass-back';
      shard.append(back,face);rig.append(shard);
      return shard;
    });
    return {layer,pieces,shards};
  };
  const mountRest = scene => {
    if (!scene.isSculpture || scene.layer) return;
    try {
      const object=mount(scene);
      if (object) object.layer.classList.add('is-resting');
    } catch (_) {
      scene.layer?.remove();
      scene.layer=null;
    }
  };
  const play = scene => {
    if (scene.done || running.has(scene) || isQuiet() || isSuspended()) return;
    try {
      // The baseline sculpture is rebuilt to the current responsive geometry.
      removeScene(scene);
      const object=mount(scene);
      if (!object) return;
      const {layer,pieces,shards}=object;
      layer.classList.add('is-playing');
      scene.section.dataset.glassFragments=String(pieces.length);
      setState(scene,'exploding');
      running.add(scene);
      pieces.forEach((piece,index) => {
        const home=transform(piece),away=transform(piece,true);
        const tilt=transform({...piece,rx:piece.rx+3,ry:piece.ry-3,depth:piece.depth+5});
        const animation=shards[index].animate([
          {offset:0,transform:home,opacity:scene.isSculpture?.62:0,easing:'cubic-bezier(.16,1,.3,1)'},
          {offset:.10,transform:home,opacity:.84,easing:'cubic-bezier(.16,1,.3,1)'},
          {offset:.37,transform:away,opacity:1,easing:'ease-in-out'},
          {offset:.48,transform:away,opacity:1,easing:'cubic-bezier(.16,1,.3,1)'},
          {offset:.82,transform:tilt,opacity:.86,easing:'ease-out'},
          {offset:.92,transform:home,opacity:.65,easing:'ease-out'},
          {offset:1,transform:home,opacity:scene.isSculpture?.62:0}
        ],{duration,delay:index*22,fill:'both'});
        scene.animations.push(animation);
      });
      // A separate deadline clears even if animation promises never settle.
      scene.deadline=setTimeout(()=>finish(scene),duration + pieces.length*22 + 350);
      Promise.allSettled(scene.animations.map(animation=>animation.finished)).then(()=>{
        if (running.has(scene)) finish(scene);
      });
    } catch (_) {
      finish(scene);
    }
  };

  definitions.forEach(definition => {
    const section=document.querySelector(definition.section);
    if (!section) return;
    let host=definition.host ? section.querySelector(definition.host) : null;
    if (definition.before) {
      const before=section.querySelector(definition.before);
      if (!before) return;
      host=document.createElement('div');
      host.className=`section-glass-slot section-glass-slot--${definition.name}`;
      host.setAttribute('aria-hidden','true');
      before.before(host);
    }
    if (!host) return;
    host.classList.add('section-glass-host');
    section.dataset.glassScene=definition.name;
    const scene={name:definition.name,section,host,isSculpture:!!definition.before,done:false,inView:false,animations:[],layer:null,deadline:0};
    scenes.push(scene);
    setState(scene,supported && !isQuiet() ? 'waiting' : 'quiet');
    if (scene.isSculpture) mountRest(scene);
  });
  if (!supported) return;

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const scene=scenes.find(item=>item.host===entry.target);
      if (!scene) return;
      scene.inView=entry.isIntersecting && entry.intersectionRatio>.08;
      if (!scene.inView && running.has(scene)) settle(scene);
    });
    flush();
  },{threshold:[0,.09,.2],rootMargin:'0px 0px -6% 0px'});
  scenes.forEach(scene=>observer.observe(scene.host));
  const refresh=()=>{
    if (isQuiet() || isSuspended()) {
      scenes.forEach(scene=>{
        if (running.has(scene)) settle(scene,isQuiet()?'quiet':'settled');
        else if (!scene.done) {
          setState(scene,isQuiet()?'quiet':'waiting');
          if (scene.isSculpture) mountRest(scene);
        }
      });
    } else {
      scenes.forEach(scene=>{if(!scene.done)setState(scene,'waiting');});
      flush();
    }
  };
  new MutationObserver(refresh).observe(root,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',refresh);
  document.addEventListener('visibilitychange',refresh);
  addEventListener('pagehide',()=>running.forEach(scene=>settle(scene)));
  addEventListener('pageshow',refresh);
  // A resized object settles instead of keeping stale off-center coordinates.
  addEventListener('resize',()=>{
    scenes.forEach(scene=>{
      if (running.has(scene)) settle(scene);
      else if (scene.isSculpture && scene.layer) {removeScene(scene);mountRest(scene);}
    });
  },{passive:true});
})();
