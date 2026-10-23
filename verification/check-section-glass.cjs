const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','section-glass.js'),'utf8');
let checks=0;
function env({phone=false,reduced=false,support=true,throwAnimation=false}={}){
 const timers=new Map(),events={},docEvents={};let timer=0;const animations=[];
 const root={classList:{values:new Set(),contains(c){return this.values.has(c);}}};
 class El{
  constructor(name){this.name=name;this.dataset={};this.children=[];this.className='';this.classes=new Set();this.style={setProperty(){}};this.classList={add:c=>this.classes.add(c)};}
  querySelector(s){return this.map?.[s]||null;}setAttribute(){}
  append(...els){els.forEach(el=>{el.parent=this;this.children.push(el);});}
  before(el){this.parent.append(el);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);}
  getBoundingClientRect(){return{width:phone?330:1000,height:phone?200:450};}
  animate(frames,options){
   if(throwAnimation)throw Error('unavailable');
   let resolve;const finished=new Promise(r=>resolve=r);const a={frames,options,finished,resolve,cancel(){resolve();}};animations.push(a);return a;
  }
 }
 if(!support)El.prototype.animate=undefined;
 const selectors=['.work','.services','.about','.process','.contact'];const sections=selectors.map(name=>new El(name));
 sections.forEach((s,i)=>{const host=new El('host');s.append(host);s.map={[['.project-image','.signal-field','.about-photo','.process-heading','.contact-heading'][i]]:host};});
 const mediaReduced={matches:reduced,addEventListener(t,cb){this.cb=cb;}};
 const mediaPhone={matches:phone,addEventListener(){}};
 const document={documentElement:root,hidden:false,querySelector:s=>sections[selectors.indexOf(s)]||null,createElement:tag=>new El(tag),addEventListener:(e,f)=>docEvents[e]=f};
 let io,mo;
 class IO{constructor(cb){this.cb=cb;this.hosts=[];io=this;}observe(e){this.hosts.push(e);}}
 class MO{constructor(cb){this.cb=cb;mo=this;}observe(){}}
 const context={document,Element:El,matchMedia:q=>q.includes('reduced')?mediaReduced:mediaPhone,IntersectionObserver:IO,MutationObserver:MO,setTimeout:(f,d)=>{timers.set(++timer,f);return timer;},clearTimeout:i=>timers.delete(i),addEventListener:(e,f)=>events[e]=f,Promise,console};context.window=context;
 vm.runInNewContext(source,context);
 const active=()=>sections.filter(s=>s.dataset.glassState==='exploding');
 const entries=(hosts,inside=true)=>io.cb(hosts.map(target=>({target,isIntersecting:inside,intersectionRatio:inside?.5:0})));
 return{root,sections,mediaReduced,document,io,mo,timers,events,docEvents,animations,active,entries};
}
const resting=t=>t.sections.slice(3).map(s=>s.children.find(c=>c.className.startsWith('section-glass-slot'))).filter(Boolean).flatMap(h=>h.children).filter(l=>l.classes.has('is-resting'));
const tick=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
(async()=>{
 let t=env();assert.equal(resting(t).length,2);assert.ok(resting(t).every(l=>l.children[0].children.length>0));checks++;assert.equal(t.sections.length,5);assert.ok(t.sections.every(s=>s.dataset.glassState==='waiting'));checks++;
 t.entries(t.io.hosts);assert.equal(t.active().length,2);assert.equal(t.sections[0].dataset.glassFragments,'6');assert.equal(t.sections[1].dataset.glassFragments,'6');checks++;
 assert.ok(t.animations.every(a=>a.frames.some(f=>/rotateX\(/.test(f.transform)&&/translate3d\(/.test(f.transform))));checks++;
 t.animations.slice(0,6).forEach(a=>a.resolve());await tick();assert.equal(t.sections[0].dataset.glassState,'settled');assert.equal(t.sections[2].dataset.glassState,'exploding');assert.equal(t.active().length,2);checks++;
 t.entries([t.io.hosts[1]],false);assert.equal(t.sections[1].dataset.glassState,'settled');assert.equal(t.sections[3].dataset.glassState,'exploding');assert.equal(t.active().length,2);checks++;
 t.root.classList.values.add('is-loading');t.mo.cb();assert.equal(t.active().length,0);assert.equal(t.timers.size,0);checks++;
 t.root.classList.values.delete('is-loading');t.mo.cb();assert.equal(t.sections[4].dataset.glassState,'exploding');checks++;
 t.mediaReduced.matches=true;t.mediaReduced.cb();assert.equal(t.active().length,0);assert.equal(t.sections[4].dataset.glassState,'quiet');assert.equal(t.timers.size,0);checks++;
 t.mediaReduced.matches=false;t.mediaReduced.cb();t.entries(t.io.hosts);assert.equal(t.active().length,0);checks++;
 t=env({phone:true});t.entries(t.io.hosts);assert.equal(t.sections[0].dataset.glassFragments,'4');assert.equal(t.sections[1].dataset.glassFragments,'4');t.entries([t.io.hosts[0],t.io.hosts[1]],false);assert.equal(t.sections[2].dataset.glassFragments,'4');checks++;
 t.document.hidden=true;t.docEvents.visibilitychange();assert.equal(t.active().length,0);assert.equal(t.timers.size,0);checks++;
 t=env({reduced:true});assert.equal(resting(t).length,2);assert.equal(t.animations.length,0);checks++;t.entries(t.io.hosts);assert.equal(t.active().length,0);assert.ok(t.sections.every(s=>s.dataset.glassState==='quiet'));checks++;
 t=env();t.entries([t.io.hosts[0]]);t.root.classList.values.add('motion-off');t.mo.cb();assert.equal(t.active().length,0);assert.equal(t.sections[0].dataset.glassState,'quiet');assert.equal(t.timers.size,0);checks++;
 t=env();t.entries([t.io.hosts[0]]);t.events.resize();assert.equal(t.sections[0].dataset.glassState,'settled');assert.equal(t.timers.size,0);assert.equal(resting(t).length,2);checks++;
 t=env();t.entries([t.io.hosts[0]]);t.events.pagehide();assert.equal(t.active().length,0);assert.equal(t.timers.size,0);checks++;
 t=env();t.entries([t.io.hosts[0]]);for(const cb of [...t.timers.values()])cb();assert.equal(t.sections[0].dataset.glassState,'settled');assert.equal(t.timers.size,0);checks++;
 t=env({support:false});assert.equal(resting(t).length,2);checks++;assert.ok(t.sections.every(s=>s.dataset.glassState==='quiet'));checks++;
 t=env({throwAnimation:true});t.entries(t.io.hosts);assert.equal(t.active().length,0);assert.equal(t.timers.size,0);assert.ok(t.sections.every(s=>s.dataset.glassState==='settled'));checks++;
 console.log(`${checks} glass lifecycle checks passed; desktop 6–9 shards, phone 3–4; concurrency limit 2.`);
})().catch(e=>{console.error(e);process.exit(1);});
