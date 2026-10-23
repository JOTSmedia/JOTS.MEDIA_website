const fs=require('node:fs/promises');
const sharp=require('/Users/bethrooney/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const {data,info}=await sharp('sources/technology-components-alpha.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,labels=new Int32Array(w*h);labels.fill(-1);const islands=[];
 for(let i=0;i<w*h;i++){
  if(labels[i]>=0||data[i*4+3]<40)continue;
  const id=islands.length,queue=[i];labels[i]=id;let x0=w,y0=h,x1=0,y1=0;
  for(let p=0;p<queue.length;p++){
   const k=queue[p],x=k%w,y=Math.floor(k/w);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy,j=ny*w+nx;
    if(nx<0||nx>=w||ny<0||ny>=h||labels[j]>=0||data[j*4+3]<40)continue;
    labels[j]=id;queue.push(j);
   }
  }
  islands.push({id,area:queue.length,x0,y0,x1,y1});
 }
 const parts=islands.filter(p=>p.area>80).sort((a,b)=>b.area-a.area);
 const atlasWidth=1024;let nextX=2,nextY=2,rowHeight=0;
 for(const part of parts){
  part.x0=Math.max(0,part.x0-1);part.y0=Math.max(0,part.y0-1);part.x1=Math.min(w-1,part.x1+1);part.y1=Math.min(h-1,part.y1+1);
  part.w=part.x1-part.x0+1;part.h=part.y1-part.y0+1;
  if(nextX+part.w+2>atlasWidth){nextX=2;nextY+=rowHeight+4;rowHeight=0;}
  part.ax=nextX;part.ay=nextY;nextX+=part.w+4;rowHeight=Math.max(rowHeight,part.h);
 }
 const atlasHeight=nextY+rowHeight+2,output=Buffer.alloc(atlasWidth*atlasHeight*4);
 for(const part of parts)for(let y=part.y0;y<=part.y1;y++)for(let x=part.x0;x<=part.x1;x++){
  const i=y*w+x;let include=labels[i]===part.id;
  if(!include&&data[i*4+3]>0&&data[i*4+3]<40){
   for(let dy=-1;dy<=1&&!include;dy++)for(let dx=-1;dx<=1&&!include;dx++){
    const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h&&labels[ny*w+nx]===part.id)include=true;
   }
  }
  if(include){const j=((part.ay+y-part.y0)*atlasWidth+part.ax+x-part.x0)*4;data.copy(output,j,i*4,i*4+4);}
 }
 await sharp(output,{raw:{width:atlasWidth,height:atlasHeight,channels:4}}).webp({quality:94,alphaQuality:100}).toFile('images/assembly/components.webp');
 const manifest={sourceWidth:w,sourceHeight:h,atlas:'components.webp',parts:parts.map((p,i)=>({name:i===0?'PROCESSOR':p.area>3000?'CHIP':p.area>1500?'CAPACITOR':'RESISTOR',source:[p.x0,p.y0,p.w,p.h],atlas:[p.ax,p.ay,p.w,p.h],area:p.area}))};
 await fs.writeFile('images/assembly/components.json',JSON.stringify(manifest));
 for(const width of [640,960,1600])await sharp('sources/technology-board-clean.png').resize({width}).webp({quality:88}).toFile(`images/assembly/board-${width}.webp`);
 console.log(`Prepared ${parts.length} individually isolated physical component sprites; atlas ${atlasWidth}×${atlasHeight}.`);
})();
