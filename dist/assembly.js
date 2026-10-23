'use strict';
// Object-shaped alpha sprites lift from a stationary circuit board. The original
// photograph remains the fallback and the finished view; no image is shattered.
(() => {
  const root=document.documentElement, hero=document.querySelector('.hero');
  const visual=document.querySelector('.hero-visual'), image=document.getElementById('heroImage');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || !visual || !image) return;
  let visible=hero.getBoundingClientRect().bottom>100, played=false, failed=false;
  let canvas=null, scene=null, frame=0, timer=0, generation=0, pending=false, assetsPromise=null;
  let phase='idle', started=0, flowStarted=0, lastFlowFrame=0;
  const allowed=()=>visible && !document.hidden && !reduced.matches &&
    !root.classList.contains('motion-off') && !root.classList.contains('is-loading');
  const setState=value=>{if(hero.dataset.chipState!==value)hero.dataset.chipState=value;};
  const stop=()=>{
    if(phase==='exploding')played=true;
    generation++;clearTimeout(timer);cancelAnimationFrame(frame);pending=false;
    canvas?.remove();canvas=null;scene=null;phase='paused';
    visual.classList.remove('is-exploding','has-circuit-animation');
    hero.removeAttribute('data-circuit-light');hero.removeAttribute('data-circuit-route');setState('paused');
  };
  const loadImage=url=>new Promise((resolve,reject)=>{
    const asset=new Image();asset.decoding='async';
    asset.onload=()=>resolve(asset);asset.onerror=()=>reject(new Error('Assembly image unavailable'));
    asset.src=url;
  });
  const loadAssets=()=>{
    if(assetsPromise)return assetsPromise;
    const boardWidth=innerWidth<=700?640:devicePixelRatio>1.25?1600:960;
    assetsPromise=Promise.all([
      fetch('images/assembly/components.json').then(response=>{
        if(!response.ok)throw new Error('Assembly manifest unavailable');return response.json();
      }),loadImage('images/assembly/components.webp'),loadImage(`images/assembly/board-${boardWidth}.webp`),
      fetch('images/assembly/circuit-paths.json').then(response=>{
        if(!response.ok)throw new Error('Circuit routes unavailable');return response.json();
      })
    ]).then(([manifest,atlas,board,circuits])=>({manifest,atlas,board,circuits}));
    return assetsPromise;
  };
  const ease=p=>{const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t);};
  const buildScene=assets=>{
    const box=visual.getBoundingClientRect();
    const density=Math.min(devicePixelRatio||1,1.5,1600/box.width);
    const width=Math.round(box.width*density),height=Math.round(box.height*density);
    canvas=document.createElement('canvas');canvas.className='chip-explosion';
    canvas.width=width;canvas.height=height;canvas.setAttribute('aria-hidden','true');
    const ctx=canvas.getContext('2d');
    const layer=document.createElement('canvas');layer.width=width;layer.height=height;
    const layerCtx=layer.getContext('2d');
    if(!ctx||!layerCtx)throw new Error('Canvas unavailable');
    const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight)*1.025;
    const photoWidth=image.naturalWidth*scale,photoHeight=image.naturalHeight*scale;
    const position=parseFloat(getComputedStyle(image).objectPosition)/100||.5;
    const x=(width-photoWidth)*position+width*.025*(position-.5),y=(height-photoHeight)*.5;
    const project=(px,py)=>[x+px/assets.manifest.sourceWidth*photoWidth,y+py/assets.manifest.sourceHeight*photoHeight];
    const parts=assets.manifest.parts.map((part,index)=>{
      const [sx,sy,sw,sh]=part.source,[px,py]=project(sx+sw/2,sy+sh/2);
      const w=sw/assets.manifest.sourceWidth*photoWidth,h=sh/assets.manifest.sourceHeight*photoHeight;
      const seed=(index*7%19)/18,main=index===0;
      const phone=box.width<=700;
      const compactPhone=phone&&innerHeight<700;
      // The phone has its own camera composition: the lifted processor comes
      // fully into view above the copy instead of remaining cropped at the edge.
      const peakScale=main&&phone?Math.min(1,width*(compactPhone?.64:.74)/w):1.035;
      return {...part,px,py,w,h,seed,
        peakScale,
        dx:main?(phone?width*.60-px:photoWidth*.012):((sx+sw/2)/1672-.82)*photoWidth*.18+(seed-.5)*width*.035,
        lift:main?Math.min(height*(compactPhone?.365:phone?.34:.24),photoWidth*(phone?.20:.12)):Math.min(height*.16,(28+seed*60)*density+w*.25),
        rotation:main?-.025:(seed-.5)*.16,delay:main?0:seed*.16};
    }).sort((a,b)=>a.py-b.py);
    // Recorded groove pixels, resampled at equal distance for steady light speed.
    // Use the same projection as the image, including its mobile crop and scale.
    const paths=assets.circuits.routes.map((points,index)=>{
      const lengths=[0];
      for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
      const total=lengths.at(-1);let segment=1;
      const projected=Array.from({length:121},(_,i)=>{
        const distance=total*i/120;
        while(segment<lengths.length-1&&lengths[segment]<distance)segment++;
        const t=(distance-lengths[segment-1])/(lengths[segment]-lengths[segment-1]||1);
        const a=points[segment-1],b=points[segment];
        return project(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);
      });
      const metadata=assets.circuits.routeMetadata?.[index];
      const xs=projected.map(point=>point[0]),ys=projected.map(point=>point[1]);
      // Do not spend frame time on branches completely outside the phone crop.
      const margin=28*density;
      return {points:projected,id:metadata.id,
        strength:metadata?.strength??1,
        visible:Math.max(...xs)>=-margin&&Math.min(...xs)<=width+margin&&
          Math.max(...ys)>=-margin&&Math.min(...ys)<=height+margin};
    });
    // One distance clock drives the whole board. Hidden passages let the stream
    // change lanes beyond the photograph or beneath a component, without
    // inventing visible wires across the board.
    const sourceScale=photoWidth/assets.circuits.sourceWidth;
    const stream={legs:[],length:0,speed:3200*sourceScale,trail:220*sourceScale};
    const addLeg=(points,route=null)=>{
      const distances=[0];
      for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
      const length=distances.at(-1);
      if(length<=0)return;
      stream.legs.push({points,distances,length,start:stream.length,end:stream.length+length,route});
      stream.length+=length;
    };
    const itinerary=assets.circuits.streamTraversal.map(step=>{
      const route=paths.find(path=>path.id===step.routeId);
      return {route,points:step.direction===-1?[...route.points].reverse():route.points};
    });
    const outsideJoin=(from,to)=>{
      const [fw,fh]=[assets.circuits.sourceWidth,assets.circuits.sourceHeight];
      const source=point=>[(point[0]-x)/sourceScale,(point[1]-y)/sourceScale];
      const a=source(from),b=source(to),padding=28;
      if(a[1]>fh-3&&b[1]>fh-3)return[project(a[0],fh+padding),project(b[0],fh+padding)];
      if(a[1]<3&&b[1]<3)return[project(a[0],-padding),project(b[0],-padding)];
      if(a[0]>fw-3&&b[0]>fw-3)return[project(fw+padding,a[1]),project(fw+padding,b[1])];
      return [];
    };
    for(let i=0;i<itinerary.length;i++){
      const current=itinerary[i],next=itinerary[(i+1)%itinerary.length];
      addLeg(current.points,current.route);
      const from=current.points.at(-1),to=next.points[0];
      addLeg([from,...outsideJoin(from,to),to]);
    }
    // Cache the dim tube body once. Only the energized packet moves each frame.
    const tubes=document.createElement('canvas');tubes.width=width;tubes.height=height;
    const tubeCtx=tubes.getContext('2d');
    if(tubeCtx){
      tubeCtx.lineCap='round';tubeCtx.lineJoin='round';
      for(const {points,strength,visible} of paths){
        if(!visible)continue;
        tubeCtx.globalAlpha=strength;
        tubeCtx.beginPath();tubeCtx.moveTo(...points[0]);
        for(let i=1;i<points.length;i++)tubeCtx.lineTo(...points[i]);
        tubeCtx.strokeStyle='rgba(0,180,223,.10)';tubeCtx.lineWidth=5*density;
        tubeCtx.shadowColor='rgba(0,195,245,.35)';tubeCtx.shadowBlur=7*density;tubeCtx.stroke();
        tubeCtx.shadowBlur=0;tubeCtx.strokeStyle='rgba(0,139,197,.24)';tubeCtx.lineWidth=1.6*density;tubeCtx.stroke();
        tubeCtx.strokeStyle='rgba(209,253,255,.55)';tubeCtx.lineWidth=.6*density;tubeCtx.stroke();
      }
    }
    visual.append(canvas);visual.classList.add('has-circuit-animation');
    return {ctx,layer,layerCtx,tubes,width,height,density,photoWidth,photoHeight,x,y,parts,paths,stream,...assets};
  };
  const paintAssembly=spread=>{
    const s=scene,c=s.layerCtx;
    c.clearRect(0,0,s.width,s.height);c.drawImage(s.board,s.x,s.y,s.photoWidth,s.photoHeight);
    // Grounded shadows and fine guides make the separation read as an assembly.
    for(const part of s.parts){
      const amount=ease((spread-part.delay)/(1-part.delay));
      if(amount===0||part.area<1500)continue;
      c.save();c.translate(part.px,part.py+part.h*.18);c.scale(part.w*.45,Math.max(3,part.h*.15));
      const shadow=c.createRadialGradient(0,0,0,0,0,1);
      shadow.addColorStop(0,`rgba(32,76,85,${amount*.12})`);shadow.addColorStop(1,'rgba(32,76,85,0)');
      c.fillStyle=shadow;c.fillRect(-1,-1,2,2);c.restore();
      c.save();c.globalAlpha=amount*.22;c.strokeStyle='#008c94';c.lineWidth=s.density*.7;
      c.setLineDash([2*s.density,5*s.density]);c.beginPath();c.moveTo(part.px,part.py);
      c.lineTo(part.px+part.dx*amount,part.py-part.lift*amount);c.stroke();c.restore();
    }
    for(const part of s.parts){
      const amount=ease((spread-part.delay)/(1-part.delay));
      c.save();c.translate(part.px+part.dx*amount,part.py-part.lift*amount);
      c.rotate(part.rotation*amount);const scale=1+amount*(part.peakScale-1);c.scale(scale,scale);
      c.drawImage(s.atlas,...part.atlas,-part.w/2,-part.h/2,part.w,part.h);c.restore();
    }
    // Crossfade only at the assembled endpoints to preserve the original scene.
    s.ctx.clearRect(0,0,s.width,s.height);
    s.ctx.drawImage(image,s.x,s.y,s.photoWidth,s.photoHeight);
    s.ctx.save();s.ctx.globalAlpha=Math.min(1,spread*6);s.ctx.drawImage(s.layer,0,0);s.ctx.restore();
  };
  const paintLights=now=>{
    const s=scene,c=s.ctx;c.clearRect(0,0,s.width,s.height);c.drawImage(s.tubes,0,0);
    const stream=s.stream,head=((now-flowStarted)/1000*stream.speed)%stream.length;
    const pointAt=(leg,distance)=>{
      let i=1;
      while(i<leg.distances.length-1&&leg.distances[i]<distance)i++;
      const t=(distance-leg.distances[i-1])/(leg.distances[i]-leg.distances[i-1]||1);
      const a=leg.points[i-1],b=leg.points[i];
      return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    };
    const headLeg=stream.legs.find(leg=>head>=leg.start&&head<leg.end);
    let glowing=false;
    for(const leg of stream.legs){
      if(!leg.route?.visible)continue;
      // A single tail can cross a route boundary. Its brightness is measured
      // from the same global head, so a handoff never spawns another pulse.
      for(const offset of [0,-stream.length]){
        const legStart=leg.start+offset,legEnd=leg.end+offset;
        const from=Math.max(head-stream.trail,legStart),to=Math.min(head,legEnd);
        if(to<=from)continue;
        const start=pointAt(leg,from-legStart),end=pointAt(leg,to-legStart);
        const alpha=value=>Math.pow(Math.max(0,(value-head+stream.trail)/stream.trail),1.5);
        const gradient=c.createLinearGradient(...start,...end);
        gradient.addColorStop(0,`rgba(0,185,242,${alpha(from)})`);
        gradient.addColorStop(1,`rgba(0,211,255,${alpha(to)})`);
        c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=gradient;
        c.beginPath();c.moveTo(...start);
        for(let i=1;i<leg.points.length;i++)if(leg.distances[i]>from-legStart&&leg.distances[i]<to-legStart)c.lineTo(...leg.points[i]);
        c.lineTo(...end);
        c.globalAlpha=leg.route.strength*.45;c.lineWidth=8*s.density;c.shadowColor='#00cfff';c.shadowBlur=17*s.density;c.stroke();
        c.globalAlpha=leg.route.strength;c.lineWidth=3*s.density;c.shadowBlur=9*s.density;c.stroke();
        const core=c.createLinearGradient(...start,...end);
        core.addColorStop(0,`rgba(224,255,255,${alpha(from)})`);core.addColorStop(1,`rgba(243,255,255,${alpha(to)})`);
        c.strokeStyle=core;c.lineWidth=1*s.density;c.shadowBlur=3*s.density;c.stroke();
        c.restore();glowing=true;
      }
    }
    if(headLeg?.route?.visible){
      const end=pointAt(headLeg,head-headLeg.start);
      c.save();c.globalAlpha=headLeg.route.strength;
      c.shadowBlur=14*s.density;c.shadowColor='#00cfff';c.fillStyle='#00cfff';c.beginPath();c.arc(...end,2.6*s.density,0,Math.PI*2);c.fill();
      c.shadowBlur=0;c.fillStyle='#f0ffff';c.beginPath();c.arc(...end,1.1*s.density,0,Math.PI*2);c.fill();c.restore();
    }
    const routeId=headLeg?.route?.id??'underboard';
    if(hero.dataset.circuitRoute!==routeId)hero.dataset.circuitRoute=routeId;
    const lightState=glowing?'on':'rest';
    if(hero.dataset.circuitLight!==lightState)hero.dataset.circuitLight=lightState;
  };
  const render=now=>{
    if(!allowed()){stop();return;}
    if(phase==='exploding'){
      const p=Math.min(1,(now-started)/5200);
      setState(p<.1?'charging':p<.4?'exploding':p<.58?'dispersed':'reassembling');
      const spread=p<.4?1-Math.pow(1-Math.max(0,(p-.1)/.3),3):p<.58?1:1-ease((p-.58)/.42);
      paintAssembly(spread);
      if(p>=1){played=true;phase='flowing';flowStarted=now;visual.classList.remove('is-exploding');scene.ctx.clearRect(0,0,scene.width,scene.height);setState('flowing');}
    }else if(now-lastFlowFrame>=16){lastFlowFrame=now;paintLights(now);}
    frame=requestAnimationFrame(render);
  };
  const sync=()=>{
    if(!allowed()){if(canvas||pending)stop();return;}
    if(failed||canvas||pending||!image.complete||!image.naturalWidth)return;
    pending=true;setState('waiting');const ticket=++generation;
    timer=setTimeout(async()=>{
      try{
        const assets=await new Promise((resolve,reject)=>{
          const deadline=setTimeout(()=>reject(new Error('Assembly asset deadline')),6500);
          loadAssets().then(value=>{clearTimeout(deadline);resolve(value);},error=>{clearTimeout(deadline);reject(error);});
        });
        if(ticket!==generation||!allowed())return;
        scene=buildScene(assets);pending=false;
        phase=played?'flowing':'exploding';started=performance.now();flowStarted=started;lastFlowFrame=0;
        if(!played)visual.classList.add('is-exploding');else setState('flowing');
        frame=requestAnimationFrame(render);
      }catch(_){if(ticket===generation){failed=true;stop();setState('unavailable');}}
    },played?0:850);
  };
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class']});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.15;sync();
  },{threshold:[0,.15]}).observe(hero);
  image.addEventListener('load',sync,{once:true});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  addEventListener('resize',()=>{stop();timer=setTimeout(sync,160);});
  sync();
})();
