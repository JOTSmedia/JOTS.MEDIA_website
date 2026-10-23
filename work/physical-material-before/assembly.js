'use strict';
// Photographed components lift as shallow, perspective-projected planes above a
// stationary board. Real alpha silhouettes keep the material and edges intact;
// the original photograph remains the fallback and the finished view.
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
  const resetMaterial=()=>{
    hero.removeAttribute('data-material-active');hero.removeAttribute('data-hero-phase');
    hero.removeAttribute('data-hero-material');
    for(const property of ['--hero-dark','--hero-material-ink','--hero-material-shadow','--hero-pane-rgb','--hero-transition-scrim'])hero.style?.removeProperty(property);
  };
  const stop=()=>{
    if(phase==='exploding')played=true;
    generation++;clearTimeout(timer);cancelAnimationFrame(frame);pending=false;
    canvas?.remove();canvas=null;scene=null;phase='paused';
    visual.classList.remove('is-exploding','has-circuit-animation');
    hero.removeAttribute('data-circuit-light');hero.removeAttribute('data-circuit-route');resetMaterial();setState('paused');
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
  const ease=p=>{const t=Math.max(0,Math.min(1,p));return t*t*t*(t*(t*6-15)+10);};
  const materialDuration=15500;
  const materialCycle=progress=>{
    const p=Math.max(0,Math.min(1,progress)),between=(from,to)=>ease((p-from)/(to-from));
    let spread=0,dark=0,solid=0,burst=0,chapter='white-launch',chip='charging';
    if(p<.065){}
    else if(p<.225){spread=.86*between(.065,.225);chip='exploding';}
    else if(p<.335){spread=.86-.04*between(.225,.335);dark=between(.225,.335);chapter='darkening';chip='dispersed';}
    else if(p<.445){const t=between(.335,.445);spread=.82-.58*t;dark=1;solid=t;chapter='solid';chip='reassembling';}
    else if(p<.60){const t=between(.445,.60);spread=.24+.76*t;dark=solid=1;burst=t;chapter='second-expansion';chip='exploding';}
    else if(p<.68){spread=dark=solid=burst=1;chapter='second-expansion';chip='dispersed';}
    else if(p<.84){const t=between(.68,.84);spread=1;dark=solid=1-t;burst=1-t;chapter='returning';chip='dispersed';}
    else{spread=1-between(.84,1);chapter='settling';chip='reassembling';}
    if(p===1){spread=dark=solid=burst=0;chapter='flowing';chip='flowing';}
    return {spread,dark,solid,burst,chapter,chip};
  };
  const applyMaterial=look=>{
    hero.dataset.materialActive='true';
    if(hero.dataset.heroPhase!==look.chapter)hero.dataset.heroPhase=look.chapter;
    const material=look.solid>.97?'solid':look.solid<.03?'glass':'transition';
    if(hero.dataset.heroMaterial!==material)hero.dataset.heroMaterial=material;
    // Ink stays on the high-contrast side of the scene. During the middle of
    // the fade, a local translucent scrim protects copy without covering art.
    const lightInk=look.dark>=.51;
    hero.style?.setProperty('--hero-dark',look.dark.toFixed(4));
    hero.style?.setProperty('--hero-material-ink',lightInk?'244 249 250':'17 22 21');
    hero.style?.setProperty('--hero-material-shadow',lightInk?'0 6 10':'255 255 255');
    hero.style?.setProperty('--hero-pane-rgb',lightInk?'4 10 15':'255 255 255');
    hero.style?.setProperty('--hero-transition-scrim',(Math.sin(look.dark*Math.PI)*.58).toFixed(4));
  };
  // Relight source photography once into etched graphite and metal. This
  // preserves every photographed groove and contact; no black rectangle is
  // painted over a white board and no per-frame pixel processing is needed.
  const materialTexture=(source,width,height,board=false)=>{
    const texture=document.createElement('canvas');texture.width=width;texture.height=height;
    const g=texture.getContext('2d');if(!g)throw new Error('Material texture unavailable');
    g.drawImage(source,0,0,width,height);
    try{
      const pixels=g.getImageData(0,0,width,height);
      if(!pixels?.data)throw new Error('Pixel material unavailable');
      for(let i=0;i<pixels.data.length;i+=4){
        const r=pixels.data[i],gr=pixels.data[i+1],b=pixels.data[i+2];
        const luminance=(r*.2126+gr*.7152+b*.0722)/255;
        if(board){
          const relief=Math.pow(Math.max(0,1-luminance),.72),cyan=Math.max(0,b-r)*.12;
          pixels.data[i]=5+relief*76;pixels.data[i+1]=9+relief*89+cyan;pixels.data[i+2]=13+relief*103+cyan;
        }else{
          const warm=Math.max(0,Math.min(1,(r-b-5)/22));
          const base=19+Math.pow(luminance,2.2)*85;
          pixels.data[i]=base*.83*(1-warm)+r*.82*warm;
          pixels.data[i+1]=base*.96*(1-warm)+gr*.85*warm;
          pixels.data[i+2]=base*1.10*(1-warm)+b*.90*warm;
        }
      }
      g.putImageData(pixels,0,0);
    }catch(_){
      // Restricted canvas environments still get a source-shaped dark grade.
      g.globalCompositeOperation='source-atop';g.fillStyle=board?'rgba(4,10,16,.91)':'rgba(15,27,38,.71)';g.fillRect(0,0,width,height);g.globalCompositeOperation='source-over';
    }
    return texture;
  };
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
    const phone=box.width<=700;
    // Fit the hero's signature piece between the actual copy and footer on
    // phones. Its safe area follows font wrapping instead of guessing a device.
    const copyBox=phone?document.querySelector('.hero-bottom')?.getBoundingClientRect():null;
    const footBox=phone?document.querySelector('.hero-foot')?.getBoundingClientRect():null;
    const phoneTop=copyBox&&Number.isFinite(copyBox.bottom)?Math.min(height*.86,Math.max(height*.56,(copyBox.bottom-(box.top||0))*density+16*density)):height*.69;
    const phoneBottom=footBox&&Number.isFinite(footBox.top)?Math.min(height-12*density,(footBox.top-(box.top||0))*density-12*density):height*.94;
    const phoneGap=Math.max(64*density,phoneBottom-phoneTop);
    const phoneCenter=Math.min(height-phoneGap*.5-14*density,phoneTop+phoneGap*.5);
    const parts=assets.manifest.parts.map((part,index)=>{
      const [sx,sy,sw,sh]=part.source,[px,py]=project(sx+sw/2,sy+sh/2);
      const w=sw/assets.manifest.sourceWidth*photoWidth,h=sh/assets.manifest.sourceHeight*photoHeight;
      const seed=(index*7%19)/18,main=index===0;
      // The phone camera brings the whole processor into the lower visual gap;
      // the desktop keeps its more expansive exploded-view composition.
      const peakScale=main&&phone?Math.min(.78,width*.70/w,phoneGap*.92/h):1.035;
      const tier=main?0:part.area>3500?1:2;
      // Cache cutouts once. Rendering never clips a piece with an invented mask,
      // and neighboring pixels in the packed atlas cannot bleed into the mesh.
      const texture=document.createElement('canvas');texture.width=part.atlas[2];texture.height=part.atlas[3];
      const textureCtx=texture.getContext('2d');
      if(!textureCtx)throw new Error('Component texture unavailable');
      textureCtx.drawImage(assets.atlas,...part.atlas,0,0,texture.width,texture.height);
      const solidTexture=materialTexture(texture,texture.width,texture.height);
      if(main){
        const g=solidTexture.getContext('2d');
        // The four corners are traced from the existing photographed die.
        // Its pins and outer alpha silhouette remain source photography.
        const face=[[217,52],[373,158],[230,266],[71,154]];
        g.save();g.beginPath();g.moveTo(...face[0]);for(let i=1;i<face.length;i++)g.lineTo(...face[i]);g.closePath();g.clip();
        const silicon=g.createLinearGradient(135,60,315,260);
        silicon.addColorStop(0,'rgba(20,30,40,.91)');silicon.addColorStop(.45,'rgba(48,60,72,.88)');silicon.addColorStop(.6,'rgba(20,29,40,.92)');silicon.addColorStop(1,'rgba(6,13,22,.96)');
        g.fillStyle=silicon;g.fillRect(0,0,solidTexture.width,solidTexture.height);
        // A fine polished edge follows the same real die boundary.
        g.strokeStyle='rgba(182,214,225,.40)';g.lineWidth=1.1;g.stroke();g.restore();
      }
      let edge=null,shadow=null;
      if(main||part.area>1500){
        edge=document.createElement('canvas');edge.width=texture.width;edge.height=texture.height;
        const edgeCtx=edge.getContext('2d');
        if(edgeCtx){edgeCtx.drawImage(texture,0,0);edgeCtx.globalCompositeOperation='source-in';edgeCtx.fillStyle=main?'#375059':'#495b60';edgeCtx.fillRect(0,0,edge.width,edge.height);}
        else edge=null;
        const padding=main?24:12;
        shadow=document.createElement('canvas');shadow.width=texture.width+padding*2;shadow.height=texture.height+padding*2;
        const shadowCtx=shadow.getContext('2d');
        if(shadowCtx){
          shadowCtx.filter=`blur(${main?10:5}px)`;shadowCtx.drawImage(texture,padding,padding);
          shadowCtx.filter='none';shadowCtx.globalCompositeOperation='source-in';shadowCtx.fillStyle='rgba(18,51,60,.34)';shadowCtx.fillRect(0,0,shadow.width,shadow.height);
        }else shadow=null;
      }
      return {...part,px,py,w,h,seed,isProcessor:main,tier,texture,solidTexture,edge,shadow,
        phone,subdivisions:main?(phone?2:3):1,
        focal:Math.max(width*1.35,w*3.6),
        peakScale:main&&!phone?1.075:peakScale,
        dx:main?(phone?width*.60-px:-photoWidth*.006):((sx+sw/2)/1672-.82)*photoWidth*.14+(seed-.5)*width*.018,
        lift:main?(phone?py-phoneCenter:Math.min(height*.26,photoWidth*.13)):
          tier===1?Math.min(height*.21,(56+seed*35)*density+w*.28):Math.min(height*.13,(24+seed*43)*density+w*.2),
        tiltX:main?(phone?.23:.29):(seed-.32)*(tier===1?.35:.5),
        tiltY:main?(phone?-.12:-.19):(.5-seed)*(tier===1?.42:.52),
        rotation:main?-.025:(seed-.5)*.16,delay:main?0:tier*.065+seed*.035};
    }).sort((a,b)=>b.tier-a.tier||a.py-b.py);
    const boardTextureWidth=Math.min(1200,assets.board.naturalWidth||assets.manifest.sourceWidth);
    const darkBoard=materialTexture(assets.board,boardTextureWidth,Math.round(boardTextureWidth*assets.manifest.sourceHeight/assets.manifest.sourceWidth),true);
    const darkLayer=document.createElement('canvas');darkLayer.width=width;darkLayer.height=height;
    const darkCtx=darkLayer.getContext('2d');if(!darkCtx)throw new Error('Board material unavailable');
    darkCtx.drawImage(darkBoard,x,y,photoWidth,photoHeight);
    // Static, broad studio-light falloff lets the etched metal catch light.
    const environment=darkCtx.createRadialGradient(width*.79,height*.46,0,width*.79,height*.46,width*.70);
    environment.addColorStop(0,'rgba(67,94,112,.12)');environment.addColorStop(1,'rgba(0,0,0,.38)');darkCtx.fillStyle=environment;darkCtx.fillRect(0,0,width,height);
    // The reflection is clipped by the processor's actual alpha silhouette.
    const processor=assets.manifest.parts[0];
    const specular=document.createElement('canvas');
    specular.width=processor.atlas[2];specular.height=processor.atlas[3];
    const specularCtx=specular.getContext('2d');
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
    const stream={legs:[],length:0,speed:4000*sourceScale,trail:360*sourceScale};
    const addLeg=(points,route=null)=>{
      const distances=[0];
      for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
      // Hidden handoffs are brief: the luminous tail remains on the previous
      // groove until its one head emerges onto the next photographed channel.
      const length=route?distances.at(-1):Math.min(distances.at(-1),64*sourceScale);
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
        tubeCtx.globalAlpha=strength*.65;
        tubeCtx.beginPath();tubeCtx.moveTo(...points[0]);
        for(let i=1;i<points.length;i++)tubeCtx.lineTo(...points[i]);
        tubeCtx.strokeStyle='rgba(0,180,223,.10)';tubeCtx.lineWidth=5*density;
        tubeCtx.shadowColor='rgba(0,195,245,.35)';tubeCtx.shadowBlur=7*density;tubeCtx.stroke();
        tubeCtx.shadowBlur=0;tubeCtx.strokeStyle='rgba(0,139,197,.24)';tubeCtx.lineWidth=1.6*density;tubeCtx.stroke();
        tubeCtx.strokeStyle='rgba(209,253,255,.55)';tubeCtx.lineWidth=.6*density;tubeCtx.stroke();
      }
    }
    visual.append(canvas);visual.classList.add('has-circuit-animation');
    return {ctx,layer,layerCtx,tubes,darkLayer,specular,specularCtx,processor,width,height,density,photoWidth,photoHeight,x,y,parts,paths,stream,...assets};
  };
  // Canvas 2D has no projective drawImage. A small, fixed triangle mesh maps
  // the original alpha texture onto a real X/Y/Z-rotated plane. The large
  // processor uses 18 triangles (8 on phones); tiny components use only two.
  const projectPart=(part,amount,density,burst=0)=>{
    const swing=Math.sin(amount*Math.PI),main=part.isProcessor;
    // The second expansion has more spatial depth. The phone processor retains
    // its measured safe envelope while smaller satellites peel farther away.
    const spreadBoost=1+burst*(main?(part.phone?0:.06):.24);
    const scale=1+amount*(part.peakScale-1);
    const cx=part.px+part.dx*amount*spreadBoost+swing*(part.seed-.5)*10*density;
    const cy=part.py-part.lift*amount*spreadBoost;
    const tiltBoost=1+burst*(part.phone?.12:.28);
    const pitch=part.tiltX*amount*tiltBoost,yaw=part.tiltY*amount*tiltBoost,roll=part.rotation*amount*tiltBoost;
    const cp=Math.cos(pitch),sp=Math.sin(pitch),cyaw=Math.cos(yaw),syaw=Math.sin(yaw),cr=Math.cos(roll),sr=Math.sin(roll);
    const vertices=[],n=part.subdivisions;
    for(let row=0;row<=n;row++)for(let col=0;col<=n;col++){
      const u=col/n,v=row/n,lx=(u-.5)*part.w*scale,ly=(v-.5)*part.h*scale;
      const pitchedY=ly*cp,pitchedZ=ly*sp;
      const rx=lx*cyaw+pitchedZ*syaw,rz=-lx*syaw+pitchedZ*cyaw;
      const perspective=part.focal/(part.focal-rz);
      vertices.push({u:u*part.texture.width,v:v*part.texture.height,
        x:cx+(rx*cr-pitchedY*sr)*perspective,y:cy+(rx*sr+pitchedY*cr)*perspective});
    }
    return vertices;
  };
  const drawPlane=(c,texture,vertices,n,offsetX=0,offsetY=0)=>{
    const triangle=(a,b,d)=>{
      const denominator=a.u*(b.v-d.v)+b.u*(d.v-a.v)+d.u*(a.v-b.v);
      if(Math.abs(denominator)<.001)return;
      const ax=a.x+offsetX,ay=a.y+offsetY,bx=b.x+offsetX,by=b.y+offsetY,dx=d.x+offsetX,dy=d.y+offsetY;
      const xx=(ax*(b.v-d.v)+bx*(d.v-a.v)+dx*(a.v-b.v))/denominator;
      const yx=(ay*(b.v-d.v)+by*(d.v-a.v)+dy*(a.v-b.v))/denominator;
      const xy=(ax*(d.u-b.u)+bx*(a.u-d.u)+dx*(b.u-a.u))/denominator;
      const yy=(ay*(d.u-b.u)+by*(a.u-d.u)+dy*(b.u-a.u))/denominator;
      const tx=(ax*(b.u*d.v-d.u*b.v)+bx*(d.u*a.v-a.u*d.v)+dx*(a.u*b.v-b.u*a.v))/denominator;
      const ty=(ay*(b.u*d.v-d.u*b.v)+by*(d.u*a.v-a.u*d.v)+dy*(a.u*b.v-b.u*a.v))/denominator;
      // A subpixel overlap prevents antialias seams between neighboring faces.
      const centerX=(ax+bx+dx)/3,centerY=(ay+by+dy)/3;
      const expanded=(x,y)=>{const length=Math.hypot(x-centerX,y-centerY)||1;return[x+(x-centerX)/length*.32,y+(y-centerY)/length*.32];};
      c.save();c.beginPath();c.moveTo(...expanded(ax,ay));c.lineTo(...expanded(bx,by));c.lineTo(...expanded(dx,dy));c.closePath();c.clip();
      c.transform(xx,yx,xy,yy,tx,ty);c.drawImage(texture,0,0);c.restore();
    };
    for(let row=0;row<n;row++)for(let col=0;col<n;col++){
      const index=row*(n+1)+col,a=vertices[index],b=vertices[index+1],d=vertices[index+n+1],e=vertices[index+n+2];
      triangle(a,b,e);triangle(a,e,d);
    }
  };
  const paintAssembly=(spread,progress=0,look={dark:0,solid:0,burst:0})=>{
    const s=scene,c=s.layerCtx;
    c.clearRect(0,0,s.width,s.height);c.drawImage(s.board,s.x,s.y,s.photoWidth,s.photoHeight);
    if(look.dark>0){c.save();c.globalAlpha=look.dark;c.drawImage(s.darkLayer,0,0);c.restore();}
    const charge=progress<.09?Math.sin(Math.min(1,progress/.09)*Math.PI):0;
    if(charge>0){c.save();c.globalAlpha=charge*.45;c.drawImage(s.tubes,0,0);c.restore();}
    const processor=s.parts.find(part=>part.isProcessor);
    if(s.specularCtx){
      const g=s.specularCtx,w=s.specular.width,h=s.specular.height;
      g.clearRect(0,0,w,h);g.drawImage(processor.texture,0,0);
      if(look.solid>0){g.save();g.globalAlpha=look.solid;g.drawImage(processor.solidTexture,0,0);g.restore();}
      const sweep=progress<.445?(progress-.06)/.36:(progress-.45)/.37;
      const travel=(-1+sweep*3)*w,reflection=g.createLinearGradient(travel,0,travel+w*.85,h*.4);
      reflection.addColorStop(0,'rgba(230,255,255,0)');reflection.addColorStop(.37,'rgba(220,254,255,0)');
      reflection.addColorStop(.49,`rgba(255,255,255,${Math.min(1,spread+.18)*(.5+look.solid*.2)})`);
      reflection.addColorStop(.55,`rgba(123,239,255,${spread*(.23+look.solid*.14)})`);
      reflection.addColorStop(.68,'rgba(230,255,255,0)');reflection.addColorStop(1,'rgba(230,255,255,0)');
      g.globalCompositeOperation='source-atop';g.fillStyle=reflection;g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';
    }
    for(const part of s.parts){
      const amount=ease((spread-part.delay)/(1-part.delay));
      if(amount===0||!part.shadow)continue;
      const extra=1+amount*.20,sw=part.w*extra,sh=part.h*extra;
      c.save();c.globalAlpha=amount*(part.isProcessor?.68:.5)*(1-look.dark*.55);
      c.drawImage(part.shadow,part.px-sw/2+part.dx*amount*.12+amount*5*s.density,part.py-sh/2+amount*11*s.density,sw,sh);c.restore();
    }
    for(const part of s.parts){
      const amount=ease((spread-part.delay)/(1-part.delay));
      if(amount<.001){
        c.drawImage(part.texture,part.px-part.w/2,part.py-part.h/2,part.w,part.h);
        if(look.solid>0){c.save();c.globalAlpha=look.solid;c.drawImage(part.solidTexture,part.px-part.w/2,part.py-part.h/2,part.w,part.h);c.restore();}continue;
      }
      const vertices=projectPart(part,amount,s.density,look.burst);
      if(part.edge){
        const thickness=amount*(part.isProcessor?4.2+look.solid*3.8:1.7+look.solid*1.5)*s.density;
        c.save();c.globalAlpha=part.isProcessor?.82:.68;drawPlane(c,part.edge,vertices,part.subdivisions,thickness*.28,thickness);c.restore();
      }
      if(part.isProcessor&&s.specularCtx)drawPlane(c,s.specular,vertices,part.subdivisions);
      else{
        // A material transition changes surface reflectance, not geometry.
        if(look.solid<.999)drawPlane(c,part.texture,vertices,part.subdivisions);
        if(look.solid>.001){c.save();c.globalAlpha=look.solid;drawPlane(c,part.solidTexture,vertices,part.subdivisions);c.restore();}
      }
    }
    s.ctx.clearRect(0,0,s.width,s.height);s.ctx.drawImage(image,s.x,s.y,s.photoWidth,s.photoHeight);
    s.ctx.save();s.ctx.globalAlpha=Math.min(1,spread*8+charge*.22+look.dark);s.ctx.drawImage(s.layer,0,0);s.ctx.restore();
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
        c.globalAlpha=leg.route.strength*.38;c.lineWidth=12*s.density;c.shadowColor='#00cfff';c.shadowBlur=24*s.density;c.stroke();
        c.globalAlpha=leg.route.strength;c.lineWidth=3.8*s.density;c.shadowBlur=13*s.density;c.stroke();
        const core=c.createLinearGradient(...start,...end);
        core.addColorStop(0,`rgba(224,255,255,${alpha(from)})`);core.addColorStop(1,`rgba(243,255,255,${alpha(to)})`);
        c.strokeStyle=core;c.lineWidth=1.2*s.density;c.shadowBlur=4*s.density;c.stroke();
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
    if(now-lastFlowFrame<16){frame=requestAnimationFrame(render);return;}
    lastFlowFrame=now;
    if(phase==='exploding'){
      const p=Math.min(1,(now-started)/materialDuration),look=materialCycle(p);
      setState(look.chip);applyMaterial(look);paintAssembly(look.spread,p,look);
      if(p>=1){played=true;phase='flowing';flowStarted=now;visual.classList.remove('is-exploding');scene.ctx.clearRect(0,0,scene.width,scene.height);resetMaterial();hero.dataset.heroPhase='flowing';setState('flowing');}
    }else paintLights(now);
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
        if(!played)visual.classList.add('is-exploding');else{setState('flowing');hero.dataset.heroPhase='flowing';}
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
