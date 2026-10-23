'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','assembly.js'),'utf8');
let checks=0;
const materials=['--hero-dark','--hero-material-ink','--hero-material-shadow','--hero-pane-rgb','--hero-transition-scrim'];
function env(){
 const timers=new Map(),events={},docEvents={};let nextTimer=0,removed=0,cancelled=0,ioCallback,mutationCallback,fetches=0;
 const classes=new Set(),visualClasses=new Set(),styleMap=new Map();
 const style={setProperty:(k,v)=>styleMap.set(k,v),removeProperty:k=>styleMap.delete(k)};
 const root={classList:{contains:k=>classes.has(k)}};
 const removeAttribute=function(name){const key=name.replace(/^data-/,'').replace(/-([a-z])/g,(_,x)=>x.toUpperCase());delete this.dataset[key];};
 const hero={dataset:{},style,removeAttribute,getBoundingClientRect:()=>({width:1440,height:830,bottom:830})};
 const visual={classList:{add:(...ks)=>ks.forEach(k=>visualClasses.add(k)),remove:(...ks)=>ks.forEach(k=>visualClasses.delete(k))}};
 const image={complete:true,naturalWidth:3840,naturalHeight:2160,addEventListener(){}};
 const media={matches:false,addEventListener:(e,f)=>media.cb=f};
 const document={documentElement:root,hidden:false,querySelector:s=>s==='.hero'?hero:visual,getElementById:()=>image,addEventListener:(e,f)=>docEvents[e]=f};
 const context={document,window:{},matchMedia:()=>media,performance:{now:()=>0},MutationObserver:class{constructor(cb){mutationCallback=cb;}observe(){}},
  IntersectionObserver:class{constructor(cb){ioCallback=cb;}observe(){}},addEventListener:(e,f)=>events[e]=f,
  setTimeout:(f,d)=>{timers.set(++nextTimer,{f,d});return nextTimer;},clearTimeout:i=>timers.delete(i),
  requestAnimationFrame:()=>777,cancelAnimationFrame:()=>cancelled++,
  Image:class{},fetch:()=>{fetches++;return Promise.reject(new Error('Simulated missing asset'));},
  devicePixelRatio:1,innerWidth:1440,innerHeight:830,console};context.window=context;
 const injected=source.replace(/  sync\(\);\n\}\)\(\);\s*$/,
  '  globalThis.__materialTest={materialCycle,materialDuration,applyMaterial,resetMaterial,stop,sync,render,prepare:remove=>{phase="exploding";canvas={remove};scene={};pending=false;},forceIdle:()=>{phase="idle";canvas=null;scene=null;},prepareEnd:()=>{phase="exploding";started=0;lastFlowFrame=0;const noop=()=>{};const c={clearRect:noop,drawImage:noop,save:noop,restore:noop};scene={layerCtx:c,ctx:c,parts:[],board:{},layer:{},width:1440,height:830,x:0,y:0,photoWidth:1440,photoHeight:830};},getStatus:()=>({phase,pending,played,failed,hasCanvas:!!canvas})};\n})();');
 assert.notEqual(injected,source,'The source test hook did not match');
 vm.createContext(context);vm.runInContext(injected,context,{filename:'assembly.js'});
 const api=context.__materialTest;
 return {api,hero,visualClasses,classes,styleMap,media,document,events,docEvents,timers,get removed(){return removed;},get cancelled(){return cancelled;},get fetches(){return fetches;},
  prepare(p=.5){api.applyMaterial(api.materialCycle(p));api.prepare(()=>removed++);visualClasses.add('is-exploding');visualClasses.add('has-circuit-animation');hero.dataset.circuitRoute='test';hero.dataset.circuitLight='on';},
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
 assert.equal(t.api.materialCycle(.44).dark,1);assert.ok(t.api.materialCycle(.44).solid>.99);assert.ok(t.api.materialCycle(.44).spread<.25);checks++;
 assert.equal(t.api.materialCycle(.64).spread,1);assert.equal(t.api.materialCycle(.64).solid,1);assert.equal(t.api.materialCycle(.64).dark,1);checks++;
 assert.equal(t.api.materialCycle(.86).dark,0);assert.equal(t.api.materialCycle(.86).solid,0);assert.ok(t.api.materialCycle(.86).spread>.98);checks++;
 for(const boundary of [.065,.225,.335,.445,.60,.68,.84]){const before=t.api.materialCycle(boundary-1e-7),after=t.api.materialCycle(boundary+1e-7);for(const key of ['spread','dark','solid','burst'])assert.ok(Math.abs(before[key]-after[key])<.00001);}checks++;
 for(const p of [0,.2,.3,.39,.5,.65,.75,.86,1]){const look=t.api.materialCycle(p);t.api.applyMaterial(look);assert.equal(t.styleMap.get('--hero-material-ink'),look.dark>=.51?'244 249 250':'17 22 21');assert.ok(Number.isFinite(+t.styleMap.get('--hero-dark')));assert.ok(+t.styleMap.get('--hero-transition-scrim')>=0);assert.ok(+t.styleMap.get('--hero-transition-scrim')<=.58);}checks++;
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
 t=env();t.api.applyMaterial(t.api.materialCycle(.65));t.visualClasses.add('is-exploding');t.api.prepareEnd();t.api.render(t.api.materialDuration);
 assert.equal(t.api.getStatus().phase,'flowing');assert.equal(t.api.getStatus().played,true);assert.equal(t.hero.dataset.chipState,'flowing');assert.equal(t.hero.dataset.heroPhase,'flowing');assert.ok(!('materialActive' in t.hero.dataset));assert.ok(!('heroMaterial' in t.hero.dataset));for(const key of materials)assert.ok(!t.styleMap.has(key));assert.ok(!t.visualClasses.has('is-exploding'));checks++;
 // Exercise the actual asset failure catch and its independent deadline cleanup.
 t=env();t.prepare(.55);t.api.forceIdle();t.api.sync();
 const launch=[...t.timers.values()].find(job=>job.d===850);assert.ok(launch);await launch.f();for(let i=0;i<10;i++)await Promise.resolve();
 assert.equal(t.api.getStatus().failed,true);white(t);assert.equal(t.hero.dataset.chipState,'unavailable');assert.ok(t.fetches>0);assert.ok(![...t.timers.values()].some(job=>job.d===6500));checks++;
 console.log(`${checks} hero material storyboard/lifecycle checks passed; 10,001 phase samples; maximum adjacent parameter change ${maxJump.toFixed(6)}.`);
})().catch(error=>{console.error(error);process.exit(1);});
