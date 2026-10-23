'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('assembly.js','utf8');
const assets={manifest:JSON.parse(fs.readFileSync('images/assembly/components.json')),circuits:JSON.parse(fs.readFileSync('images/assembly/circuit-paths.json')),atlas:{},board:{},physicalBoard:{},physicalAtlas:{},photo:{naturalWidth:1600,naturalHeight:900}};
assert.equal(assets.circuits.routes.length,47);
const results=[];
for(const [width,height] of [[1440,830],[390,788]]){
 let arcs=[],strokes=0,callCount=0,events=[];
 const finite=(method,args)=>{for(const x of args)if(typeof x==='number')assert(Number.isFinite(x),`${width}: ${method} received non-finite ${x}`);callCount++;};
 const context=()=>{const stack=[];return new Proxy({globalAlpha:1}, {get(t,k){
  if(k==='save')return()=>stack.push({...t});
  if(k==='restore')return()=>{const previous=stack.pop();for(const key of Object.keys(t))delete t[key];Object.assign(t,previous);};
  if(k in t)return t[k];
  if(k==='createLinearGradient'||k==='createRadialGradient')return (...a)=>{finite(k,a);return{addColorStop:(...v)=>finite('addColorStop',v)}};
  return (...a)=>{finite(k,a);events.push({context:t._label,method:k,args:a,alpha:t.globalAlpha,width:t.lineWidth,blur:t.shadowBlur});if(k==='arc')arcs.push(a);if(k==='stroke')strokes++;};
 },set(t,k,v){if(typeof v==='number')assert(Number.isFinite(v),`${width}: non-finite ${String(k)}`);t[k]=v;return true;}});};
 const element={dataset:{},classList:{contains:()=>false,add(){},remove(){}},getBoundingClientRect:()=>({width,height,bottom:height}),append(){},removeAttribute(){},addEventListener(){}};
 const hero={...element,dataset:{}};
 const image={naturalWidth:3840,naturalHeight:2160,complete:true,addEventListener(){}};
 const document={documentElement:element,hidden:false,querySelector:s=>s==='.hero'?hero:element,getElementById:()=>image,addEventListener(){},createElement:()=>({setAttribute(){},getContext:context})};
 const sandbox={document,window:{},devicePixelRatio:1,innerWidth:width,innerHeight:height,matchMedia:()=>({matches:false,addEventListener(){}}),getComputedStyle:()=>({objectPosition:width<700?'82% center':'50% center'}),MutationObserver:class{observe(){}},addEventListener(){},performance:{now:()=>0},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},requestAnimationFrame:()=>0,Image:class{},fetch(){throw Error('Unexpected fetch in pure renderer harness')}};
 const injected=source.replace(/  sync\(\);\n\}\)\(\);\s*$/,'  globalThis.__streamTest={buildScene,paintLights,paintCircuit,paintAssembly,materialCycle,materialDuration,setScene:(value,start=0)=>{scene=value;flowStarted=start;started=start;}};\n})();');
 assert.notEqual(injected,source,'Private hook injection failed');
 vm.createContext(sandbox);vm.runInContext(injected,sandbox,{filename:'assembly.js'});
 const api=sandbox.__streamTest,s=api.buildScene(assets);api.setScene(s);s.ctx._label='visible';s.layerCtx._label='assembly';
 assert.equal(s.stream.legs.filter(l=>l.route).length,47);
 assert.equal(new Set(s.stream.legs.filter(l=>l.route).map(l=>l.route.id)).size,47);
 assert(s.stream.length>0&&s.stream.speed>0&&s.stream.trail>0);
 const cycle=s.stream.length/s.stream.speed*1000;
 const visited=new Set();let visibleFrames=0,hiddenFrames=0,wrapTailFrames=0,maxArcs=0,maxTailSpans=0,darkGlowFrames=0;
 const times=[];for(let t=0;t<=Math.ceil(cycle);t++)times.push(t);
 // Exact bounds catch handoffs and zero phase, plus the beginning of loop 2.
 for(const leg of s.stream.legs)for(const d of [0,.0001,leg.length/2,Math.max(0,leg.length-.0001)])times.push((leg.start+d)/s.stream.speed*1000);
 times.push(cycle,cycle+.1,cycle+1,2*cycle);
 for(const now of times){
  arcs=[];strokes=0;events=[];api.paintLights(now);
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
  // Dark and white materials must use the very same projected polyline and
  // distance clock. Compare every painted path and head, not just route IDs.
  const whiteEvents=events,whiteArcs=arcs.map(a=>a.slice(0,2));
  const pathEvents=list=>list.filter(e=>e.method==='moveTo'||e.method==='lineTo').map(e=>({method:e.method,args:e.args}));
  const whiteStrokes=whiteEvents.filter(e=>e.method==='stroke');
  arcs=[];strokes=0;events=[];api.paintCircuit(now,s.layerCtx,{intensity:1,dark:1});
  assert.equal(events.filter(e=>e.method==='clearRect').length,0,'Dark circuit erased the physical board');
  assert.deepEqual(pathEvents(events),pathEvents(whiteEvents),'Dark pulse deviates from the registered grooves');
  assert.deepEqual(arcs.map(a=>a.slice(0,2)),whiteArcs,'Dark head moved relative to the white circuit');
  assert.equal(strokes,expectedSpans*3,'Dark rendering spawned extra or missing pulse spans');
  assert.equal(hero.dataset.circuitRoute,headLeg?.route?.id??'underboard');
  assert.equal(hero.dataset.circuitLight,expectedSpans?'on':'rest');
  const darkStrokes=events.filter(e=>e.method==='stroke');
  for(let i=0;i<darkStrokes.length;i++){
   assert(darkStrokes[i].blur>whiteStrokes[i].blur,'Dark pulse must have a stronger neon bloom');
   assert(darkStrokes[i].width>whiteStrokes[i].width,'Dark pulse core/bloom must remain prominent');
   assert(darkStrokes[i].alpha>=whiteStrokes[i].alpha);
  }
  if(darkStrokes.length)darkGlowFrames++;
 }
 assert.equal(visited.size,47,'The single clock did not visit every route');
 assert(wrapTailFrames>0,'Tail failed to wrap across the circuit seam');
 assert.equal(maxArcs,2);
 // The live assembly must put the stream on the board, beneath all hardware
 // and its shadows. Check every dark chapter and both transition directions.
 let compositionSamples=0;
 const componentImages=new Set(s.parts.flatMap(p=>[p.texture,p.solidTexture,p.shadow,p.edge]).filter(Boolean));componentImages.add(s.specular);
 for(const p of [.23,.28,.34,.4,.46,.5,.6,.65,.7,.76,.82]){
  const look=api.materialCycle(p);assert(look.dark>0);events=[];api.paintAssembly(look.spread,p,look);
  const layer=events.filter(e=>e.context==='assembly');
  const boardIndex=layer.findIndex(e=>e.method==='drawImage'&&e.args[0]===s.darkLayer);
  const tubeIndex=layer.findIndex(e=>e.method==='drawImage'&&e.args[0]===s.tubes);
  const componentIndex=layer.findIndex(e=>e.method==='drawImage'&&componentImages.has(e.args[0]));
  assert(boardIndex>=0&&tubeIndex>boardIndex&&componentIndex>tubeIndex,'Physical board/circuit/hardware paint order regressed');
  assert.equal(layer.filter(e=>e.method==='clearRect').length,1,'The stream cleared the assembled board');
  for(const [index,event] of layer.entries())if(event.method==='stroke'||event.method==='arc')assert(index>boardIndex&&index<componentIndex,'Circuit light floats over a chip instead of remaining in the grooves');
  const head=(p*api.materialDuration/1000*s.stream.speed)%s.stream.length;
  assert.equal(hero.dataset.circuitRoute,s.stream.legs.find(l=>head>=l.start&&head<l.end)?.route?.id??'underboard','Assembly circuit uses a different time origin');
  compositionSamples++;
 }
 // At a fixed timestamp, a material fade may change opacity but never route
 // geometry. This also exercises a nonzero startup timestamp.
 api.setScene(s,1234);const sampled=1234+cycle*.37;let baseline;
 for(const intensity of [.05,.25,.5,.75,1]){events=[];api.paintCircuit(sampled,s.layerCtx,{intensity,dark:intensity});const geometry=events.filter(e=>['moveTo','lineTo'].includes(e.method)).map(e=>[e.method,...e.args]);if(baseline)assert.deepEqual(geometry,baseline);else baseline=geometry;for(const e of events.filter(e=>e.method==='stroke'||e.method==='fill'))assert(e.alpha>=0&&e.alpha<=intensity);}
 // At the exact loop seam, the assembly renderer and the resting renderer must
 // paint the same packet without a route jump or one blank frame.
 const seamTime=1234+api.materialDuration;
 const pulseCommands=()=>events.filter(e=>e.context==='visible'&&['moveTo','lineTo','arc','stroke','fill'].includes(e.method)).map(e=>({method:e.method,args:e.args,alpha:e.alpha,width:e.width,blur:e.blur}));
 events=[];api.paintLights(seamTime);const restingPulse=pulseCommands();assert(restingPulse.length>0);
 for(const progress of [0,1]){events=[];const look=api.materialCycle(progress);api.paintAssembly(look.spread,progress,look,seamTime);assert.deepEqual(pulseCommands(),restingPulse,`Circuit packet changes at assembly boundary ${progress}`);}
 results.push({viewport:`${width}x${height}`,routeCount:visited.size,cycleMs:+cycle.toFixed(3),sampleCount:times.length,maxHeadArcs:maxArcs,visibleFrames,hiddenFrames,wrapTailFrames,maxTailSpans,darkGlowFrames,compositionSamples,darkAndWhiteGrooveGeometry:'identical',loopBoundaryPulse:'identical',finiteCanvasCalls:callCount});
}
fs.writeFileSync('verification/single-circuit-stream-results.json',JSON.stringify({passed:true,results},null,2)+'\n');
console.log(JSON.stringify({passed:true,results},null,2));
