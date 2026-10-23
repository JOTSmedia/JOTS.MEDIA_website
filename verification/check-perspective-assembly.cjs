'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assembly.js','utf8');
const assets={manifest:JSON.parse(fs.readFileSync('images/assembly/components.json')),circuits:JSON.parse(fs.readFileSync('images/assembly/circuit-paths.json')),atlas:{},board:{},physicalBoard:{},physicalAtlas:{},photo:{naturalWidth:1600,naturalHeight:900}};
const cases=[
 {width:1440,height:830,dpr:1},
 {width:1440,height:830,dpr:2},
 {width:768,height:830,dpr:2},
 {width:390,height:788,dpr:1},
 {width:390,height:788,dpr:3},
 {width:320,height:568,dpr:3}
];
const results=[];
const ease=p=>{const t=Math.max(0,Math.min(1,p));return t*t*t*(t*(t*6-15)+10);};
const amountAt=(part,spread)=>ease((spread-part.delay)/(1-part.delay));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const {width,height,dpr} of cases){
 let calls=0,clips=0,images=0;
 const finite=(method,args)=>{for(const x of args)if(typeof x==='number')assert(Number.isFinite(x),`${width}: ${method} non-finite`);calls++;};
 const context=()=>{const stack=[];return new Proxy({globalAlpha:1,globalCompositeOperation:'source-over',_draws:[]}, {get(t,k){if(k==='save')return()=>stack.push({globalAlpha:t.globalAlpha,globalCompositeOperation:t.globalCompositeOperation});if(k==='restore')return()=>Object.assign(t,stack.pop());if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient')return(...a)=>{finite(k,a);return{addColorStop:(...v)=>finite('addColorStop',v)}};return(...a)=>{finite(k,a);if(k==='clip')clips++;if(k==='drawImage'){images++;t._draws.push({image:a[0],alpha:t.globalAlpha,operation:t.globalCompositeOperation,args:a.slice(1)});}};},set(t,k,v){if(typeof v==='number')assert(Number.isFinite(v),`${width}: non-finite ${String(k)}`);t[k]=v;return true;}});};
 const element={dataset:{},classList:{contains:()=>false,add(){},remove(){}},getBoundingClientRect:()=>({width,height,top:56,bottom:height+56}),append(){},removeAttribute(){},addEventListener(){}};
 const hero={...element,dataset:{}},image={naturalWidth:1280,naturalHeight:720,complete:true,addEventListener(){}};
 const document={documentElement:element,hidden:false,querySelector:s=>s==='.hero'?hero:s==='.hero-bottom'?{getBoundingClientRect:()=>({bottom:height*.68+56})}:s==='.hero-foot'?{getBoundingClientRect:()=>({top:height*.94+56})}:element,getElementById:()=>image,addEventListener(){},createElement:()=>{const ctx=context();return{setAttribute(){},getContext:()=>ctx};}};
 const sandbox={document,window:{},devicePixelRatio:dpr,innerWidth:width,innerHeight:height,matchMedia:()=>({matches:false,addEventListener(){}}),getComputedStyle:()=>({objectPosition:width<700?'82% center':'50% center'}),MutationObserver:class{observe(){}},addEventListener(){},performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},requestAnimationFrame:()=>0,Image:class{},fetch(){throw Error('unexpected fetch')}};
 const observed=source.replace('const drawPlane=(c,texture,vertices,n,offsetX=0,offsetY=0)=>{','const drawPlane=(c,texture,vertices,n,offsetX=0,offsetY=0)=>{ globalThis.__planeRecords?.push({texture,vertices,offsetX,offsetY});');
 const injected=observed.replace(/  sync\(\);\n\}\)\(\);\s*$/,'  globalThis.__assemblyTest={buildScene,paintAssembly,projectPart,materialCycle,setScene:value=>{scene=value;}};\n})();');
 assert.notEqual(injected,source);vm.createContext(sandbox);vm.runInContext(injected,sandbox);const api=sandbox.__assemblyTest,s=api.buildScene(assets);api.setScene(s);
 assert.equal(s.parts.length,55);
 assert.notEqual(s.board,assets.board,'The exposed board must use the original photo, not the edited clean plate');
 const boardDraws=s.board.getContext('2d')._draws;assert.equal(boardDraws[0].image,assets.photo);assert.equal(boardDraws.at(-1).image,assets.board);assert.equal(boardDraws.at(-1).operation,'destination-over');
 for(const part of s.parts){
  assert.equal(part.solidTexture.width,part.texture.width);assert.equal(part.solidTexture.height,part.texture.height);
  const solid=part.solidTexture.getContext('2d')._draws[0];assert.equal(solid.image,assets.physicalAtlas);assert.deepEqual(solid.args.slice(0,4),Array.from(part.atlas),'Physical atlas crop differs from the white silhouette placement');
  const draws=part.texture.getContext('2d')._draws;assert.equal(draws[0].image,assets.photo,'White component RGB must come from the displayed image');assert.equal(draws[1].image,assets.atlas);assert.equal(draws[1].operation,'destination-in');
  const [sx,sy,sw,sh]=draws[0].args;
  assert(Math.abs(s.x+sx/assets.photo.naturalWidth*s.photoWidth-(part.px-part.w/2))<1e-8,'Component crop X does not register to its rest position');
  assert(Math.abs(s.y+sy/assets.photo.naturalHeight*s.photoHeight-(part.py-part.h/2))<1e-8,'Component crop Y does not register to its rest position');
  assert(Math.abs(sw/assets.photo.naturalWidth*s.photoWidth-part.w)<1e-8);assert(Math.abs(sh/assets.photo.naturalHeight*s.photoHeight-part.h)<1e-8);
 }assert.equal(s.parts.filter(p=>p.isProcessor).length,1);
 const processor=s.parts.find(p=>p.isProcessor);let maxFrameTriangles=0,maxRestError=0,maxMaterialOnlyMovement=0;
 // The canvas and CSS object-fit photograph must share their frame even at
 // a fractional canvas density. Test the fitted bitmap, not only its center.
 const position=width<700?.82:.5,cover=Math.max(width/image.naturalWidth,height/image.naturalHeight);
 const cssPhotoWidth=image.naturalWidth*cover*1.025,cssPhotoHeight=image.naturalHeight*cover*1.025;
 const cssX=(width-image.naturalWidth*cover)*position*1.025+width*(1-1.025)/2;
 const cssY=(height-cssPhotoHeight)/2;
 const cssScaleX=width/s.width,cssScaleY=height/s.height;
 const frameError=Math.max(Math.abs(s.x*cssScaleX-cssX),Math.abs(s.y*cssScaleY-cssY),Math.abs(s.photoWidth*cssScaleX-cssPhotoWidth),Math.abs(s.photoHeight*cssScaleY-cssPhotoHeight));
 assert(frameError<1e-8,`Canvas and CSS photo framing differ by ${frameError.toFixed(3)} CSS pixels at ${width}@${dpr}`);
 for(let step=0;step<=240;step++){
  const p=step/240,look=api.materialCycle(p),spread=look.spread;
  clips=0;s.ctx._draws=[];api.paintAssembly(spread,p,look);
  const handoffs=s.ctx._draws.filter(draw=>draw.image===s.layer);assert.equal(handoffs.length,1);
  const handoff=handoffs[0];
  const afterHandoff=s.ctx._draws.slice(s.ctx._draws.indexOf(handoff)+1);
  for(const overlay of afterHandoff){assert.equal(overlay.image,s.tubes,'Only the registered circuit may overlay the finished photo');assert.equal(spread,0,'Resting circuit overlay appears on displaced hardware');}
  if(spread>0)assert.equal(handoff.alpha,1,`A moving reconstruction dissolves over the final photo at ${p}`);
  maxFrameTriangles=Math.max(maxFrameTriangles,clips);
  for(const part of s.parts){
   // Use the actual eased, staggered displacement passed by paintAssembly.
   const v=api.projectPart(part,amountAt(part,spread),s.density,look.burst),n=part.subdivisions;
   assert.equal(v.length,(n+1)**2);
   for(const point of v)for(const value of [point.x,point.y,point.u,point.v])assert(Number.isFinite(value));
   for(let row=0;row<n;row++)for(let col=0;col<n;col++){
    const i=row*(n+1)+col,a=v[i],b=v[i+1],c=v[i+n+2];
    assert((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0,`Folded mesh at ${width}, part ${part.name}`);
   }
  }
 }
 const restLook=api.materialCycle(1);
 for(const part of s.parts){
  const rest=api.projectPart(part,amountAt(part,restLook.spread),s.density,restLook.burst);
  for(let row=0;row<=part.subdivisions;row++)for(let col=0;col<=part.subdivisions;col++){
   const p=rest[row*(part.subdivisions+1)+col];
   const expected={x:part.px+(col/part.subdivisions-.5)*part.w,y:part.py+(row/part.subdivisions-.5)*part.h};
   maxRestError=Math.max(maxRestError,distance(p,expected));
  }
  // Returning changes the material first, with every vertex still held at
  // its second-expansion position. Retraction begins only after this hold.
  for(const [from,to] of [[.225,.445],[.68,.84]]){
   const initial=api.materialCycle(from);
   const a=api.projectPart(part,amountAt(part,initial.spread),s.density,initial.burst);
   for(let step=1;step<=20;step++){
    const look=api.materialCycle(from+(to-from)*step/20);
    const b=api.projectPart(part,amountAt(part,look.spread),s.density,look.burst);
    for(let i=0;i<a.length;i++)maxMaterialOnlyMovement=Math.max(maxMaterialOnlyMovement,distance(a[i],b[i]));
   }
  }
 }
 for(const [from,to] of [[.225,.445],[.68,.84]]){
  const edgeTextures=new Set(s.parts.map(part=>part.edge).filter(Boolean));
  const recordAt=p=>{sandbox.__planeRecords=[];const look=api.materialCycle(p);api.paintAssembly(look.spread,p,look);return sandbox.__planeRecords.filter(record=>edgeTextures.has(record.texture));};
  const a=recordAt(from),b=recordAt(to);assert.equal(a.length,b.length);
  for(let i=0;i<a.length;i++){assert.equal(a[i].texture,b[i].texture);assert.equal(a[i].offsetX,b[i].offsetX,'Material phase changes sidewall X thickness');assert.equal(a[i].offsetY,b[i].offsetY,'Material phase changes sidewall Y thickness');}
  delete sandbox.__planeRecords;
 }
 assert(maxRestError<1e-8,`A component misses its registered final location by ${maxRestError}`);
 assert(maxMaterialOnlyMovement<1e-8,`Material-only return moves geometry by ${maxMaterialOnlyMovement.toFixed(3)} pixels`);
 const peak=api.projectPart(processor,1,s.density,1);
 const bounds={left:Math.min(...peak.map(p=>p.x))*cssScaleX,top:Math.min(...peak.map(p=>p.y))*cssScaleY,right:Math.max(...peak.map(p=>p.x))*cssScaleX,bottom:Math.max(...peak.map(p=>p.y))*cssScaleY};
 if(width<=700){assert(bounds.left>=0,'Mobile processor clips left');assert(bounds.right<=width+1,'Mobile processor clips right');assert(bounds.top>=height*.68+10,'Mobile processor intersects copy');assert(bounds.bottom<=height*.94,'Mobile processor intersects footer');}
 assert(maxFrameTriangles<=320,'Triangle budget unexpectedly grew');
 results.push({viewport:`${width}x${height}`,devicePixelRatio:dpr,frames:241,components:s.parts.length,maxFrameTriangles,finiteCanvasCalls:calls,drawCalls:images,frameErrorCSSPixels:frameError,maxRestError,maxMaterialOnlyMovement,processorPeakBounds:bounds});
}
fs.writeFileSync('verification/perspective-assembly-results.json',JSON.stringify({passed:true,results},null,2)+'\n');console.log(JSON.stringify({passed:true,results},null,2));
