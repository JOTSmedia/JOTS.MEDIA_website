const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

// Run the shipping controller unchanged; the rest of the page is represented by
// browser-like events, timer scheduling, and a measurable scrolling viewport.
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const begin=source.indexOf('// A single idle tour follows the initial introduction.');
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
    matches(){
      return ['a','button','input','select','textarea','summary'].includes(this.tag)||
        (this.attributes.has('tabindex')&&this.attributes.get('tabindex')!=='-1')||
        this.attributes.get('contenteditable')==='true'||this.attributes.get('role')==='button';
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
  root.dataset={};root.scrollHeight=config.scrollHeight||10000;
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
  doc.querySelector=()=>controlOpen?link:null;
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
    performance:{getEntriesByType:()=>[{type:config.navigation||'navigate'}]},
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
    root,body,pause,replay,link,doc,media,win,scrollCalls,advance,fire,nestedScroll,
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
function remainsStopped(browser){
  const position=browser.y;
  browser.root.classList.add('is-loading');browser.finishLoader();browser.advance(30000);
  assert.equal(browser.y,position);assert.equal(browser.pause.hidden,true);assert.equal(browser.state,'stopped');
}

test('waits for loader completion, then a full eight-second idle interval',()=>{
  const b=createBrowser();b.advance(12000);assert.equal(b.y,0);assert.equal(b.pause.hidden,true);
  b.finishLoader();b.advance(7999);assert.equal(b.pause.hidden,true);assert.equal(b.y,0);
  b.advance(1);assert.equal(b.pause.hidden,false);assert.equal(b.state,'running');
});
test('eases into 35 CSS pixels per second and bypasses native smooth scrolling',()=>{
  const b=createBrowser();b.ready();b.advance(2400);const start=b.y;b.advance(2000);
  assert.ok(Math.abs(b.y-start-70)<.6,`Two-second distance was ${b.y-start}px`);
  assert.ok(b.scrollCalls.every(call=>call.behavior==='instant'));
});
for(const type of ['pointerdown','touchstart','wheel','keydown']){
  test(`${type} during loader permanently prevents the tour`,()=>{
    const b=createBrowser();b.fire(type);b.finishLoader();b.advance(20000);assert.equal(b.y,0);remainsStopped(b);
  });
  test(`${type} stops a running tour without residual movement`,()=>{
    const b=createBrowser();b.ready();b.advance(2200);assert.ok(b.y>0);b.fire(type);remainsStopped(b);
  });
}
test('an idle-period press cancels the pending start',()=>{
  const b=createBrowser();b.finishLoader();b.advance(4000);b.fire('pointerdown');b.advance(20000);
  assert.equal(b.y,0);remainsStopped(b);
});
test('pointer jitter is tolerated, but eight-pixel intent stops immediately',()=>{
  const b=createBrowser();b.ready();b.advance(2000);
  b.fire('pointermove',b.body,{clientX:100,clientY:100});
  b.fire('pointermove',b.body,{clientX:105,clientY:105});assert.equal(b.state,'running');
  b.fire('pointermove',b.body,{clientX:108,clientY:100});remainsStopped(b);
});
test('interactive focus cancels a waiting tour',()=>{
  const b=createBrowser();b.finishLoader();b.advance(3000);b.link.focus();remainsStopped(b);
});
test('pause retains keyboard activation and returns focus without a scroll jump',()=>{
  const b=createBrowser();b.ready();b.advance(2000);b.pause.focus();b.fire('keydown',b.pause,{key:'Enter'});
  assert.equal(b.state,'running');const position=b.y;b.fire('click',b.pause);
  assert.equal(b.pause.hidden,true);assert.equal(b.doc.activeElement,b.body);assert.equal(b.y,position);remainsStopped(b);
});
for(const [label,config] of Object.entries({
  'Motion Off':{motionOff:true},'reduced motion':{reduced:true},'deep link':{hash:'#portfolio'},
  'hidden document':{hidden:true},'history restoration':{navigation:'back_forward'},
  'restored scroll position':{scrollY:120},'open menu or dialog':{openControl:true}
}))test(`${label} never starts`,()=>{
  const b=createBrowser(config),initial=b.y;b.finishLoader();b.advance(20000);assert.equal(b.y,initial);remainsStopped(b);
});
test('#top remains an eligible entry point',()=>{const b=createBrowser({hash:'#top'});b.ready();b.advance(2000);assert.ok(b.y>0);});
for(const [label,action] of Object.entries({
  'visibility loss':b=>b.hide(),'resize':b=>b.resize(),'hash change':b=>b.hash(),
  'Motion Off':b=>b.root.classList.add('motion-off'),
  'reduced motion':b=>{b.media.matches=true;b.media.dispatch({type:'change'});},
  'bfcache restoration':b=>b.restore(),'loader replay':b=>b.fire('click',b.replay)
}))test(`${label} stops a running tour permanently`,()=>{
  const b=createBrowser();b.ready();b.advance(2000);action(b);remainsStopped(b);
});
test('open controls at the delayed start prevent movement',()=>{
  const b=createBrowser();b.finishLoader();b.advance(6000);b.openControl();b.advance(10000);
  assert.equal(b.y,0);remainsStopped(b);
});
test('page position restored during the idle interval cancels the tour',()=>{
  const b=createBrowser();b.finishLoader();b.advance(1000);b.externalScroll(200);remainsStopped(b);
});
test('nested project preview scrolling does not count as page-reader interaction',()=>{
  const b=createBrowser();b.finishLoader();b.nestedScroll();b.advance(8000);b.advance(2000);
  const previous=b.y;b.nestedScroll();b.advance(1000);assert.equal(b.state,'running');assert.ok(b.y>previous);
});
test('tour stops at the bottom and hides its control',()=>{
  const b=createBrowser({scrollHeight:1000,height:800});b.ready();b.advance(12000);
  assert.ok(Math.abs(b.y-200)<=1);assert.equal(b.state,'finished');assert.equal(b.pause.hidden,true);
  const final=b.y;b.advance(20000);assert.equal(b.y,final);
});

console.log(`\n${passed} behavioral checks passed using the actual app.js controller.`);
