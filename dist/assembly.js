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
    hero.removeAttribute('data-circuit-light');setState('paused');
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
      // The phone has its own camera composition: the lifted processor comes
      // fully into view above the copy instead of remaining cropped at the edge.
      const peakScale=main&&phone?Math.min(1,width*.74/w):1.035;
      return {...part,px,py,w,h,seed,
        peakScale,
        dx:main?(phone?width*.60-px:photoWidth*.012):((sx+sw/2)/1672-.82)*photoWidth*.18+(seed-.5)*width*.035,
        lift:main?Math.min(height*(phone?.34:.24),photoWidth*(phone?.20:.12)):Math.min(height*.16,(28+seed*60)*density+w*.25),
        rotation:main?-.025:(seed-.5)*.16,delay:main?0:seed*.16};
    }).sort((a,b)=>a.py-b.py);
    // Recorded groove pixels, resampled at equal distance for steady light speed.
    // Use the same projection as the image, including its mobile crop and scale.
    const paths=assets.circuits.routes.map(points=>{
      const lengths=[0];
      for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
      const total=lengths.at(-1);let segment=1;
      return Array.from({length:121},(_,i)=>{
        const distance=total*i/120;
        while(segment<lengths.length-1&&lengths[segment]<distance)segment++;
        const t=(distance-lengths[segment-1])/(lengths[segment]-lengths[segment-1]||1);
        const a=points[segment-1],b=points[segment];
        return project(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);
      });
    });
    visual.append(canvas);visual.classList.add('has-circuit-animation');
    return {ctx,layer,layerCtx,width,height,density,photoWidth,photoHeight,x,y,parts,paths,...assets};
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
    const s=scene,c=s.ctx;c.clearRect(0,0,s.width,s.height);
    const elapsed=(now-flowStarted)/1000;
    let glowing=false;
    s.paths.forEach((points,index)=>{
      const time=elapsed-index*1.3;
      if(time<0)return;
      const p=(time%10)/6;
      if(p>=1)return;
      const head=p*120,tail=Math.max(0,head-13);
      const fade=Math.min(1,p*9,(1-p)*9);
      const at=value=>{const i=Math.floor(value),t=value-i,a=points[i],b=points[Math.min(120,i+1)];return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];};
      const start=at(tail),end=at(head),gradient=c.createLinearGradient(...start,...end);
      gradient.addColorStop(0,'rgba(0,194,212,0)');gradient.addColorStop(1,'rgba(0,159,178,.85)');
      c.save();c.globalAlpha=fade;c.strokeStyle=gradient;c.lineWidth=2*s.density;c.lineCap='round';
      c.shadowColor='#00c2d4';c.shadowBlur=8*s.density;c.beginPath();c.moveTo(...start);
      for(let i=Math.ceil(tail);i<=head;i++)c.lineTo(...points[i]);c.lineTo(...end);c.stroke();
      c.shadowBlur=10*s.density;c.fillStyle='#00aab9';c.beginPath();c.arc(...end,2.2*s.density,0,Math.PI*2);c.fill();
      c.shadowBlur=0;c.fillStyle='#f0ffff';c.beginPath();c.arc(...end,.85*s.density,0,Math.PI*2);c.fill();c.restore();glowing=true;
    });
    hero.dataset.circuitLight=glowing?'on':'rest';
  };
  const render=now=>{
    if(!allowed()){stop();return;}
    if(phase==='exploding'){
      const p=Math.min(1,(now-started)/5200);
      setState(p<.1?'charging':p<.4?'exploding':p<.58?'dispersed':'reassembling');
      const spread=p<.4?1-Math.pow(1-Math.max(0,(p-.1)/.3),3):p<.58?1:1-ease((p-.58)/.42);
      paintAssembly(spread);
      if(p>=1){played=true;phase='flowing';flowStarted=now;visual.classList.remove('is-exploding');scene.ctx.clearRect(0,0,scene.width,scene.height);setState('flowing');}
    }else if(now-lastFlowFrame>=33){lastFlowFrame=now;paintLights(now);}
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
