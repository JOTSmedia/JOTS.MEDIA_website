const fs=require('node:fs/promises');
const sharp=require('/Users/bethrooney/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const {data:rgb,info}=await sharp('sources/technology-white-original.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {data:objects}=await sharp('sources/technology-components-alpha.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const W=info.width,H=info.height,w=Math.ceil(W/2),h=Math.ceil(H/2),mask=new Uint8Array(w*h),dilated=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const px=Math.min(W-1,x*2+dx),py=Math.min(H-1,y*2+dy),i=(py*W+px)*4;
   if(objects[i+3]>20)continue;
   const r=rgb[i],g=rgb[i+1],b=rgb[i+2];
   if(g-r>9&&b-r>8&&r>85&&r<240)mask[y*w+x]=1;
  }
 }
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  if(mask[y*w+x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)dilated[(y+dy)*w+x+dx]=1;
 }
 const labels=new Int32Array(w*h);labels.fill(-1);const components=[];
 const neighbors=k=>{const x=k%w,y=Math.floor(k/w),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h)out.push(ny*w+nx);}return out;};
 for(let i=0;i<w*h;i++){
  if(!dilated[i]||labels[i]>=0)continue;const id=components.length,q=[i];labels[i]=id;
  for(let j=0;j<q.length;j++)for(const n of neighbors(q[j]))if(dilated[n]&&labels[n]<0){labels[n]=id;q.push(n);}
  components.push(q);
 }
 const walk=(origin,id)=>{
  const q=[origin],seen=new Set([origin]),previous=new Map();
  for(let j=0;j<q.length;j++)for(const n of neighbors(q[j]))if(labels[n]===id&&!seen.has(n)){seen.add(n);previous.set(n,q[j]);q.push(n);}
  return {end:q[q.length-1],previous};
 };
 const routes=[];
 for(let id=0;id<components.length;id++){
  const component=components[id];if(component.length<60)continue;
  const a=walk(component[0],id).end,{end,previous}=walk(a,id),points=[];
  for(let k=end;k!==undefined;k=previous.get(k)){points.push([k%w*2+1,Math.floor(k/w)*2+1]);if(k===a)break;}
  if(points.length<55)continue;
  // Stay on source-colour pixels, rather than the 2px gap-closing envelope.
  const centered=points.map(([x,y])=>{
   let sx=0,sy=0,total=0;
   for(let yy=Math.max(0,y-3);yy<=Math.min(H-1,y+3);yy++)for(let xx=Math.max(0,x-3);xx<=Math.min(W-1,x+3);xx++){
    const i=(yy*W+xx)*4;if(objects[i+3]>20)continue;
    const strength=Math.min(rgb[i+1],rgb[i+2])-rgb[i];if(strength<=8)continue;
    const weight=strength*strength;sx+=xx*weight;sy+=yy*weight;total+=weight;
   }
   return total?[+(sx/total).toFixed(1),+(sy/total).toFixed(1)]:[x,y];
  });
  const sampled=centered.filter((_,i)=>i%2===0||i===centered.length-1);
  routes.push({length:points.length*2,points:sampled,area:component.length});
 }
 routes.sort((a,b)=>b.length-a.length);
 const result={sourceWidth:W,sourceHeight:H,routes:routes.slice(0,8).map(r=>r.points)};
 await fs.writeFile('images/assembly/circuit-paths.json',JSON.stringify(result));
 console.log(JSON.stringify(routes.slice(0,12).map(r=>({length:r.length,area:r.area,from:r.points[0],to:r.points.at(-1)})),null,2));
 const paths=result.routes.map((p,i)=>`<polyline points="${p.map(v=>v.join(',')).join(' ')}" fill="none" stroke="${['red','blue','lime','purple','orange','magenta','black','brown'][i]}" stroke-width="3"/><text x="${p[0][0]}" y="${p[0][1]}" font-size="22" fill="red">${i+1}</text>`).join('');
 await fs.writeFile('work/circuit-review.html',`<!doctype html><html><body style="margin:0"><div style="position:relative;width:100%"><img src="../sources/technology-white-original.png" style="width:100%;display:block"><svg viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;width:100%;height:100%">${paths}</svg></div></body></html>`);
})();
