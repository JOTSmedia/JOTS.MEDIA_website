import * as T from './vendor/three.module.min.js';
import { createAlienCharacter } from './alien-character.js?v=30.3';
const cache={};let humanAtlas;const humanMaps=[];function humanMaterial(quadrant){if(!humanAtlas){humanAtlas=new T.TextureLoader().load('./assets/generated/human-materials.png',()=>humanMaps.forEach(t=>t.needsUpdate=true));humanAtlas.colorSpace=T.SRGBColorSpace;}const map=new T.Texture();map.source=humanAtlas.source;map.colorSpace=T.SRGBColorSpace;map.repeat.set(.475,.475);map.offset.set(quadrant%2?.51:.01,quadrant<2?.51:.01);if(humanAtlas.image?.width)map.needsUpdate=true;humanMaps.push(map);return new T.MeshStandardMaterial({map,color:'#e1dfd6',roughness:.94});}
function material(color,r=.9){return new T.MeshStandardMaterial({color,roughness:r,metalness:0});}
function mesh(g,geo,mat,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function ell(g,mat,x,y,z,sx,sy,sz){return mesh(g,new T.SphereGeometry(1,18,12),mat,x,y,z,sx,sy,sz);}
function limb(g,mat,a,b,r1=1,r2=r1){const va=new T.Vector3(...a),vb=new T.Vector3(...b),d=vb.clone().sub(va);const m=mesh(g,new T.CylinderGeometry(r1,r2,d.length(),8),mat,...va.clone().add(vb).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function hideTexture(){const c=document.createElement('canvas');c.width=512;c.height=256;const q=c.getContext('2d');q.fillStyle='#c7c4b4';q.fillRect(0,0,512,256);for(let i=0;i<12;i++){const x=(i*137)%512,y=(i*79)%256;q.fillStyle=i%3?'#252824':'#41433b';q.beginPath();for(let k=0;k<15;k++){const a=k/15*Math.PI*2,r=17+Math.sin(i*1.2+k*2.7)*10;q.lineTo(x+Math.cos(a)*r*2,y+Math.sin(a)*r);}q.closePath();q.fill();}const data=q.getImageData(0,0,512,256);for(let i=0;i<data.data.length;i+=4){const n=Math.random()*15-7;data.data[i]+=n;data.data[i+1]+=n;data.data[i+2]+=n;}q.putImageData(data,0,0);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
export function createCow(gold=false){
 if(!cache.cow){const hide=new T.TextureLoader().load('./assets/generated/cow-hide.png');hide.colorSpace=T.SRGBColorSpace;hide.anisotropy=8;cache.cow=new T.MeshStandardMaterial({map:hide,roughness:.95});cache.skin=material('#bbb4a0');cache.dark=material('#292c27');cache.muzzle=material('#74625a');cache.horn=material('#afa68d');cache.eye=material('#080c0d',.3);cache.gold=material('#a89059');}
 const g=new T.Group(),body=gold?cache.gold:cache.cow,skin=gold?cache.gold:cache.skin;
 ell(g,body,0,21,0,18,10,7.5);ell(g,body,-10,22,0,8,9,7);ell(g,body,11,23,0,7,9,6);
 // Bony hocks, slender lower legs, distinct hooves, and a long narrow head.
 for(const x of [-11,11])for(const z of [-5,5]){limb(g,skin,[x,20,z],[x+(x<0?2:-1),10,z],2.1,1.4);limb(g,skin,[x+(x<0?2:-1),10,z],[x+(x<0?-1:1),2,z],1.1,.75);mesh(g,new T.BoxGeometry(3,2.5,2.8),cache.dark,x+(x<0?-1:1),1.1,z);}
 ell(g,skin,17,28,0,4.5,7.5,4);const head=ell(g,body,20,29,0,6,4,3.8);g.userData.head=head;head.rotation.z=-.3;ell(g,cache.muzzle,25,26.7,0,3.5,2.3,3.5);
 for(const z of [-3.6,3.6]){ell(g,cache.eye,22,30,z,.5,.6,.25);const ear=ell(g,skin,16,33,z*1.6,3.5,.7,1.3);ear.rotation.y=z>0?.45:-.45;limb(g,cache.horn,[17,33,z],[16,37,z*1.3],.8,.15);}
 g.userData.tail=limb(g,cache.dark,[-18,25,0],[-22,14,0],.65,.35);ell(g,cache.dark,-22,12.5,0,.7,2,.7);ell(g,cache.muzzle,-6,14,0,4,2.6,3);g.scale.setScalar(.43);g.userData.actor='cow';return g;
}
export function createHuman(){
 const g=new T.Group(),cloth=humanMaterial(0),trousers=humanMaterial(1),skin=humanMaterial(3),boots=humanMaterial(2),hair=material('#2a2925');
 ell(g,cloth,0,19,0,4.2,6,2.3);ell(g,trousers,0,13,0,3.3,2.5,2);
 for(const side of [-1,1]){limb(g,trousers,[side*2,13,0],[side*2.4,7,.5],1.5,1.2);limb(g,trousers,[side*2.4,7,.5],[side*2.4,1,0],1.2,.85);ell(g,boots,side*2.4,.8,-1,1.1,.9,2);limb(g,cloth,[side*4,23,0],[side*5,18,1],1.3,1.05);limb(g,cloth,[side*5,18,1],[side*4.5,13,-1],1.05,.8);ell(g,skin,side*4.5,12.3,-1,.9,1.3,.7);}
 limb(g,skin,[0,24,0],[0,26,0],1.2);ell(g,skin,0,28.7,0,2.4,3.2,2);ell(g,hair,0,30.5,.3,2.45,1.7,2.05);g.scale.setScalar(.45);g.userData.actor='human';return g;
}

// Rescue crew and security detail share the human scale: approximately 15 world units tall.
function actorPalette(){
 if(!cache.crewPalette)cache.crewPalette={
  alienSkin:material('#9cad9d',.72),alienShadow:material('#788d83',.8),violet:material('#645e75',.91),violetDark:material('#464354',.94),mint:material('#a2bcaf',.83),
  skin:material('#9b8471',.88),uniform:material('#303b39',.96),gear:material('#222d2c',.92),webbing:material('#4b5550',.97),rubber:material('#1b2223',.97),
  metal:new T.MeshStandardMaterial({color:'#3c4546',roughness:.52,metalness:.62}),
  glass:new T.MeshPhysicalMaterial({color:'#16252b',roughness:.19,metalness:.08,clearcoat:1}),eye:new T.MeshPhysicalMaterial({color:'#203133',roughness:.2,clearcoat:1}),
  marker:new T.MeshStandardMaterial({color:'#c9e0d3',emissive:'#83b6a2',emissiveIntensity:.18,roughness:.65}),orange:material('#8e7051',.85)
 };return cache.crewPalette;
}
function actorBox(g,m,x,y,z,w,h,d){return mesh(g,new T.BoxGeometry(w,h,d),m,x,y,z);}
function pivot(g,name,x,y,z){const p=new T.Group();p.name=name;p.position.set(x,y,z);g.add(p);return p;}
function suitArm(g,side,cloth,glove,shoulder=23){
 const a=pivot(g,side<0?'leftArm':'rightArm',side*4.1,shoulder,0);
 limb(a,cloth,[0,0,0],[side*.9,-5,.55],1.18,.97);ell(a,cloth,side*.9,-5,.55,1.03,1.12,1.03);
 limb(a,cloth,[side*.9,-5,.55],[side*.6,-9.7,-.5],.96,.7);ell(a,glove,side*.6,-10.2,-.6,.78,1.25,.7);return a;
}
function suitLeg(g,side,cloth,boot){
 const p=pivot(g,side<0?'leftLeg':'rightLeg',side*1.9,13,0);
 limb(p,cloth,[0,0,0],[side*.4,-5.6,.55],1.43,1.14);ell(p,cloth,side*.4,-5.6,.55,1.12,1.27,1.1);
 limb(p,cloth,[side*.4,-5.6,.55],[side*.45,-11.4,0],1.02,.78);ell(p,boot,side*.45,-12.1,-.8,1.05,1.05,1.9);return p;
}
function crewHead(g,m,alien=false){
 const h=pivot(g,'head',0,25.5,0);
 limb(h,alien?m.alienSkin:m.skin,[0,-1,0],[0,1,0],1.05,.95);
 ell(h,alien?m.alienSkin:m.skin,0,3.1,0,alien?2.75:2.25,alien?4.0:3.0,alien?2.35:1.9);
 ell(h,alien?m.alienShadow:m.skin,0,1.7,-1.0,alien?1.9:1.7,1.65,1.35);
 return h;
}
function setCrewRig(g,actor){
 const head=g.getObjectByName('head'),leftArm=g.getObjectByName('leftArm'),rightArm=g.getObjectByName('rightArm'),leftLeg=g.getObjectByName('leftLeg'),rightLeg=g.getObjectByName('rightLeg');
 Object.assign(g.userData,{actor,head,leftArm,rightArm,leftLeg,rightLeg,arms:[leftArm,rightArm],legs:[leftLeg,rightLeg],walking:true});
 return g;
}
function batchCrewPart(part,protectedGroups=[]){
 // Combine static pieces by paint while preserving the head/limb pivots.
 part.updateMatrixWorld(true);const inverse=part.matrixWorld.clone().invert(),sets=new Map(),remove=[];
 part.traverse(o=>{if(!o.isMesh)return;for(let p=o.parent;p&&p!==part;p=p.parent)if(protectedGroups.includes(p))return;
  const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry,pa=geo.attributes.position,na=geo.attributes.normal,uv=geo.attributes.uv;
  const transform=inverse.clone().multiply(o.matrixWorld),nm=new T.Matrix3().getNormalMatrix(transform);let b=sets.get(o.material);if(!b){b={p:[],n:[],u:[]};sets.set(o.material,b);}
  const v=new T.Vector3(),n=new T.Vector3();for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(transform);n.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();b.p.push(v.x,v.y,v.z);b.n.push(n.x,n.y,n.z);b.u.push(uv?uv.getX(i):0,uv?uv.getY(i):0);}remove.push(o);
 });
 for(const o of remove)o.parent.remove(o);for(const [mat,b]of sets){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.u,2));mesh(part,geo,mat,0,0,0);}
}
function finishCrew(g,actor){
 const rig=['head','leftArm','rightArm','leftLeg','rightLeg'].map(name=>g.getObjectByName(name));
 batchCrewPart(g,rig);for(const p of rig)batchCrewPart(p);g.scale.setScalar(.45);g.userData.actor=actor;return g;
}
export function createAlienCrew(){return createAlienCharacter();}
export function createSoldier(){
 if(cache.soldierTemplate)return setCrewRig(cache.soldierTemplate.clone(true),'soldier');
 const g=new T.Group(),m=actorPalette();g.name='securitySoldier';
 ell(g,m.uniform,0,19,0,4.05,6,2.3);ell(g,m.uniform,0,13,0,3.3,2.5,2);
 actorBox(g,m.gear,0,20,-2.15,6.8,7.8,1.2);actorBox(g,m.webbing,0,20,-2.83,5.4,5.7,.26);
 actorBox(g,m.gear,0,20,2.3,5.9,7,2);actorBox(g,m.webbing,0,15,-.1,7.1,.8,4.8);
 for(const side of [-1,1]){
  const leg=suitLeg(g,side,m.uniform,m.rubber),arm=suitArm(g,side,m.uniform,m.gear);
  ell(leg,m.gear,side*.4,-5.6,-.5,1.2,1.5,.53);actorBox(leg,m.gear,side*1.15,-2.5,.4,.65,2.5,2.2);
  actorBox(arm,m.webbing,0,-1.1,-.95,1.8,2.5,.35);ell(arm,m.gear,side*.9,-5,.02,1.1,1.3,.65);
  actorBox(g,m.webbing,side*2.5,23.8,0,1.4,.45,4.3);actorBox(g,m.gear,side*2.8,15.1,0,1.5,2.3,2.7);
  for(let j=0;j<2;j++)actorBox(g,m.gear,side*(.9+j*1.5),18,-3.3,1.2,2.6,.9);
 }
 const h=crewHead(g,m,false);
 const helmet=mesh(h,new T.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.62),m.uniform,0,4.05,.25,2.65,2.8,2.35);
 actorBox(h,m.gear,0,4,-1.95,4.5,1.45,.7);actorBox(h,m.glass,0,4,-2.35,3.9,.95,.12);
 ell(h,m.webbing,0,1.55,-1.55,1.9,1.4,.85);actorBox(h,m.gear,0,5.5,-1.8,.65,.85,.65);
 for(const side of [-1,1])ell(h,m.gear,side*2.4,2.7,.05,.55,1.2,.9);
 limb(h,m.gear,[-2.5,2.4,0],[-1.4,1.2,-2],.11);ell(h,m.gear,-1.2,1.1,-2.1,.35,.25,.25);
 // Radio, shoulder antenna, hydration pack and low-ready carbine carried across the chest.
 actorBox(g,m.gear,-3,21.6,-2.4,1.5,2.6,1.2);limb(g,m.rubber,[-3,23,-2.5],[-3,26.5,-2.3],.1);
 const gun=pivot(g,'rifle',.6,16,-4);gun.rotation.set(.35,0,.55);
 actorBox(gun,m.metal,0,0,0,.9,1.3,5.8);actorBox(gun,m.gear,0,-.15,3.3,1.1,1.1,2.4);actorBox(gun,m.gear,0,-.1,-2.7,1,1,3);
 limb(gun,m.metal,[0,.1,-4],[0,.1,-8.4],.24,.2);actorBox(gun,m.gear,0,-1.1,.6,.7,1.7,.8);actorBox(gun,m.metal,0,-1.6,-.4,.7,2,.9);
 actorBox(gun,m.gear,0,1.15,-.7,.65,.7,1.6);limb(g,m.webbing,[-3.4,23,-1.5],[2.8,15,-3.8],.16);
 cache.soldierTemplate=finishCrew(g,'soldier');return setCrewRig(cache.soldierTemplate.clone(true),'soldier');
}
