const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

// Run the shipping controller unchanged; the rest of the page is represented by
// browser-like events, timer scheduling, and a measurable scrolling viewport.
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const begin=source.indexOf('// Idle scrolling yields immediately to the visitor');
const end=source.indexOf('// Scrolling project snapshots remain local:',begin);
assert.ok(begin>=0 && end>begin,'Find the actual idle-tour controller');
const controller=source.slice(begin,end);

class Target{
  constructor(){this.events=new Map();}
  addEventListener(type,fn,options={}){
    if(typeof options==='boolean')options={capture:options};
    if(options.signal?.aborted)return;
    const entry={fn,capture:Boolean(options.capture),once:Boolean(options.once),signal:options.signal};
    const list=this.events.get(type)||[];list.push(entry);this.events.set(type,list);
    options.signal?.addEventListener('abort',()=>this.removeEventListener(type,fn,options),{once:true});
  }
  removeEventListener(type,fn,options={}){
    const capture=typeof options==='boolean'?options:Boolean(options.capture);
    this.events.set(type,(this.events.get(type)||[]).filter(item=>item.fn!==fn||item.capture!==capture));
  }
  dispatch(event,phase){
    event.target??=this;
    for(const item of [...(this.events.get(event.type)||[])]){
      if(item.signal?.aborted || (phase!==undefined && item.capture!==phase))continue;
      item.fn(event);
      if(item.once)this.removeEventListener(event.type,item.fn,{capture:item.capture});
    }
  }
}
class AbortController{
  constructor(){this.signal=new Target();this.signal.aborted=false;}
  abort(){if(!this.signal.aborted){this.signal.aborted=true;this.signal.dispatch({type:'abort'});}}
}

