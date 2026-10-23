'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('assembly.js','utf8');
const assets={manifest:JSON.parse(fs.readFileSync('images/assembly/components.json')),circuits:JSON.parse(fs.readFileSync('images/assembly/circuit-paths.json')),atlas:{},board:{}};
assert.equal(assets.circuits.routes.length,47);
const results=[];
for(const [width,height] of [[1440,830],[390,788]]){
 let arcs=[],strokes=0,callCount=0;
 const finite=(method,args)=>{for(const x of args)if(typeof x==='number')assert(Number.isFinite(x),`${width}: ${method} received non-finite ${x}`);callCount++;};
 const context=()=>new Proxy({}, {get(t,k){if(k in t)return t[k];if(k==='createLinearGradient'||k==='createRadialGradient')return (...a)=>{finite(k,a);return{addColorStop:(...v)=>finite('addColorStop',v)}};return (...a)=>{finite(k,a);if(k==='arc')arcs.push(a);if(k==='stroke')strokes++;};},set(t,k,v){if(typeof v==='number')assert(Number.isFinite(v),`${width}: non-finite ${String(k)}`);t[k]=v;return true;}});
 const element={dataset:{},classList:{contains:()=>false,add(){},remove(){}},getBoundingClientRect:()=>({width,height,bottom:height}),append(){},removeAttribute(){},addEventListener(){}};
 const hero={...element,dataset:{}};
 const image={naturalWidth:3840,naturalHeight:2160,complete:true,addEventListener(){}};
 const document={documentElement:element,hidden:false,querySelector:s=>s==='.hero'?hero:element,getElementById:()=>image,addEventListener(){},createElement:()=>({setAttribute(){},getContext:context})};
 const sandbox={document,window:{},devicePixelRatio:1,innerWidth:width,innerHeight:height,matchMedia:()=>({matches:false,addEventListener(){}}),getComputedStyle:()=>({objectPosition:width<700?'82% center':'50% center'}),MutationObserver:class{observe(){}},addEventListener(){},performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},requestAnimationFrame:()=>0,Image:class{},fetch(){throw Error('Unexpected fetch in pure renderer harness')}};
 const injected=source.replace(/  sync\(\);\n\}\)\(\);\s*$/,'  globalThis.__streamTest={buildScene,paintLights,setScene:(value,start=0)=>{scene=value;flowStarted=start;}};\n})();');
 assert.notEqual(injected,source,'Private hook injection failed');
 vm.createContext(sandbox);vm.runInContext(injected,sandbox,{filename:'assembly.js'});
 const api=sandbox.__streamTest,s=api.buildScene(assets);api.setScene(s);
 assert.equal(s.stream.legs.filter(l=>l.route).length,47);
 assert.equal(new Set(s.stream.legs.filter(l=>l.route).map(l=>l.route.id)).size,47);
 assert(s.stream.length>0&&s.stream.speed>0&&s.stream.trail>0);
 const cycle=s.stream.length/s.stream.speed*1000;
 const visited=new Set();let visibleFrames=0,hiddenFrames=0,wrapTailFrames=0,maxArcs=0,maxTailSpans=0;
 const times=[];for(let t=0;t<=Math.ceil(cycle);t++)times.push(t);
 // Exact bounds catch handoffs and zero phase, plus the beginning of loop 2.
 for(const leg of s.stream.legs)for(const d of [0,.0001,leg.length/2,Math.max(0,leg.length-.0001)])times.push((leg.start+d)/s.stream.speed*1000);
 times.push(cycle,cycle+.1,cycle+1,2*cycle);
 for(const now of times){
  arcs=[];strokes=0;api.paintLights(now);
  const head=((now)/1000*s.stream.speed)%s.stream.length;
  const headLeg=s.stream.legs.find(l=>head>=l.start&&head<l.end);
  if(headLeg?.route)visited.add(headLeg.route.id);
  assert.equal(hero.dataset.circuitRoute,headLeg?.route?.id??'underboard');
  assert(arcs.length===0||arcs.length===2,`More than one glowing head: ${arcs.length} arcs at ${now}`);
  assert.equal(arcs.length,headLeg?.route?.visible?2:0);
  maxArcs=Math.max(maxArcs,arcs.length);
  if(arcs.length){assert.deepEqual(arcs[0].slice(0,2),arcs[1].slice(0,2),'Glow and core head positions differ');visibleFrames++;}else hiddenFrames++;
  let expectedSpans=0,wrapped=false;
  for(const leg of s.stream.legs){if(!leg.route?.visible)continue;for(const offset of [0,-s.stream.length]){
   const from=Math.max(head-s.stream.trail,leg.start+offset),to=Math.min(head,leg.end+offset);
   if(to>from){expectedSpans++;if(offset<0)wrapped=true;}
  }}
  assert.equal(strokes,expectedSpans*3,`${width}: tail paints extra or missing spans at ${now}`);
  maxTailSpans=Math.max(maxTailSpans,expectedSpans);if(wrapped)wrapTailFrames++;
  assert.equal(hero.dataset.circuitLight,expectedSpans?'on':'rest');
 }
 assert.equal(visited.size,47,'The single clock did not visit every route');
 assert(wrapTailFrames>0,'Tail failed to wrap across the circuit seam');
 assert.equal(maxArcs,2);
 results.push({viewport:`${width}x${height}`,routeCount:visited.size,cycleMs:+cycle.toFixed(3),sampleCount:times.length,maxHeadArcs:maxArcs,visibleFrames,hiddenFrames,wrapTailFrames,maxTailSpans,finiteCanvasCalls:callCount});
}
fs.writeFileSync('work/single-circuit-stream-results.json',JSON.stringify({passed:true,results},null,2)+'\n');
console.log(JSON.stringify({passed:true,results},null,2));
