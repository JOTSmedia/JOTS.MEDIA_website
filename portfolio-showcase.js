// Small scroll-linked depth for visible work. Content and navigation stay native.
(() => {
  const wall=document.querySelector('.work-wall');
  if(!wall||!('IntersectionObserver' in window))return;
  const root=document.documentElement;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const frames=[...wall.querySelectorAll('.project-image')];
  const visible=new Set();
  let pending=0,pageActive=true;
  const enabled=()=>pageActive&&!document.hidden&&!media.matches&&!root.classList.contains('motion-off')&&!root.classList.contains('is-loading');
  const reset=frame=>{frame.style.removeProperty('--preview-shift');frame.classList.remove('is-drifting');};
  const paint=()=>{
    pending=0;
    if(!enabled()){frames.forEach(reset);return;}
    const viewport=Math.max(1,innerHeight);
    visible.forEach(frame=>{
      // Measure the stationary article, avoiding feedback from the moving frame.
      const top=frame.closest('.project').getBoundingClientRect().top;
      const center=top+frame.offsetHeight*.5;
      const progress=Math.max(0,Math.min(1,center/viewport));
      const shift=(.5-progress)*24;
      frame.style.setProperty('--preview-shift',`${shift.toFixed(2)}px`);
      frame.classList.add('is-drifting');
    });
  };
  const schedule=()=>{
    if(!enabled()){
      cancelAnimationFrame(pending);pending=0;frames.forEach(reset);return;
    }
    if(visible.size&&!pending)pending=requestAnimationFrame(paint);
  };
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting)visible.add(entry.target);
      else{visible.delete(entry.target);reset(entry.target);}
    });
    if(!visible.size){cancelAnimationFrame(pending);pending=0;}
    schedule();
  },{threshold:0});
  frames.forEach(frame=>observer.observe(frame));
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pagehide',()=>{pageActive=false;schedule();});
  addEventListener('pageshow',()=>{pageActive=true;schedule();});
  document.addEventListener('visibilitychange',schedule);
  media.addEventListener('change',schedule);
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['class']});
})();