function createBrowser(config={}){
  let now=0,nextId=0,y=config.scrollY||0,x=0;
  let height=config.height||800,controlOpen=Boolean(config.openControl);
  const jobs=new Map(),observers=new Set(),scrollCalls=[];
  const win=new Target(),doc=new Target(),media=new Target();
  media.matches=Boolean(config.reduced);doc.hidden=Boolean(config.hidden);
  class Element extends Target{
    constructor(tag='div'){super();this.tag=tag;this.attributes=new Map();this.hidden=false;this.parent=null;}
    matches(selector){
      if(selector===':focus-visible')return Boolean(this.focusVisible);
      if(selector.includes('input,textarea,select'))return ['input','textarea','select'].includes(this.tag)||this.attributes.get('contenteditable')==='true';
      return ['a','button','input','select','textarea','summary'].includes(this.tag)||this.attributes.has('tabindex');
    }
    closest(selector){return this.matches(selector)?this:this.parent?.closest(selector)||null;}
    contains(target){return target===this||Boolean(target?.parent&&this.contains(target.parent));}
    getAttribute(name){return this.attributes.get(name)??null;}
    setAttribute(name,value){this.attributes.set(name,String(value));}
    removeAttribute(name){this.attributes.delete(name);}
    focus(){doc.activeElement=this;fire('focusin',this);}
  }
  const root=new Element('html'),body=new Element('body'),pause=new Element('button');
  const replay=new Element('button'),link=new Element('a'),nested=new Element('div');
  pause.hidden=true;pause.parent=body;replay.parent=body;link.parent=body;nested.parent=body;body.parent=root;
  root.dataset={};root.style={scrollBehavior:'smooth'};root.scrollHeight=config.scrollHeight||10000;
  const classes=new Set(config.loading===false?[]:['is-loading']);
  if(config.motionOff)classes.add('motion-off');
  const notify=()=>{for(const observer of [...observers])observer.callback([]);};
  root.classList={
    contains:name=>classes.has(name),
    add:name=>{if(!classes.has(name)){classes.add(name);notify();}},
    remove:name=>{if(classes.delete(name))notify();}
  };
  doc.documentElement=root;doc.body=body;doc.activeElement=body;
  doc.getElementById=id=>({pauseAutoScroll:pause,replayIntro:replay}[id]||null);
  const fakeHero={dataset:{chipState:config.heroState||'flowing'}};
  doc.querySelector=selector=>selector==='.hero'?fakeHero:(controlOpen?link:null);
  class MutationObserver{
    constructor(callback){this.callback=callback;}
    observe(){observers.add(this);}
    disconnect(){observers.delete(this);}
  }
  const schedule=(fn,delay,type)=>{const id=++nextId;jobs.set(id,{fn,due:now+delay,type});return id;};
  const location={hash:config.hash||''};
  function fire(type,target=body,extra={}){
    const event={type,target,...extra};
    win.dispatch(event,true);doc.dispatch(event,true);
    if(target!==doc&&target!==win)target.dispatch(event);
    doc.dispatch(event,false);win.dispatch(event,false);
  }
  function pageScroll(){win.dispatch({type:'scroll',target:doc});}
  function nestedScroll(){
    const event={type:'scroll',target:nested};
    win.dispatch(event,true);doc.dispatch(event,true);nested.dispatch(event);
  }
  const sandbox={
    document:doc,Element,AbortController,MutationObserver,location,
    matchMedia:()=>media,
    performance:{now:()=>now,getEntriesByType:()=>[{type:config.navigation||'navigate'}]},
    addEventListener:win.addEventListener.bind(win),
    setTimeout:(fn,delay)=>schedule(fn,delay,'timeout'),clearTimeout:id=>jobs.delete(id),
    requestAnimationFrame:fn=>schedule(fn,16,'frame'),cancelAnimationFrame:id=>jobs.delete(id),
    scrollTo:options=>{x=options.left??x;y=Math.min(Math.max(0,options.top),root.scrollHeight-height);scrollCalls.push({...options,at:now});pageScroll();}
  };
  Object.defineProperties(sandbox,{scrollY:{get:()=>y},scrollX:{get:()=>x},innerHeight:{get:()=>height}});
  vm.runInNewContext(controller,sandbox,{filename:'app.js (actual idle-tour controller)'});
  function advance(milliseconds){
    const target=now+milliseconds;
    for(;;){
      let chosen;
      for(const entry of jobs)if(entry[1].due<=target&&(!chosen||entry[1].due<chosen[1].due))chosen=entry;
      if(!chosen)break;
      const [id,job]=chosen;jobs.delete(id);now=job.due;job.fn(job.type==='frame'?now:undefined);
    }
    now=target;
  }
  return {
    root,body,pause,replay,link,doc,media,win,scrollCalls,advance,fire,nestedScroll,hero:fakeHero,
    get y(){return y;},get now(){return now;},get state(){return root.dataset.autoScroll;},
    finishLoader:()=>root.classList.remove('is-loading'),
    ready:()=>{root.classList.remove('is-loading');advance(8000);},
    hide:()=>{doc.hidden=true;doc.dispatch({type:'visibilitychange'});},
    resize:()=>{height+=20;win.dispatch({type:'resize'});},
    hash:()=>{location.hash='#portfolio';win.dispatch({type:'hashchange'});},
    openControl:()=>{controlOpen=true;},
    restore:()=>win.dispatch({type:'pageshow',persisted:true}),
    externalScroll:amount=>{y=amount;pageScroll();}
  };
}

