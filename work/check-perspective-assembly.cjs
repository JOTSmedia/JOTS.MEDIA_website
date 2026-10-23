'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assembly.js','utf8');
const assets={manifest:JSON.parse(fs.readFileSync('images/assembly/components.json')),circuits:JSON.parse(fs.readFileSync('images/assembly/circuit-paths.json')),atlas:{},board:{}};
const results=[];
for(const [width,height] of [[1440,830],[390,788],[320,568]]){
 let calls=0,clips=0,images=0;
 const finite=(method,args)=>{for(const x of args)if(typeof x==='number')assert(Number.isFinite(x),`${width}: ${method} non-finite`);calls++;};
 const context=()=>new Proxy({}, {get(t,k){if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient')return(...a)=>{finite(k,a);return{addColorStop:(...v)=>finite('addColorStop',v)}};return(...a)=>{finite(k,a);if(k==='clip')clips++;if(k==='drawImage')images++;};},set(t,k,v){if(typeof v==='number')assert(Number.isFinite(v),`${width}: non-finite ${String(k)}`);t[k]=v;return true;}});
 const element={dataset:{},classList:{contains:()=>false,add(){},remove(){}},getBoundingClientRect:()=>({width,height,top:56,bottom:height+56}),append(){},removeAttribute(){},addEventListener(){}};
 const hero={...element,dataset:{}},image={naturalWidth:3840,naturalHeight:2160,complete:true,addEventListener(){}};
 const document={documentElement:element,hidden:false,querySelector:s=>s==='.hero'?hero:s==='.hero-bottom'?{getBoundingClientRect:()=>({bottom:height*.68+56})}:s==='.hero-foot'?{getBoundingClientRect:()=>({top:height*.94+56})}:element,getElementById:()=>image,addEventListener(){},createElement:()=>({setAttribute(){},getContext:context})};
 const sandbox={document,window:{},devicePixelRatio:1,innerWidth:width,innerHeight:height,matchMedia:()=>({matches:false,addEventListener(){}}),getComputedStyle:()=>({objectPosition:width<700?'82% center':'50% center'}),MutationObserver:class{observe(){}},addEventListener(){},performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},requestAnimationFrame:()=>0,Image:class{},fetch(){throw Error('unexpected fetch')}};
 const injected=source.replace(/  sync\(\);\n\}\)\(\);\s*$/,'  globalThis.__assemblyTest={buildScene,paintAssembly,projectPart,materialCycle,setScene:value=>{scene=value;}};\n})();');
 assert.notEqual(injected,source);vm.createContext(sandbox);vm.runInContext(injected,sandbox);const api=sandbox.__assemblyTest,s=api.buildScene(assets);api.setScene(s);
 assert.equal(s.parts.length,55);assert.equal(s.parts.filter(p=>p.isProcessor).length,1);
 const processor=s.parts.find(p=>p.isProcessor);let maxFrameTriangles=0;
 for(let step=0;step<=240;step++){
  const p=step/240,look=api.materialCycle(p),spread=look.spread;
  clips=0;api.paintAssembly(spread,p,look);maxFrameTriangles=Math.max(maxFrameTriangles,clips);
  for(const part of s.parts){
   const v=api.projectPart(part,spread,s.density,look.burst),n=part.subdivisions;
   assert.equal(v.length,(n+1)**2);
   for(const point of v)for(const value of [point.x,point.y,point.u,point.v])assert(Number.isFinite(value));
   // Every projected cell retains its orientation: no inverted planes or folds.
   for(let row=0;row<n;row++)for(let col=0;col<n;col++){
    const i=row*(n+1)+col,a=v[i],b=v[i+1],c=v[i+n+2];
    assert((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0,`Folded mesh at ${width}, part ${part.name}`);
   }
  }
 }
 const rest=api.projectPart(processor,0,s.density),peak=api.projectPart(processor,1,s.density,1);
 assert(Math.abs(rest[0].x-(processor.px-processor.w/2))<.0001);
 assert(Math.abs(rest[0].y-(processor.py-processor.h/2))<.0001);
 const bounds={left:Math.min(...peak.map(p=>p.x)),top:Math.min(...peak.map(p=>p.y)),right:Math.max(...peak.map(p=>p.x)),bottom:Math.max(...peak.map(p=>p.y))};
 if(width<=700){assert(bounds.left>=0,'Mobile processor clips left');assert(bounds.right<=width+1,'Mobile processor clips right');assert(bounds.top>=height*.68+10,'Mobile processor intersects copy');assert(bounds.bottom<=height*.94,'Mobile processor intersects footer');}
 assert(maxFrameTriangles<=320,'Triangle budget unexpectedly grew');
 results.push({viewport:`${width}x${height}`,frames:241,components:s.parts.length,maxFrameTriangles,finiteCanvasCalls:calls,drawCalls:images,processorPeakBounds:bounds});
}
fs.writeFileSync('work/perspective-assembly-results.json',JSON.stringify({passed:true,results},null,2)+'\n');console.log(JSON.stringify({passed:true,results},null,2));
