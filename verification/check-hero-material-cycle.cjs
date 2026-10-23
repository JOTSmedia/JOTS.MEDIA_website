'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','assembly.js'),'utf8');
let checks=0;
const materials=['--hero-dark','--hero-material-ink','--hero-material-shadow','--hero-pane-rgb','--hero-transition-scrim'];
function env(){
 const timers=new Map(),events={},docEvents={};let nextTimer=0,removed=0,cancelled=0,ioCallback,mutationCallback,fetches=0,clock=0,rafRequests=0;
 const classes=new Set(),visualClasses=new Set(),styleMap=new Map();
 const style={setProperty:(k,v)=>styleMap.set(k,v),removeProperty:k=>styleMap.delete(k)};
 const root={classList:{contains:k=>classes.has(k)}};
 const removeAttribute=function(name){const key=name.replace(/^data-/,'').replace(/-([a-z])/g,(_,x)=>x.toUpperCase());delete this.dataset[key];};
 const hero={dataset:{},style,removeAttribute,getBoundingClientRect:()=>({width:1440,height:830,bottom:830})};
 const visual={classList:{add:(...ks)=>ks.forEach(k=>visualClasses.add(k)),remove:(...ks)=>ks.forEach(k=>visualClasses.delete(k))}};
 const image={complete:true,naturalWidth:3840,naturalHeight:2160,addEventListener(){}};
 const media={matches:false,addEventListener:(e,f)=>media.cb=f};
 const document={documentElement:root,hidden:false,querySelector:s=>s==='.hero'?hero:visual,getElementById:()=>image,addEventListener:(e,f)=>docEvents[e]=f};
 const context={document,window:{},matchMedia:()=>media,performance:{now:()=>clock},MutationObserver:class{constructor(cb){mutationCallback=cb;}observe(){}},
  IntersectionObserver:class{constructor(cb){ioCallback=cb;}observe(){}},addEventListener:(e,f)=>events[e]=f,
  setTimeout:(f,d)=>{timers.set(++nextTimer,{f,d});return nextTimer;},clearTimeout:i=>timers.delete(i),
  requestAnimationFrame:()=>{rafRequests++;return 777;},cancelAnimationFrame:()=>cancelled++,
  Image:class{},fetch:()=>{fetches++;return Promise.reject(new Error('Simulated missing asset'));},
  devicePixelRatio:1,innerWidth:1440,innerHeight:830,console};context.window=context;
 // Only geometry construction is substituted for the lifecycle fixtures. The
 // shipping phase transitions, clock, paint calls and stop/resume code run as-is.
 const observed=source.replace('const buildScene=assets=>{','const buildScene=assets=>{if(globalThis.__fakeScene){canvas=globalThis.__fakeCanvas;return globalThis.__fakeScene;}');
 const injected=observed.replace(/  sync\(\);\n\}\)\(\);\s*$/,`
  globalThis.__materialTest={materialCycle,materialDuration,assembledPause,assembledLight,beginAssembly,beginAssembled,applyMaterial,resetMaterial,stop,sync,render,
   prepare:remove=>{phase="exploding";canvas={remove};scene={};pending=false;},
   forceIdle:()=>{phase="idle";canvas=null;scene=null;},
   prepareLoop:(value,start=1000)=>{scene=value;canvas=globalThis.__fakeCanvas;pending=false;played=false;flowStarted=start;lastFlowFrame=0;beginAssembly(start);},
   cacheAssets:()=>{assetsPromise=Promise.resolve({});},
   getStatus:()=>({phase,pending,played,failed,started,flowStarted,hasCanvas:!!canvas})};
 })();`);
 assert.notEqual(injected,source,'The source test hook did not match');
 vm.createContext(context);vm.runInContext(injected,context,{filename:'assembly.js'});
 const api=context.__materialTest;
 const canvasContext=new Proxy({},{get(t,k){if(k in t)return t[k];if(k==='createLinearGradient')return()=>({addColorStop(){}});return()=>{};},set(t,k,v){t[k]=v;return true;}});
 const stream={length:200,speed:40,trail:20,legs:[
  {route:{id:'a',visible:true,strength:1},points:[[0,0],[100,0]],distances:[0,100],start:0,end:100,length:100},
  {route:{id:'b',visible:true,strength:1},points:[[100,0],[100,100]],distances:[0,100],start:100,end:200,length:100}
 ]};
 const syntheticScene={layerCtx:canvasContext,ctx:canvasContext,parts:[],board:{},layer:{},tubes:{},darkLayer:{},width:1440,height:830,x:0,y:0,photoWidth:1440,photoHeight:830,density:1,stream};
 return {api,hero,visualClasses,classes,styleMap,media,document,events,docEvents,timers,get removed(){return removed;},get cancelled(){return cancelled;},get fetches(){return fetches;},get rafRequests(){return rafRequests;},
  prepare(p=.5){api.applyMaterial(api.materialCycle(p));api.prepare(()=>removed++);visualClasses.add('is-exploding');visualClasses.add('has-circuit-animation');hero.dataset.circuitRoute='test';hero.dataset.circuitLight='on';},
  prepareLoop(start=1000){context.__fakeScene=syntheticScene;context.__fakeCanvas={remove:()=>removed++};api.prepareLoop(syntheticScene,start);},
  setClock:now=>{clock=now;},
  intersect(inside){ioCallback([{isIntersecting:inside,intersectionRatio:inside?1:0}]);},mutate(){mutationCallback();}};
}
const white=t=>{assert.ok(!('materialActive' in t.hero.dataset));assert.ok(!('heroMaterial' in t.hero.dataset));assert.ok(!('heroPhase' in t.hero.dataset));for(const key of materials)assert.ok(!t.styleMap.has(key),`Stale ${key}`);assert.ok(!('circuitRoute' in t.hero.dataset));assert.ok(!('circuitLight' in t.hero.dataset));assert.equal(t.api.getStatus().hasCanvas,false);assert.ok(!t.visualClasses.has('is-exploding'));assert.ok(!t.visualClasses.has('has-circuit-animation'));};
(async()=>{
 let t=env();assert.equal(t.api.materialDuration,15500);checks++;
 const allowedChips=new Set(['charging','exploding','dispersed','reassembling','flowing']);
 const chapters=[];let previous=null,maxJump=0;
 for(let i=0;i<=10000;i++){
  const p=i/10000,look=t.api.materialCycle(p);
  for(const key of ['spread','dark','solid','burst']){assert.ok(Number.isFinite(look[key]));assert.ok(look[key]>=0&&look[key]<=1,`${key} outside unit range at ${p}`);if(previous)maxJump=Math.max(maxJump,Math.abs(look[key]-previous[key]));}
  assert.ok(allowedChips.has(look.chip));if(chapters.at(-1)!==look.chapter)chapters.push(look.chapter);previous=look;
 }
 assert.ok(maxJump<.003,'Material/spread discontinuity');checks++;
 assert.deepEqual(chapters,['white-launch','darkening','solid','second-expansion','returning','settling','flowing']);checks++;
 const start=t.api.materialCycle(0),end=t.api.materialCycle(1);
 for(const key of ['spread','dark','solid','burst'])assert.equal(start[key],0);
 assert.equal(start.chip,'charging');checks++;
 for(const key of ['spread','dark','solid','burst'])assert.equal(end[key],0);
 assert.equal(end.chip,'flowing');checks++;
 assert.equal(t.api.materialCycle(.22).solid,0);assert.ok(t.api.materialCycle(.22).spread>.85);checks++;
 assert.equal(t.api.materialCycle(.44).dark,1);assert.ok(t.api.materialCycle(.44).solid>.99);assert.equal(t.api.materialCycle(.44).spread,.86);checks++;
 assert.equal(t.api.materialCycle(.64).spread,1);assert.equal(t.api.materialCycle(.64).solid,1);assert.equal(t.api.materialCycle(.64).dark,1);checks++;
 assert.equal(t.api.materialCycle(.86).dark,0);assert.equal(t.api.materialCycle(.86).solid,0);assert.ok(t.api.materialCycle(.86).spread>.9);assert.ok(t.api.materialCycle(.86).spread<1);checks++;
 for(const boundary of [.065,.225,.335,.445,.60,.68,.84,.97]){const before=t.api.materialCycle(boundary-1e-7),after=t.api.materialCycle(boundary+1e-7);for(const key of ['spread','dark','solid','burst'])assert.ok(Math.abs(before[key]-after[key])<.00001);}checks++;
 for(const p of [0,.2,.3,.39,.5,.65,.75,.86,1]){const look=t.api.materialCycle(p);t.api.applyMaterial(look);assert.equal(t.styleMap.get('--hero-material-ink'),look.dark>=.51?'244 249 250':'17 22 21');assert.ok(Number.isFinite(+t.styleMap.get('--hero-dark')));assert.ok(+t.styleMap.get('--hero-transition-scrim')>=0);assert.ok(+t.styleMap.get('--hero-transition-scrim')<=.58);}checks++;
 for(let i=0;i<=30;i++){const look=t.api.materialCycle(.97+.03*i/30);for(const key of ['spread','dark','solid','burst'])assert.equal(look[key],0,`The final pixel handoff moves ${key}`);}checks++;
 const interruptions=[
  ['direct stop',t=>t.api.stop()],
  ['hidden tab',t=>{t.document.hidden=true;t.docEvents.visibilitychange();}],
  ['reduced motion',t=>{t.media.matches=true;t.media.cb();}],
  ['Motion Off',t=>{t.classes.add('motion-off');t.mutate();}],
  ['loader replay',t=>{t.classes.add('is-loading');t.mutate();}],
  ['offscreen',t=>t.intersect(false)],
  ['resize',t=>t.events.resize()],
  ['render guard',t=>{t.document.hidden=true;t.api.render(6000);}]
 ];
 for(const [name,interrupt] of interruptions){for(const p of [.27,.4,.5,.64,.75,.9]){t=env();t.prepare(p);interrupt(t);white(t);assert.equal(t.removed,1,`${name} must remove canvas once`);assert.equal(t.api.getStatus().played,true);}checks++;}
 t=env();t.prepare(.55);t.api.resetMaterial();for(const key of materials)assert.ok(!t.styleMap.has(key));assert.ok(!('materialActive' in t.hero.dataset));checks++;
 t=env();t.prepareLoop(125);t.api.applyMaterial(t.api.materialCycle(.65));t.visualClasses.add('is-exploding');t.api.render(125+t.api.materialDuration);
 assert.equal(t.api.getStatus().phase,'flowing');assert.equal(t.api.getStatus().flowStarted,125,'Material completion must not restart the circuit clock');assert.equal(t.api.getStatus().played,true);assert.equal(t.hero.dataset.chipState,'flowing');assert.equal(t.hero.dataset.heroPhase,'flowing');assert.ok(!('materialActive' in t.hero.dataset));assert.ok(!('heroMaterial' in t.hero.dataset));for(const key of materials)assert.ok(!t.styleMap.has(key));assert.ok(!t.visualClasses.has('is-exploding'));checks++;
 // The visible circuit gets a full route sweep at rest, and its fade is confined
 // to geometry that is already perfectly assembled on both sides of the loop.
 assert.ok(t.api.assembledPause>=5200,'The assembled pause is shorter than the full circuit sweep');
 assert.equal(t.api.assembledLight(0),1);assert.equal(t.api.assembledLight(1),1);
 for(let i=0;i<=10000;i++){
  const p=i/10000,light=t.api.assembledLight(p);assert.ok(light>=0&&light<=1);
  if(light>0)assert.equal(t.api.materialCycle(p).spread,0,`Assembled cyan fades while hardware is moving at ${p}`);
 }
 for(const boundary of [0,.065,.97,1]){const before=t.api.assembledLight(Math.max(0,boundary-1e-7)),after=t.api.assembledLight(Math.min(1,boundary+1e-7));assert.ok(Math.abs(before-after)<.00001);}
 checks++;
 t=env();t.prepareLoop();let cycleStart=1000;
 for(let cycle=0;cycle<3;cycle++){
  for(const p of [.01,.15,.28,.4,.54,.68,.77,.9,1]){
   const requests=t.rafRequests;t.api.render(cycleStart+p*t.api.materialDuration);
   assert.equal(t.rafRequests,requests+1,'A render must schedule exactly one next frame');
   assert.equal(t.api.getStatus().flowStarted,1000,'A repeated chapter restarts the stream clock');
   assert.equal(t.hero.dataset.heroPhase,t.api.materialCycle(p).chapter);
  }
  const restStart=cycleStart+t.api.materialDuration;
  assert.equal(t.api.getStatus().phase,'flowing');assert.equal(t.hero.dataset.heroIntroComplete,'true');
  for(const offset of [16,1000,3500,t.api.assembledPause-17]){
   t.api.render(restStart+offset);assert.equal(t.api.getStatus().phase,'flowing','Next explosion starts before the assembled pause completes');
   assert.equal(t.api.getStatus().started,restStart);assert.equal(t.api.getStatus().flowStarted,1000);
   assert.equal(t.hero.dataset.chipState,'flowing');assert.equal(t.hero.dataset.circuitLight,'on');
   assert.ok(!t.visualClasses.has('is-exploding'));for(const key of materials)assert.ok(!t.styleMap.has(key));
  }
  cycleStart=restStart+t.api.assembledPause;t.api.render(cycleStart);
  assert.equal(t.api.getStatus().phase,'exploding');assert.equal(t.api.getStatus().started,cycleStart);
  assert.equal(t.hero.dataset.chipState,'charging');assert.equal(t.hero.dataset.heroPhase,'white-launch');
  assert.equal(t.hero.dataset.heroIntroComplete,'true','Later loops must not block the idle tour again');
  assert.equal(t.styleMap.get('--hero-dark'),'0.0000');assert.ok(t.visualClasses.has('is-exploding'));
 }
 checks++;
 // Pause during the first expansion, the assembled hold, and a later burst.
 // Resume uses the real cached-asset path and always grants a fresh white hold.
 for(const checkpoint of ['initial expansion','assembled hold','later expansion']){
  t=env();t.prepareLoop();const firstEnd=1000+t.api.materialDuration;
  if(checkpoint==='initial expansion')t.api.render(6000);
  else{t.api.render(firstEnd);if(checkpoint==='later expansion')t.api.render(firstEnd+t.api.assembledPause+5000);}
  t.document.hidden=true;t.docEvents.visibilitychange();white(t);assert.equal(t.api.getStatus().played,true);
  const requests=t.rafRequests;t.api.render(100000);assert.equal(t.rafRequests,requests,'Hidden hero must not schedule another frame');
  t.api.cacheAssets();t.setClock(500000);t.document.hidden=false;t.docEvents.visibilitychange();
  const resume=[...t.timers.values()].find(job=>job.d===0);assert.ok(resume,`${checkpoint}: resume should reuse assets immediately`);
  await resume.f();for(let i=0;i<10;i++)await Promise.resolve();
  assert.equal(t.api.getStatus().phase,'flowing');assert.equal(t.api.getStatus().started,500000);assert.equal(t.api.getStatus().flowStarted,500000);
  assert.equal(t.hero.dataset.heroIntroComplete,'true');assert.equal(t.hero.dataset.chipState,'flowing');
  t.api.render(500000+t.api.assembledPause-17);assert.equal(t.api.getStatus().phase,'flowing');
  t.api.render(500000+t.api.assembledPause);assert.equal(t.api.getStatus().phase,'exploding');assert.equal(t.hero.dataset.chipState,'charging');
 }
 checks++;
 // Exercise the actual asset failure catch and its independent deadline cleanup.
 t=env();t.prepare(.55);t.api.forceIdle();t.api.sync();
 const launch=[...t.timers.values()].find(job=>job.d===850);assert.ok(launch);await launch.f();for(let i=0;i<10;i++)await Promise.resolve();
 assert.equal(t.api.getStatus().failed,true);white(t);assert.equal(t.hero.dataset.chipState,'unavailable');assert.ok(t.fetches>0);assert.ok(![...t.timers.values()].some(job=>job.d===6500));checks++;
 console.log(`${checks} hero material storyboard/lifecycle checks passed; 10,001 phase samples; maximum adjacent parameter change ${maxJump.toFixed(6)}.`);
})().catch(error=>{console.error(error);process.exit(1);});
