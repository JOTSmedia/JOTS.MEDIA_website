'use strict';
/* One icon signal on arrival, replayed on a linked wordmark hover/focus.
   The hero signature has its own gathering and circuit choreography.
   The loader owns its matching CSS sequence and never waits on this file. */
(() => {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const marks=[...document.querySelectorAll('.jots-mark')].filter(mark=>!mark.closest('.site-loader')&&!mark.closest('.hero-mark'));
  if(!marks.length)return;
  const seen=new WeakSet(),visible=new Set(),active=new Map();
  const quiet=()=>reduced.matches||root.classList.contains('motion-off');
  const suspended=()=>document.hidden||root.classList.contains('is-loading');
  const stop=mark=>{
    const state=active.get(mark);
    if(state){cancelAnimationFrame(state.frame);clearTimeout(state.timer);active.delete(mark);}
    mark.classList.remove('is-signaling');
  };
  const play=(mark,replay=false)=>{
    if(quiet()||suspended()||!visible.has(mark)||(!replay&&seen.has(mark))||active.has(mark))return;
    stop(mark);
    const state={frame:0,timer:0};active.set(mark,state);
    state.frame=requestAnimationFrame(()=>{
      if(quiet()||suspended()||!visible.has(mark)){stop(mark);return;}
      seen.add(mark);mark.classList.add('is-signaling');
      state.timer=setTimeout(()=>stop(mark),1200);
    });
  };
  const sync=()=>{
    if(quiet()||suspended()){[...active.keys()].forEach(stop);return;}
    visible.forEach(mark=>play(mark));
  };
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting&&entry.intersectionRatio>=.35)visible.add(entry.target);
        else{visible.delete(entry.target);stop(entry.target);}
      });sync();
    },{threshold:[0,.35]});
    marks.forEach(mark=>observer.observe(mark));
  }else{
    marks.forEach(mark=>{const box=mark.getBoundingClientRect();if(box.width&&box.height&&box.bottom>0&&box.top<innerHeight)visible.add(mark);});
  }
  marks.forEach(mark=>{
    const link=mark.closest('.brand-lockup');
    if(!link)return;
    link.addEventListener('pointerenter',()=>play(mark,true));
    link.addEventListener('focusin',()=>play(mark,true));
  });
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class']});
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pageshow',sync);
  sync();
})();