let passed=0;
function test(name,run){run();passed++;console.log(`PASS ${name}`);}
function moving(b){b.advance(1500);assert.equal(b.state,'running');}
function stationary(b,duration=4800){const y=b.y;b.advance(duration);assert.equal(b.y,y);}
test('waits for loader exit and five quiet seconds',()=>{const b=createBrowser();b.advance(10000);assert.equal(b.y,0);b.finishLoader();stationary(b,4999);b.advance(201);moving(b);assert.ok(b.y>0);});
test('interaction during loading does not disable auto scroll',()=>{const b=createBrowser();b.fire('wheel');b.finishLoader();b.advance(5200);moving(b);});
test('steady speed is35px/s and every step is instantly cancellable',()=>{const b=createBrowser();b.finishLoader();b.advance(7000);const y=b.y;b.advance(2000);assert.ok(Math.abs(b.y-y-70)<.6);assert(b.scrollCalls.every(s=>s.behavior==='auto'));assert.equal(b.root.style.scrollBehavior,'auto');});
for(const type of ['wheel','keydown','pointermove'])test(`${type} pauses immediately and resumes only after fresh idle`,()=>{const b=createBrowser({loading:false});b.advance(7000);b.fire(type,b.body,{clientX:0,clientY:0});if(type==='pointermove')b.fire(type,b.body,{clientX:20,clientY:0});stationary(b);b.advance(1600);moving(b);});
test('wheel momentum keeps postponing restart until all real scrolling ends',()=>{const b=createBrowser({loading:false});b.advance(7000);b.fire('wheel');for(let i=0;i<12;i++){b.externalScroll(b.y+20);stationary(b,400);}stationary(b,4400);b.advance(1800);moving(b);});
for(const type of ['pointer','touch'])test(`${type} held for15s blocks scrolling; release restarts idle timer`,()=>{const b=createBrowser({loading:false});b.advance(7000);b.fire(type==='pointer'?'pointerdown':'touchstart');stationary(b,15000);b.fire(type==='pointer'?'pointerup':'touchend',b.body,{touches:[]});stationary(b);b.advance(1600);moving(b);});
test('external scrolling during the tour wins immediately',()=>{const b=createBrowser({loading:false});b.advance(7000);b.externalScroll(1800);stationary(b);assert.equal(b.y,1800);b.advance(1600);moving(b);assert.ok(b.y>1800);});
test('mouse-focused link does not permanently suppress idle scrolling',()=>{const b=createBrowser({loading:false});b.link.focus();b.advance(7000);moving(b);});
test('keyboard-focused links resume after navigation becomes idle',()=>{const b=createBrowser({loading:false});b.link.focusVisible=true;b.link.focus();b.advance(7000);moving(b);});
test('held navigation keys prevent auto movement until key release',()=>{const b=createBrowser({loading:false});b.advance(7000);b.fire('keydown',b.body,{key:'PageDown'});stationary(b,15000);b.fire('keyup',b.body,{key:'PageDown'});stationary(b);b.advance(1600);moving(b);});
test('editing an input blocks idle motion regardless of focus style',()=>{const b=createBrowser({loading:false});const input=new b.body.constructor('input');input.parent=b.body;input.focus();stationary(b,20000);});
for(const config of [{motionOff:true},{reduced:true},{hidden:true},{openControl:true}])test(`motion/visibility/open-control guard ${JSON.stringify(config)}`,()=>{const b=createBrowser({...config,loading:false});stationary(b,20000);});
test('visibility return starts a fresh idle interval',()=>{const b=createBrowser({loading:false});b.advance(7000);b.hide();stationary(b,12000);b.doc.hidden=false;b.doc.dispatch({type:'visibilitychange'});stationary(b);b.advance(1600);moving(b);});
test('resize pauses and then resumes without navigation resets',()=>{const b=createBrowser({loading:false});b.advance(7000);b.resize();stationary(b);b.advance(1600);moving(b);});
test('restored positions and hash links resume at the current position',()=>{const b=createBrowser({loading:false,scrollY:500,hash:'#portfolio'});stationary(b);b.advance(2200);moving(b);assert(b.y>500);});
test('nested portfolio scrolling stays independent',()=>{const b=createBrowser({loading:false});b.advance(7000);const y=b.y;b.nestedScroll();b.advance(1000);assert(b.y>y);assert.equal(b.state,'running');});
test('Motion Off yields; re-enabling motion can resume',()=>{const b=createBrowser({loading:false});b.advance(7000);b.root.classList.add('motion-off');stationary(b,15000);b.root.classList.remove('motion-off');b.advance(1600);moving(b);});
test('tour stops at the bottom; manually moving up gets a fresh idle interval',()=>{const b=createBrowser({loading:false,scrollHeight:1000,height:800});b.advance(16000);assert.equal(b.state,'finished');stationary(b,20000);b.externalScroll(50);stationary(b);b.advance(1600);moving(b);});
test('the initial chip assembly finishes before the idle tour begins',()=>{const b=createBrowser({loading:false,heroState:'exploding'});stationary(b,10000);b.hero.dataset.chipState='flowing';b.advance(1600);moving(b);});
assert(!controller.includes('pauseAutoScroll'));
console.log(`\n${passed} actual-controller interaction and idle checks passed; no start/pause control.`);

{
 const b=createBrowser({loading:false});b.advance(7100);assert.equal(b.state,'running');assert.equal(b.root.style.scrollBehavior,'auto');b.fire('wheel');assert.equal(b.root.style.scrollBehavior,'smooth');assert.equal(b.scrollCalls.at(-1).behavior,'auto');console.log('PASS native smooth scrolling is suppressed during the tour and restored after instant cancellation');
}
