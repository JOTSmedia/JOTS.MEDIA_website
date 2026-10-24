import { ELEVATION_TILES } from './elevation-data.js?v=30.3';
import * as T from './vendor/three.module.min.js';
import { foliageGeometry, foliageMaterial, foliageDepth } from './foliage-material.js?v=30.3';

// World coordinates are shared with flight physics. Keep scenery above the
// flight ceiling outside the playable rectangle; every extraction site is dry.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const hash=(x,z,s=0)=>{let v=Math.sin(x*127.1+z*311.7+s*74.7)*43758.5453123;return v-Math.floor(v);};
function noise(x,z,s=0){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);return mix(mix(hash(ix,iz,s),hash(ix+1,iz,s),u),mix(hash(ix,iz+1,s),hash(ix+1,iz+1,s),u),v);}
function fbm(x,z,s=0){return noise(x,z,s)*.55+noise(x*2.07,z*2.07,s+4)*.28+noise(x*4.13,z*4.13,s+9)*.12+noise(x*8.3,z*8.3,s+12)*.05;}
function rand(seed){let a=seed|0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const STAGE_DATA=[
 {id:1,name:'Cedar Valley',location:'APPALACHIAN FOOTHILLS',biome:'Rural valley · dusk',description:'Hedgerows, weathered barns and rolling pasture under a fading western sun.',ground:'grass',groundTint:'#c5d2b8',rockTint:'#80857b',fogColor:'#a6a098',fogDensity:.00012,skyColor:'#526c84',skyHorizon:'#c4b7a3',hemiSky:'#c7d5e2',hemiGround:'#6f7560',hemiIntensity:1.0,sunColor:'#ffdbb0',sunIntensity:3.5,exposure:1.02,environmentIntensity:.55,sunDirection:[-900,820,-1500],clouds:.31,waterColor:'#344e52',seed:7919},
 {id:2,name:'Blackpine Reservoir',location:'CASCADE MOUNTAINS',biome:'Alpine forest · blue hour',description:'Dense conifers rise around a glacial reservoir beneath serrated mountain ridges.',ground:'forest',groundTint:'#9da69b',rockTint:'#818c8d',fogColor:'#8299ac',fogDensity:.00025,skyColor:'#233b61',skyHorizon:'#849bad',hemiSky:'#b4cce8',hemiGround:'#576459',hemiIntensity:1.5,sunColor:'#c1d8fa',sunIntensity:1.5,exposure:1.03,environmentIntensity:.45,sunDirection:[-1200,680,-1000],clouds:.25,waterColor:'#2c5160',seed:15401},
 {id:3,name:'Red Mesa',location:'MOJAVE TEST RANGE',biome:'Desert canyon · late afternoon',description:'A military runway cuts through an arid basin bordered by sandstone escarpments.',ground:'sand',groundTint:'#c3a88b',rockTint:'#aa8164',fogColor:'#b4a398',fogDensity:.00017,skyColor:'#6c91ae',skyHorizon:'#e0c6a5',hemiSky:'#d8e5ed',hemiGround:'#9b7962',hemiIntensity:1.8,sunColor:'#fff0cf',sunIntensity:3.3,exposure:.93,environmentIntensity:.65,sunDirection:[-1200,1000,-700],clouds:.10,waterColor:'#404f5c',seed:25349},
 {id:4,name:'Port Halcyon',location:'NORTH ATLANTIC COAST',biome:'Industrial harbor · storm front',description:'Wet docklands, container terminals and gantry cranes beside a dark, wind swept sea.',ground:'asphalt',groundTint:'#9aa4aa',rockTint:'#8b9394',fogColor:'#758992',fogDensity:.00034,skyColor:'#334854',skyHorizon:'#87969b',hemiSky:'#bccbd2',hemiGround:'#626c70',hemiIntensity:1.65,sunColor:'#dce4df',sunIntensity:1.25,exposure:.96,environmentIntensity:.75,sunDirection:[-600,1100,-900],clouds:.82,waterColor:'#314a55',seed:38231},
 {id:5,name:'Whiteout Station',location:'CLASSIFIED ARCTIC SECTOR',biome:'Snowbound mountain base · dawn',description:'Radar domes and hardened hangars guard a frozen valley below exposed granite peaks.',ground:'snow',groundTint:'#d4dce3',rockTint:'#747e89',fogColor:'#a1b3c2',fogDensity:.00023,skyColor:'#617d9b',skyHorizon:'#d2d6db',hemiSky:'#e0eafa',hemiGround:'#91a2b6',hemiIntensity:1.9,sunColor:'#ffe1c3',sunIntensity:2.3,exposure:.90,environmentIntensity:.6,sunDirection:[-1300,620,-1400],clouds:.38,waterColor:'#5a748a',seed:55291},
 {id:6,name:'Krafla Reach',location:'NORTH ATLANTIC RIFT / GEOTHERMAL GRID',biome:'Volcanic highlands · overcast morning',description:'Eroded basalt ridges, wet lava fields and geothermal steam surround the containment power station.',ground:'rock',groundTint:'#77766f',rockTint:'#727572',fogColor:'#9caaa9',fogDensity:.00016,skyColor:'#667c87',skyHorizon:'#b2bcb7',hemiSky:'#d5e0e0',hemiGround:'#666b5d',hemiIntensity:1.7,sunColor:'#f1e9d7',sunIntensity:2.1,exposure:1.04,environmentIntensity:.65,sunDirection:[-1400,1000,-500],clouds:.75,waterColor:'#455f61',seed:74831},
 {id:7,name:'Pelagos Key',location:'PACIFIC ARCHIPELAGO / RELAY ISLAND',biome:'Tropical island · sun after rain',description:'White sand coves, turquoise shallows and palms frame a communications relay beneath deeply eroded coastal peaks.',ground:'grass',groundTint:'#a4b797',rockTint:'#7f8270',fogColor:'#b1c7c9',fogDensity:.00010,skyColor:'#427d9f',skyHorizon:'#c1dadb',hemiSky:'#d6edf2',hemiGround:'#7d8c68',hemiIntensity:1.9,sunColor:'#fff2d6',sunIntensity:3.4,exposure:.97,environmentIntensity:.75,sunDirection:[-1000,1500,-900],clouds:.23,waterColor:'#2e8890',seed:83177},
 {id:8,name:'Glass Meridian',location:'GREAT BASIN / LAUNCH AUTHORITY',biome:'Salt flats · golden hour',description:'Crystalline salt polygons stretch toward bare mountain fronts; antenna fields and launch bunkers interrupt the enormous white plain.',ground:'sand',groundTint:'#e2ddd0',rockTint:'#8d8274',fogColor:'#c5b8a7',fogDensity:.00013,skyColor:'#6c8fa7',skyHorizon:'#eed8b7',hemiSky:'#dce7ed',hemiGround:'#b7a998',hemiIntensity:1.8,sunColor:'#ffd59e',sunIntensity:3.2,exposure:.94,environmentIntensity:.65,sunDirection:[-1700,650,-900],clouds:.14,waterColor:'#787e77',seed:93911},
 {id:9,name:'Fallen Signal',location:'OBSIDIAN BASIN / RECOVERY ZONE',biome:'Black rock crater · midnight mist',description:'Rescue a stranded crew from a downed scout ship inside a cordoned forest impact basin.',ground:'rock',groundTint:'#929a99',rockTint:'#737c80',fogColor:'#758590',fogDensity:.00026,skyColor:'#182a43',skyHorizon:'#718592',hemiSky:'#bdd0e5',hemiGround:'#4e5b59',hemiIntensity:1.85,sunColor:'#dce9fa',sunIntensity:1.7,exposure:1.02,environmentIntensity:.54,sunDirection:[-1100,780,-1200],clouds:.57,waterColor:'#33444e',seed:68729,crashSite:{x:1500,z:900},crewSpawn:{x:1500,z:900}}
];
export const STAGES=STAGE_DATA.map(s=>Object.freeze({...s,subtitle:s.biome,cloudColor:s.skyHorizon,cloudCover:s.clouds,spawn:{x:s.id>=6&&s.id<=8?-330:350,z:900},extract:{x:s.id>=6&&s.id<=8?3380:2600,z:s.id>=6&&s.id<=8?1808:1450},extraction:{x:s.id>=6&&s.id<=8?3380:2600,z:s.id>=6&&s.id<=8?1808:1450},heightAt:(x,z)=>terrainHeight(s.id,x,z)}));
export const getStage=index=>STAGES[clamp(Math.floor(index||1)-1,0,STAGES.length-1)];
export function sampledElevation(index,x,z){const tile=ELEVATION_TILES[getStage(index).id],size=tile.size,u=clamp((x+3300)/9400,0,1)*(size-1),v=clamp((z+3000)/7800,0,1)*(size-1),ix=Math.min(size-2,Math.floor(u)),iz=Math.min(size-2,Math.floor(v)),fx=u-ix,fz=v-iz,at=(a,b)=>tile.values[b*size+a];return mix(mix(at(ix,iz),at(ix+1,iz),fx),mix(at(ix,iz+1),at(ix+1,iz+1),fx),fz);}
export function terrainHeight(index,x,z){
 const id=getStage(index).id,n=fbm(x*.00175,z*.00175,id*11),detail=noise(x*.012,z*.012,id)*2;
 let h;
 if(id===1)h=7+n*53+detail+Math.sin(x*.002+z*.001)*4;
 if(id===2){const eastRidge=Math.exp(-Math.pow((x-2350)/410,2))*Math.exp(-Math.pow((z-650)/650,2))*48;h=10+n*68+eastRidge+detail;const lake=(1-smooth(80,330,x))*smooth(-1700,-750,x)*smooth(-450,0,z)*(1-smooth(1650,2200,z));h=mix(h,-19,lake);}
 if(id===3){const shelf=smooth(.44,.82,noise(x*.0012,z*.002,13))*45;h=12+n*34+shelf+detail;}
 if(id===4){h=9+noise(x*.003,z*.003,4)*3+noise(x*.016,z*.016,7)*.7;if(z>1800)h-=smooth(1800,1930,z)*42;if(x<0)h-=smooth(0,-150,x)*35;}
 if(id===5)h=20+n*76+Math.sin(z*.003+x*.001)*9+detail;
 if(id===6)h=24+n*110+detail*2+Math.sin(x*.004+z*.002)*12;
 if(id===7)h=20+n*95+detail;
 if(id===8)h=12+n*6+detail*.15;
 if(id===9){const d=Math.hypot(x-1500,z-900);h=25+n*57+detail-22*Math.exp(-Math.pow(d/350,2))+18*Math.exp(-Math.pow((d-470)/135,2));}
 // Adapt measured landforms to the fictional mission layout. Clearings retain
 // gentle grades; distant ridges keep the real drainage and erosion structure.
 const tile=ELEVATION_TILES[id],rel=(sampledElevation(id,x,z)-tile.min)/Math.max(1,tile.max-tile.min);
 const outside=Math.max(0,-x-220,x-3000,-z-280,z-2100),blend=smooth(0,1500,outside);
 if(id!==4&&id!==7&&id!==8){h+=(rel-.45)*(id===1?48:70)*(1-clearingWeight(id,x,z)*.65);h=mix(h,20+rel*(id===1?820:id===3?1080:1420),blend);}

 if(id===7){
  const radius=Math.hypot((x-1400)/3000,(z-900)/2100),shore=1-smooth(.86,1.06,radius+noise(x*.003,z*.003,27)*.06);
  h=mix(-28,16+rel*100+n*30,shore);
  // A second, steep volcanic island stands across the northern channel.
  const mountain=Math.exp(-Math.pow((x-1800)/1250,2)-Math.pow((z+2700)/850,2));
  const drainage=.70+.30*Math.pow(1-Math.abs(noise(x*.0027,z*.0018,79)*2-1),2);h=Math.max(h,-30+mountain*(650+rel*1850)*drainage);
 }
 if(id===8)h=mix(h,15+rel*1050,blend);
 return h;
}
export function isDryLand(index,x,z){const id=getStage(index).id;return !(id===7&&terrainHeight(id,x,z)<9)&&!(id===2&&x<340)&&!(id===4&&(x<90||z>1730));}

const COLLECTION_SITES={
 1:[[350,900],[700,850],[1250,520],[1350,1320],[2100,700],[2600,1450]],
 2:[[350,900],[800,850],[1300,750],[1800,600],[2100,1220],[2600,1450]],
 3:[[350,900],[700,1150],[1100,650],[1380,1400],[2280,1550],[2600,1450]],
 4:[[350,900],[480,650],[980,1380],[1600,1400],[2320,1000],[2600,1450]],
 5:[[350,900],[650,1000],[1100,900],[1250,450],[2270,1600],[2600,1450]],
 6:[[350,900],[700,650],[1250,1250],[1700,450],[2200,1000],[2600,1450]],
 7:[[350,900],[780,650],[1230,1250],[1720,660],[2170,1000],[2600,1450]],
 8:[[350,900],[750,500],[1300,1250],[1720,700],[2240,1350],[2600,1450]],
 9:[[350,900],[850,700],[1380,900],[1540,1020],[1620,810],[2600,1450]]
};
export function getTargetSites(index){return COLLECTION_SITES[getStage(index).id].map(([x,z])=>({x:getStage(index).id>=6&&getStage(index).id<=8?1400+(x-1400)*1.65:x,z:getStage(index).id>=6&&getStage(index).id<=8?900+(z-900)*1.65:z}));}
function clearingWeight(index,x,z){let value=0;const id=getStage(index).id;for(const [sx,sz]of COLLECTION_SITES[id])value=Math.max(value,1-smooth(65,180,Math.hypot(x-sx,z-sz)));if(id===9)value=Math.max(value,1-smooth(150,260,Math.hypot(x-1500,z-900)));return value;}
function footprint(x,z,cx,cz,hx,hz,margin=38){return Math.abs(x-cx)<hx+margin&&Math.abs(z-cz)<hz+margin;}
function scenerySite(index,x,z){
 const id=getStage(index).id;
 const expanded=id>=6&&id<=8;if(!isDryLand(id,x,z)||x<(expanded?-1300:120)||x>(expanded?4200:2680)||z<(expanded?-850:140)||z>(expanded?2700:1680))return false;
 if(id===1){for(const [bx,bz]of [[950,440],[2210,1250],[240,1600]])if(Math.hypot(x-bx,z-bz)<180)return false;for(const fz of [280,660,1040,1420])if(x>130&&x<2640&&Math.abs(z-fz)<22)return false;}
 if(id===2){for(let i=0;i<5;i++)if(footprint(x,z,700+i*160,1230+i%2*150,45,45,42))return false;if(footprint(x,z,2400,330,35,35,40))return false;}
 if(id===3){for(let i=0;i<3;i++)if(footprint(x,z,2100,330+i*330,100,123,45))return false;if(footprint(x,z,2310,1350,40,40,48))return false;if(z<1590&&Math.abs(x-1920)<25)return false;}
 if(id===4){if(footprint(x,z,1250,832,555,330,55))return false;if(footprint(x,z,2190,240,500,155,45))return false;for(const cx of [500,1280,2060])if(footprint(x,z,cx,1750,100,105,30))return false;for(let i=0;i<12;i++)if(Math.hypot(x-(200+i*230),z-1580)<22)return false;}
 if(id===5){for(let i=0;i<3;i++)if(footprint(x,z,1920,360+i*350,90,113,42))return false;for(const [bx,bz]of [[640,350],[2390,1200]])if(Math.hypot(x-bx,z-bz)<93)return false;for(let i=0;i<4;i++)if(footprint(x,z,600+i*230,1420,80,46,38))return false;if(z<1545&&Math.abs(x-2150)<25)return false;}
 if(id===6){for(const [a,b]of [[950,420],[1980,1240]])if(footprint(x,z,a,b,200,150,40))return false;}
 if(id===7){if((z>90&&z<215||z>1580&&z<1770)&&x>100&&x<2700)return false;for(const [a,b]of [[970,360],[1820,1420],[2360,560]])if(footprint(x,z,a,b,145,120,45))return false;}
 if(id===8){if(footprint(x,z,1400,350,650,180,40))return false;for(const [a,b]of [[800,1420],[2100,700]])if(footprint(x,z,a,b,130,110,40))return false;}
 if(id===9){if(Math.hypot(x-1500,z-900)<67)return false;for(const [cx,cz]of [[1080,1240],[1300,1270],[2070,730]])if(footprint(x,z,cx,cz,70,50,38))return false;}
 return true;
}
const treeLayoutCache=new Map();
function treeLayout(index){const stage=getStage(index);if(treeLayoutCache.has(stage.id))return treeLayoutCache.get(stage.id);if([3,4,6,7,8].includes(stage.id))return [];
 const r=rand(stage.seed),count=stage.id===2?560:stage.id===5?225:stage.id===9?430:310,trees=[];
 for(let i=0;i<count;i++){
  let x=-1800+r()*6100,z=-1200+r()*4300;const playable=x>60&&x<2740&&z>80&&z<1720;
  if(playable){if(stage.id===1){if(i%6!==0)x=r()<.5?20:2850;}else if(stage.id===2){if(x>550&&x<2000&&z>350&&z<1500)x=r()<.5?250+r()*250:2350+r()*340;}else if(stage.id===5)x=r()<.5?120+r()*150:2800+r()*300;}
  if(!isDryLand(stage.id,x,z))x=350+r()*160;
  // Clearings are reserved before physics spawns any specimen or crew member.
  if(clearingWeight(stage.id,x,z)>.02){x=2860+r()*330;}
  const scale=.65+r()*.9,angle=r()*6.28,rx=(r()-.5)*.05,rz=(r()-.5)*.05,sy=.9+r()*.2;
  trees.push({x,z,scale,angle,rx,rz,sy});
 }
 treeLayoutCache.set(stage.id,trees);return trees;
}
export function isTargetSite(index,x,z){if(!scenerySite(index,x,z))return false;for(const t of treeLayout(index))if(Math.hypot(x-t.x,z-t.z)<t.scale*25+21)return false;return true;}

const textureCache=new Map();let generatedBiome;function generatedTerrain(){if(!generatedBiome){generatedBiome=new T.TextureLoader().load('./assets/generated/biome-surfaces.png');generatedBiome.colorSpace=T.SRGBColorSpace;generatedBiome.anisotropy=8;}return generatedBiome;}
const texturePaths={grass:['grass.jpg','grass-normal.jpg'],forest:['terrain/forrest_sand_01-diff.jpg','terrain/forrest_sand_01-nor_gl.jpg'],sand:['terrain/aerial_sand-diff.jpg','terrain/aerial_sand-nor_gl.jpg'],snow:['terrain/snow_field_aerial-col.jpg','terrain/snow_field_aerial-nor_gl.jpg'],rock:['terrain/aerial_rocks_02-diff.jpg','terrain/aerial_rocks_02-nor_gl.jpg'],asphalt:['terrain/asphalt_02-diff.jpg','terrain/asphalt_02-nor_gl.jpg']};
let activeTextureQuality='native';
const textureNames={grass:['aerial_grass_rock','diff'],forest:['forrest_sand_01','diff'],sand:['aerial_sand','diff'],snow:['snow_field_aerial','col'],rock:['aerial_rocks_02','diff'],asphalt:['asphalt_02','diff']};
function qualityMode(value){return value==='ultra'?'ultra':value==='auto'||value==='performance'?'auto':'native';}
function texture(kind,normal=false,quality=activeTextureQuality){
 const mode=qualityMode(quality),resolution=normal?(mode==='auto'?'1k':'2k'):'4k',key=kind+':'+normal+':'+mode;
 if(!textureCache.has(key)){
  const [name,diff]=textureNames[kind],fallback='./assets/'+texturePaths[kind][normal?1:0],url=resolution==='1k'?fallback:`./assets/terrain/${name}-${normal?'nor_gl':diff}-${resolution}.jpg`,loader=new T.TextureLoader();
  const notify=loaded=>{for(const clone of loaded.userData.pending||[])clone.needsUpdate=true;loaded.userData.pending=[];};
  const tx=loader.load(url,notify,undefined,()=>{if(url!==fallback)loader.load(fallback,loaded=>{tx.image=loaded.image;tx.needsUpdate=true;notify(tx);loaded.dispose();});});
  tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.anisotropy=mode==='auto'?4:16;if(!normal)tx.colorSpace=T.SRGBColorSpace;tx.userData.sourceUrl=url;tx.userData.quality=mode;textureCache.set(key,tx);
 }
 return textureCache.get(key);
}
function cloneSurfaceMap(kind,normal=false,quality=activeTextureQuality){const base=texture(kind,normal,quality),copy=new T.Texture();copy.source=base.source;copy.colorSpace=base.colorSpace;copy.wrapS=copy.wrapT=T.RepeatWrapping;copy.anisotropy=base.anisotropy;copy.userData.sourceUrl=base.userData.sourceUrl;copy.userData.quality=base.userData.quality;if(base.image?.width)copy.needsUpdate=true;else{base.userData.pending??=[];base.userData.pending.push(copy);}return copy;}
function surface(kind,color,tile=50,roughness=.98,quality=activeTextureQuality){const map=cloneSurfaceMap(kind,false,quality),normalMap=cloneSurfaceMap(kind,true,quality);map.repeat.set(tile,tile);normalMap.repeat.set(tile,tile);return new T.MeshStandardMaterial({map,normalMap,normalScale:new T.Vector2(.62,.62),color,roughness,metalness:0});}
function mesh(geo,mat,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,w,h,d,mat,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),mat,parent,x,y,z);}
function cylinder(parent,r1,r2,h,mat,x=0,y=0,z=0,n=12){return mesh(new T.CylinderGeometry(r1,r2,h,n),mat,parent,x,y,z);}
function line(parent,a,b,r,mat){const start=new T.Vector3(...a),end=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,start.distanceTo(end),5),mat,parent);o.position.copy(start.clone().add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return o;}
function buildMerged(parent){parent.updateMatrixWorld(true);const batches=new Map(),old=[];parent.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.userData.noBatch||o.material.isShaderMaterial||Array.isArray(o.material))return;let b=batches.get(o.material.uuid);if(!b){b={material:o.material,p:[],n:[],u:[],c:[],hasColor:false,cast:false};batches.set(o.material.uuid,b);}const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv,ca=g.attributes.color,normalMatrix=new T.Matrix3().getNormalMatrix(o.matrixWorld),v=new T.Vector3(),n=new T.Vector3();for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);n.fromBufferAttribute(na,i).applyMatrix3(normalMatrix).normalize();b.p.push(v.x,v.y,v.z);b.n.push(n.x,n.y,n.z);b.u.push(ua?ua.getX(i):0,ua?ua.getY(i):0);b.c.push(ca?ca.getX(i):1,ca?ca.getY(i):1,ca?ca.getZ(i):1);}b.hasColor||=!!ca;b.cast||=o.castShadow;old.push(o);});for(const o of old){o.parent.remove(o);o.geometry.dispose();}for(const b of batches.values()){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.u,2));if(b.hasColor)geo.setAttribute('color',new T.Float32BufferAttribute(b.c,3));const o=mesh(geo,b.material,parent);o.castShadow=b.cast;}}

function addSky(group,config){
 const sky=mesh(new T.SphereGeometry(5800,32,18),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(config.skyColor)},horizon:{value:new T.Color(config.skyHorizon)},sunColor:{value:new T.Color(config.sunColor)},sunDirection:{value:new T.Vector3(...config.sunDirection).normalize()},clouds:{value:config.clouds}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDirection;uniform vec3 top;uniform vec3 horizon;uniform vec3 sunColor;uniform vec3 sunDirection;uniform float clouds;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}float fbm(vec2 p){return .5*n(p)+.25*n(p*2.03)+.125*n(p*4.17)+.0625*n(p*8.1);}
 void main(){vec3 dir=normalize(vDirection);float h=max(0.,dir.y);vec3 col=mix(horizon,top,smoothstep(0.,.72,h));float sun=pow(max(0.,dot(dir,sunDirection)),32.);col+=sunColor*sun*.14*(1.-clouds*.8);vec2 p=dir.xz/max(.13,dir.y+.15)*2.7;float cloud=smoothstep(.45-clouds*.22,.69-clouds*.19,fbm(p+vec2(3.1,2.7)));cloud*=smoothstep(.005,.15,h);vec3 cloudColor=mix(horizon*.96,top*.49,clouds);col=mix(col,cloudColor,cloud*(.3+clouds*.6));gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`}),group,1400,0,900);sky.castShadow=sky.receiveShadow=false;sky.userData.noBatch=true;return sky;
}
function addTerrain(group,stage){
 const segments=stage.quality==='ultra'?[320,264]:stage.quality==='auto'?[188,156]:[235,195];const geo=new T.PlaneGeometry(9400,7800,...segments);geo.rotateX(-Math.PI/2);geo.translate(1400,0,900);const p=geo.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,terrainHeight(stage.id,x,z));const macro=fbm(x*.004,z*.004,stage.seed),shade=mix(.76+macro*.31,.94,clearingWeight(stage.id,x,z)*.68);colors.push(shade,shade*(stage.id===3?.96:1.015),shade*(stage.id===1?.91:1.01));}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const mat=surface(stage.ground,stage.groundTint,stage.id===4?115:stage.id===9?105:125,stage.id===4?.48:stage.id===6?.72:.97,stage.quality);mat.vertexColors=true;
 // Blend a second scanned rock surface on steep slopes and high ridges.
 mat.onBeforeCompile=shader=>{
 shader.uniforms.rockNormalMap={value:texture('rock',true,stage.quality)};shader.uniforms.sandMap={value:texture('sand',false,stage.quality)};shader.uniforms.rockMap={value:texture('rock',false,stage.quality)};shader.uniforms.rockTint={value:new T.Color(stage.rockTint)};
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 terrainWorld;varying vec3 terrainGeomNormal;varying float terrainSlope;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nterrainWorld=(modelMatrix*vec4(transformed,1.)).xyz;terrainSlope=1.-abs(normal.y);terrainGeomNormal=normalize((modelMatrix*vec4(normal,0.)).xyz);');
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
 uniform sampler2D rockNormalMap;uniform sampler2D sandMap;uniform sampler2D rockMap;uniform vec3 rockTint;varying vec3 terrainWorld;varying vec3 terrainGeomNormal;varying float terrainSlope;
 vec2 tileHash(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
 float terrainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(tileHash(i).x,tileHash(i+vec2(1.,0.)).x,f.x),mix(tileHash(i+vec2(0.,1.)).x,tileHash(i+vec2(1.,1.)).x,f.x),f.y);}
 vec4 untiled(sampler2D tex,vec2 uv){vec2 q=uv*.19,i=floor(q),f=smoothstep(.12,.88,fract(q));return mix(mix(texture2D(tex,uv+tileHash(i)*29.),texture2D(tex,uv+tileHash(i+vec2(1.,0.))*29.),f.x),mix(texture2D(tex,uv+tileHash(i+vec2(0.,1.))*29.),texture2D(tex,uv+tileHash(i+vec2(1.,1.))*29.),f.x),f.y);}
 `).replace('#include <map_fragment>',`diffuseColor*=untiled(map,vMapUv);
 vec3 detailColor=untiled(map,vMapUv*3.7).rgb;diffuseColor.rgb*=mix(vec3(.85),clamp(detailColor*1.7,vec3(.65),vec3(1.2)),.28);float rockMix=smoothstep(.11,.42,terrainSlope);${stage.id===3?'rockMix=max(rockMix,smoothstep(180.,600.,terrainWorld.y)*.85);':stage.id===2?'rockMix=max(rockMix,smoothstep(220.,700.,terrainWorld.y)*.85);':''}
 if(rockMix>.02){vec3 triWeight=pow(abs(terrainGeomNormal),vec3(4.));triWeight/=max(.001,triWeight.x+triWeight.y+triWeight.z);vec3 rock=(untiled(rockMap,terrainWorld.yz*.011).rgb*triWeight.x+untiled(rockMap,terrainWorld.xz*.011).rgb*triWeight.y+untiled(rockMap,terrainWorld.xy*.011).rgb*triWeight.z)*rockTint;diffuseColor.rgb=mix(diffuseColor.rgb,rock,rockMix*.9);}float landCover=terrainNoise(terrainWorld.xz*.003)*.6+terrainNoise(terrainWorld.xz*.009)*.4;diffuseColor.rgb*=mix(vec3(.70,.76,.72),vec3(1.13,1.08,.96),smoothstep(.16,.83,landCover));
 ${stage.id===7?'float beach=1.-smoothstep(13.,40.,terrainWorld.y);vec3 sand=untiled(sandMap,terrainWorld.xz*.013).rgb*vec3(1.18,1.15,1.03);diffuseColor.rgb=mix(diffuseColor.rgb,sand,beach);':''}
 ${stage.id===6?'float mineral=sin(terrainWorld.x*.007+sin(terrainWorld.z*.009)*1.4)*.5+.5;diffuseColor.rgb*=mix(vec3(.73,.77,.76),vec3(.99,.93,.77),mineral*.6);':''}
 ${stage.id===8?'vec2 cell=terrainWorld.xz*.10;vec2 ci=floor(cell);vec2 cf=fract(cell);float f1=10.,f2=10.;for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));float dd=length(o+tileHash(ci+o)-cf);if(dd<f1){f2=f1;f1=dd;}else f2=min(f2,dd);}}float edge=1.-smoothstep(.015,.055,f2-f1);float salt=1.-smoothstep(26.,85.,terrainWorld.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.77,.72)*(1.-edge*.23)+diffuseColor.rgb*.12,salt);':''}
 `).replace('#include <normal_fragment_maps>',`#ifdef USE_NORMALMAP_TANGENTSPACE\nvec3 mapN=untiled(normalMap,vNormalMapUv).xyz;if(terrainSlope>.11)mapN=mix(mapN,untiled(rockNormalMap,terrainWorld.xz*.011).xyz,smoothstep(.11,.42,terrainSlope)*.9);mapN=mapN*2.-1.;mapN.xy*=normalScale;normal=normalize(tbn*mapN);\n#endif`).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(untiled(map,vMapUv).g-.4)*.15,.28,1.);`);
 };mat.customProgramCacheKey=()=>`terrain-${stage.id}-${stage.quality}-v4-nine-worlds`;const t=mesh(geo,mat,group);t.castShadow=false;t.userData.noBatch=true;
}
function addWater(group,stage){
 if(stage.id!==2&&stage.id!==4&&stage.id!==7)return;
 const mat=new T.MeshStandardMaterial({color:stage.waterColor,metalness:0,envMapIntensity:.32,roughness:stage.id===4?.28:.24,transparent:true,opacity:.93,normalMap:texture('rock',true),normalScale:new T.Vector2(.22,.12)});mat.normalMap=cloneSurfaceMap('rock',true);mat.normalMap.repeat.set(60,60);
 if(stage.id===7){const g=new T.PlaneGeometry(9400,7800,80,64);g.rotateX(-Math.PI/2);const water=mesh(g,mat,group,1400,0,900);water.castShadow=false;water.userData.noBatch=true;water.userData.water=true;}
 else if(stage.id===2){const g=new T.PlaneGeometry(2300,5400,18,24);g.rotateX(-Math.PI/2);const w=mesh(g,mat,group,-850,11,1050);w.userData.noBatch=true;w.castShadow=false;}
 else {for(const [w,d,x,z]of [[9200,2900,1400,3250],[2700,5000,-1400,1200]]){const g=new T.PlaneGeometry(w,d,8,8);g.rotateX(-Math.PI/2);const m=mesh(g,mat,group,x,1.5,z);m.castShadow=false;m.userData.noBatch=true;}}
}

function pineGeometry(seed=1){
 const r=rand(seed),pos=[],col=[],uv=[];function tri(a,b,c,color){for(const [i,p]of [a,b,c].entries()){pos.push(...p);col.push(...color);uv.push(i===0?0:i===1?1:.5,i===2?1:0);}}
 // Slender, irregular branches with separate needle sprays give the crown an
 // open silhouette, avoiding the solid cones and round blobs of stylized trees.
 for(let layer=0;layer<13;layer++){const y=16+layer*5.2,reach=(1-layer/15)*22,branches=6+layer%3;for(let b=0;b<branches;b++){const a=b/branches*Math.PI*2+layer*.91+r()*.4,len=reach*(.65+r()*.45),shade=.72+r()*.32,c=[.095*shade,.18*shade,.135*shade];for(let q=0;q<7;q++){const t=(q+1)/8,d=len*t,w=(1-t)*6+1.5,base=[Math.sin(a)*d,y-3*t,Math.cos(a)*d],tip=[Math.sin(a)*(d+len*.15),y-2.2*t,Math.cos(a)*(d+len*.15)],left=[base[0]+Math.cos(a)*w,base[1]-.3,base[2]-Math.sin(a)*w],right=[base[0]-Math.cos(a)*w,base[1]+.2,base[2]+Math.sin(a)*w];tri(base,left,tip,c);tri(base,tip,right,c);tri(left,[base[0],base[1]+2.1,base[2]],tip,c);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function addTrees(group,stage){
 const trees=treeLayout(stage.id);if(!trees.length)return;const count=trees.length,leafMaterial=foliageMaterial(stage.id),trunkMat=new T.MeshStandardMaterial({color:'#51473c',roughness:1}),leaves=new T.InstancedMesh(foliageGeometry(),leafMaterial,count),trunks=new T.InstancedMesh(new T.CylinderGeometry(.9,2.9,62,6),trunkMat,count),dummy=new T.Object3D();
 for(const [i,t]of trees.entries()){const y=terrainHeight(stage.id,t.x,t.z);dummy.position.set(t.x,y,t.z);dummy.rotation.set(t.rx,t.angle,t.rz);dummy.scale.set(t.scale,t.scale*t.sy,t.scale);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);dummy.position.y=y+29*t.scale;dummy.scale.set(t.scale,t.scale,t.scale);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);}
 leaves.customDepthMaterial=foliageDepth();leaves.castShadow=trunks.castShadow=true;leaves.receiveShadow=trunks.receiveShadow=true;group.add(leaves,trunks);
}
function addRocks(group,stage){const r=rand(stage.seed+20),count=stage.id===4?40:150,rock=surface('rock',stage.rockTint,1,1),g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=.75+noise(x*4+9,z*4+y*2,stage.id)*.4;p.setXYZ(i,x*v,y*v,z*v);}g.computeVertexNormals();const inst=new T.InstancedMesh(g,rock,count),d=new T.Object3D();for(let i=0;i<count;i++){let x=-800+r()*4300,z=-800+r()*3200;if(x>150&&x<2680&&z>150&&z<1650){x=i%2?35:2850;}if(stage.id>=6&&stage.id<=8&&x>-1400&&x<4300&&z>-950&&z<2800)x=i%2?-1800-r()*500:4600+r()*500;const s=stage.id===8?4+r()*12:5+r()**2*35;d.position.set(x,terrainHeight(stage.id,x,z)+s*.2,z);d.rotation.set(r()*1.3,r()*6,r()*.6);d.scale.set(s*(1+r()),s*(.4+r()*.8),s*(.7+r()));d.updateMatrix();inst.setMatrixAt(i,d.matrix);}inst.castShadow=inst.receiveShadow=true;group.add(inst);}
function road(group,stage,points,width,mat){const p=[],uv=[],ind=[];for(let i=0;i<points.length;i++){const [x,z]=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz),nx=-dz/len*width/2,nz=dx/len*width/2;for(const side of [-1,1]){const xx=x+nx*side,zz=z+nz*side;p.push(xx,terrainHeight(stage.id,xx,zz)+.65,zz);uv.push(side===-1?0:1,i*2);}if(i<points.length-1){const a=i*2;ind.push(a,a+2,a+1,a+1,a+2,a+3);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();const m=mesh(g,mat,group);m.castShadow=false;}
function building(group,stage,x,z,w,h,d,mat,roof,rot=0){const g=new T.Group();g.position.set(x,terrainHeight(stage.id,x,z),z);g.rotation.y=rot;group.add(g);box(g,w,h,d,mat,0,h/2,0);box(g,w+5,3,d+5,roof,0,h+1,0);return g;}
function fence(group,stage,x,z,length,axis='x',metal=false){const mat=new T.MeshStandardMaterial({color:metal?'#737f81':'#635d4c',roughness:.93,metalness:metal?.5:0}),posts=Math.floor(length/35);for(let i=0;i<=posts;i++){const xx=x+(axis==='x'?i*35:0),zz=z+(axis==='z'?i*35:0),y=terrainHeight(stage.id,xx,zz);cylinder(group,metal?.7:1.3,metal?.7:1.5,metal?25:20,mat,xx,y+10,zz,5);if(i<posts)for(const h of [8,16]){const nx=xx+(axis==='x'?35:0),nz=zz+(axis==='z'?35:0);line(group,[xx,y+h,zz],[nx,terrainHeight(stage.id,nx,nz)+h,nz],metal?.19:.55,mat);}}}
function runway(group,stage,x,z,length=1250,width=115){const asphalt=surface('asphalt','#a2a6a7',8,.77);road(group,stage,[[x,z-length/2],[x,z-length/4],[x,z],[x,z+length/4],[x,z+length/2]],width,asphalt);const paint=new T.MeshStandardMaterial({color:'#d5d4c5',roughness:1});for(let k=-length/2+30;k<length/2;k+=75){const yy=terrainHeight(stage.id,x,z+k);box(group,2,.2,34,paint,x,yy+1.2,z+k);for(const side of [-1,1]){box(group,1.2,.2,60,paint,x+side*(width/2-7),terrainHeight(stage.id,x+side*(width/2-7),z+k)+1.2,z+k);}}}
function barn(group,stage,x,z,rot=0){const walls=new T.MeshStandardMaterial({color:'#716458',roughness:.97}),roof=new T.MeshStandardMaterial({color:'#717c7b',roughness:.75,metalness:.4}),timber=new T.MeshStandardMaterial({color:'#403d34',roughness:1}),g=building(group,stage,x,z,115,58,155,walls,timber,rot);for(const a of [-1,1]){const slab=box(g,68,2.5,168,roof,a*28,73,0);slab.rotation.z=-a*.47;}for(let j=0;j<14;j++){box(g,1,57,156,timber,-53+j*8,29,0);}box(g,45,44,1.5,timber,0,22,79);const silo=new T.MeshStandardMaterial({color:'#92958d',roughness:.55,metalness:.65});cylinder(g,22,22,91,silo,99,45,-30,24);mesh(new T.ConeGeometry(23,17,24),roof,g,99,99,-30);for(let j=0;j<6;j++)cylinder(g,22.4,22.4,.8,roof,99,8+j*15,-30,24);}
function powerline(group,stage,x,z,n=9){const timber=new T.MeshStandardMaterial({color:'#4a443b',roughness:1}),wire=new T.MeshStandardMaterial({color:'#232b2d',roughness:.75,metalness:.5});for(let i=0;i<n;i++){const xx=x+i*280,y=terrainHeight(stage.id,xx,z);cylinder(group,1.6,2.9,105,timber,xx,y+52,z,6);box(group,32,2.5,3,timber,xx,y+99,z);if(i<n-1)for(const side of [-1,1]){const next=terrainHeight(stage.id,xx+280,z);const c=new T.QuadraticBezierCurve3(new T.Vector3(xx,y+99,z+side*13),new T.Vector3(xx+140,(y+next)/2+79,z+side*13),new T.Vector3(xx+280,next+99,z+side*13));mesh(new T.TubeGeometry(c,10,.32,3),wire,group);}}}
function rural(group,s){const dirt=surface('sand','#777869',5,1);road(group,s,[[-180,1220],[450,1230],[1050,1200],[1700,1160],[2300,1210],[3100,1230]],43,dirt);road(group,s,[[1700,-100],[1690,500],[1700,1160],[1750,1900]],27,dirt);barn(group,s,900,440,.15);barn(group,s,2160,1250,-.25);barn(group,s,210,1600,.62);for(let j=0;j<4;j++)fence(group,s,160,280+j*380,2450);powerline(group,s,-50,1260);const fieldMat=[surface('grass','#a7ad80',6),surface('grass','#828c65',7)];for(let k=0;k<6;k++){const x=520+k%3*820,z=420+Math.floor(k/3)*850,g=new T.PlaneGeometry(640,510,14,11);g.rotateX(-Math.PI/2);g.translate(x,0,z);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(s.id,p.getX(i),p.getZ(i))+.25);g.computeVertexNormals();const m=mesh(g,fieldMat[k%2],group);m.castShadow=false;}}
function alpine(group,s){const gravel=surface('sand','#8c958f',4,1),wood=new T.MeshStandardMaterial({color:'#655a47',roughness:1}),roof=new T.MeshStandardMaterial({color:'#576265',roughness:.76,metalness:.5});road(group,s,[[380,-100],[520,350],[700,700],[980,1100],[1750,1300],[2850,1340]],38,gravel);for(let k=0;k<5;k++){const x=700+k*160,z=1230+(k%2)*150,g=building(group,s,x,z,75,36,60,wood,roof,k*.17);for(const a of [-1,1]){const r=box(g,47,2,73,roof,a*19,48,0);r.rotation.z=-a*.5;}const window=new T.MeshStandardMaterial({color:'#d4c7a9',emissive:'#d6ac72',emissiveIntensity:.18,roughness:.3});box(g,18,15,1,window,21,23,31);}const dock=new T.MeshStandardMaterial({color:'#736f60',roughness:.8});for(let i=0;i<16;i++){const x=40-i*10;box(group,9,2,57,dock,x,18,1000);for(const zz of [980,1020])cylinder(group,1.5,2.5,30,wood,x,3,zz,6);}const tower=building(group,s,2400,330,30,76,30,wood,roof);box(tower,57,4,57,wood,0,78,0);box(tower,43,24,43,roof,0,91,0);}
function hangar(group,s,x,z,w=180,d=210,snow=false){const concrete=new T.MeshStandardMaterial({color:snow?'#8a969f':'#a6a89e',roughness:.93}),steel=new T.MeshStandardMaterial({color:'#647078',metalness:.55,roughness:.61});const g=building(group,s,x,z,w,59,d,concrete,steel);for(let i=0;i<10;i++)box(g,w-9,4,1.5,steel,0,6+i*5,d/2+1);for(let i=0;i<11;i++)box(g,1,58,d+3,steel,-w/2+5+i*(w-10)/10,29,0);if(snow)box(g,w+3,2.5,d+3,new T.MeshStandardMaterial({color:'#dde6eb',roughness:.96}),0,63,0);return g;}
function desert(group,s){runway(group,s,1720,870,1400,128);const concrete=new T.MeshStandardMaterial({color:'#aaa596',roughness:.96}),steel=new T.MeshStandardMaterial({color:'#758286',roughness:.7,metalness:.5});for(let i=0;i<3;i++)hangar(group,s,2100,330+i*330,195,240);const tower=building(group,s,2310,1350,43,129,40,concrete,steel);box(tower,66,26,62,steel,0,131,0);const glass=new T.MeshStandardMaterial({color:'#385665',metalness:.45,roughness:.18});for(const a of [-1,1])box(tower,59,16,1,glass,0,132,a*31.1);box(tower,72,3,69,concrete,0,147,0);cylinder(tower,.7,1.5,36,steel,0,167,0,6);road(group,s,[[1950,-50],[1950,900],[2110,1600],[3000,1600]],39,surface('asphalt','#939589',8,.9));fence(group,s,1920,80,1490,'z',true);for(let i=0;i<13;i++){const r=12+(i%4)*4;const g=new T.Group();g.position.set(180+i*117,terrainHeight(s.id,180+i*117,130),130);group.add(g);mesh(new T.DodecahedronGeometry(r,1),surface('rock','#a78a6c',1),g,0,r*.5,0);}}
function harbor(group,s){const wet=surface('asphalt','#7b8990',10,.36),concrete=new T.MeshStandardMaterial({color:'#8e999c',roughness:.74}),steel=new T.MeshStandardMaterial({color:'#515e65',roughness:.58,metalness:.7}),red=new T.MeshStandardMaterial({color:'#805c48',roughness:.85,metalness:.45}),containers=[new T.MeshStandardMaterial({color:'#475e64',roughness:.73,metalness:.5}),new T.MeshStandardMaterial({color:'#7b6851',roughness:.78,metalness:.4}),new T.MeshStandardMaterial({color:'#6b7375',roughness:.83,metalness:.4})];road(group,s,[[120,1510],[900,1500],[1700,1510],[2800,1510]],100,wet);road(group,s,[[300,-100],[300,800],[380,1500]],70,wet);for(let i=0;i<4;i++)building(group,s,1800+i*260,240,185,75,300,concrete,steel);for(let k=0;k<54;k++){const x=750+k%9*126,z=520+Math.floor(k/9)*125,y=terrainHeight(s.id,x,z);const g=new T.Group();g.position.set(x,y,z);group.add(g);const stacks=1+(k%3===0?1:0);for(let j=0;j<stacks;j++){box(g,94,37,41,containers[k%3],0,19+j*38,0);for(let c=0;c<11;c++)box(g,1.6,34,43,steel,-44+c*8.8,19+j*38,0);}}
 for(let i=0;i<3;i++){const x=500+i*780,z=1700,y=terrainHeight(s.id,x,z),g=new T.Group();g.position.set(x,y,z);group.add(g);for(const a of [-1,1]){box(g,9,168,12,red,a*65,84,0);line(g,[a*65,0,0],[a*34,162,0],3.5,red);}box(g,170,14,18,red,0,170,0);box(g,14,12,260,red,0,184,75);line(g,[0,202,0],[0,185,192],1,steel);line(g,[0,184,180],[0,46,180],.4,steel);box(g,30,8,12,steel,0,42,180);box(group,200,18,330,concrete,x,1,1860);}
 for(let i=0;i<12;i++){const x=200+i*230,z=1580,y=terrainHeight(s.id,x,z);cylinder(group,.8,2,92,steel,x,y+46,z,7);box(group,24,2,8,steel,x,y+91,z);box(group,22,.8,7,new T.MeshStandardMaterial({color:'#f2dfb8',emissive:'#ffd9a0',emissiveIntensity:.5}),x,y+89,z);}powerline(group,s,200,350,8);
 // A low profile cargo ship moored beyond the safe land boundary.
 const ship=new T.Group();ship.position.set(1630,4,2200);group.add(ship);box(ship,125,49,450,new T.MeshStandardMaterial({color:'#29383e',roughness:.76,metalness:.4}),0,8,0);box(ship,118,5,435,steel,0,35,0);for(let i=0;i<15;i++)box(ship,40,32,83,containers[i%3],-41+i%3*41,54+Math.floor(i/9)*32,-130+Math.floor(i%9/3)*86);box(ship,93,55,65,concrete,0,62,169);box(ship,100,15,68,steel,0,95,169);}
function arctic(group,s){runway(group,s,1530,800,1300,110);for(let k=0;k<3;k++)hangar(group,s,1920,360+k*350,175,220,true);const concrete=new T.MeshStandardMaterial({color:'#808d95',roughness:.89}),steel=new T.MeshStandardMaterial({color:'#65747f',roughness:.64,metalness:.5}),snow=new T.MeshStandardMaterial({color:'#e1e8eb',roughness:.91});for(const [x,z]of [[640,350],[2390,1200]]){const g=building(group,s,x,z,85,32,85,concrete,steel);const dome=mesh(new T.SphereGeometry(43,20,12,0,Math.PI*2,0,Math.PI*.52),snow,g,0,38,0);for(let j=0;j<4;j++)box(g,92,2,5,steel,0,36,j*15-22);cylinder(g,1,1.5,80,steel,63,40,0,6);line(g,[63,80,0],[31,0,26],.4,steel);line(g,[63,80,0],[95,0,26],.4,steel);}
 road(group,s,[[800,-100],[780,500],[950,1200],[2200,1500],[2950,1500]],43,surface('asphalt','#adb7bc',10,.78));fence(group,s,2150,100,1420,'z',true);for(let i=0;i<4;i++){const g=building(group,s,600+i*230,1420,155,37,85,concrete,steel);box(g,160,4,90,snow,0,41,0);}for(let i=0;i<7;i++){const x=380+i*340,z=1700,y=terrainHeight(s.id,x,z);cylinder(group,1,2,100,steel,x,y+50,z,6);for(const side of [-1,1]){const b=box(group,20,1,8,steel,x+side*10,y+100,z);b.rotation.z=side*.15;}}}


function fallenSignal(group,s){
 const rock=surface('rock','#555f5e',4,1,s.quality),scorch=new T.MeshStandardMaterial({color:'#202926',roughness:1,transparent:true,opacity:.52,depthWrite:false}),metalMap=new T.TextureLoader().load('./assets/generated/aerospace-metal.png');metalMap.colorSpace=T.SRGBColorSpace;metalMap.wrapS=metalMap.wrapT=T.RepeatWrapping;
 const skin=new T.MeshStandardMaterial({color:'#9bacae',map:metalMap,roughness:.52,metalness:.78}),dark=new T.MeshStandardMaterial({color:'#25313a',roughness:.75,metalness:.62}),violet=new T.MeshStandardMaterial({color:'#d1a1ff',emissive:'#8f4fda',emissiveIntensity:2.5,roughness:.4}),army=new T.MeshStandardMaterial({color:'#596353',roughness:.96}),canvas=new T.MeshStandardMaterial({color:'#74806a',roughness:1});
 const scar=new T.RingGeometry(42,265,72,7);scar.rotateX(-Math.PI/2);const p=scar.attributes.position;for(let i=0;i<p.count;i++){const ox=p.getX(i),oz=p.getZ(i),irregular=.88+noise(ox*.015+4,oz*.015+7,6)*.27,x=ox*irregular+1500,z=oz*irregular+900;p.setXYZ(i,x,terrainHeight(s.id,x,z)+.32,z);}scar.computeVertexNormals();const scorched=mesh(scar,scorch,group);scorched.castShadow=false;
 const crash=new T.Group();crash.position.set(1500,terrainHeight(s.id,1500,900)-3,900);crash.rotation.set(.13,.48,-.21);group.add(crash);
 const profile=[[0,-8],[16,-8],[35,-5],[54,0],[51,4],[32,9],[18,13],[0,13]].map(a=>new T.Vector2(...a));mesh(new T.LatheGeometry(profile,64,0,Math.PI*1.78),skin,crash);
 const dome=mesh(new T.SphereGeometry(18,24,12,0,Math.PI*1.85,0,Math.PI*.51),new T.MeshStandardMaterial({color:'#273f4a',roughness:.15,metalness:.5}),crash,0,11,0);dome.rotation.z=.08;
 for(let i=0;i<11;i++){const a=i/12*Math.PI*2;box(crash,7,1.4,3,i%3===0?violet:dark,Math.cos(a)*44,3,Math.sin(a)*44).rotation.y=-a;}
 for(let i=0;i<9;i++){const a=i*.91,rr=70+i*6,x=1500+Math.cos(a)*rr,z=900+Math.sin(a)*rr;const shard=box(group,13+i%3*8,2,19,skin,x,terrainHeight(s.id,x,z)+2,z);shard.rotation.set(.2,a,.07*i);}
 const emergency=new T.PointLight('#c88aff',6500,260,1.8);emergency.position.set(1500,terrainHeight(s.id,1500,900)+18,900);group.add(emergency);
 for(const [x,z]of [[1080,1240],[1300,1270],[2070,730]]){const camp=building(group,s,x,z,108,27,75,army,dark);for(const side of [-1,1]){const roof=box(camp,65,2,86,canvas,side*27,39,0);roof.rotation.z=-side*.42;}box(camp,24,23,1,dark,0,11,38);}
 road(group,s,[[600,1650],[1050,1310],[1770,1220],[2280,900],[2800,700]],35,surface('sand','#858c7b',6,1));
 const logMat=new T.MeshStandardMaterial({color:'#4c4a3b',roughness:1});for(let i=0;i<17;i++){const a=i*.77,r=280+i%5*28,x=1500+Math.cos(a)*r,z=900+Math.sin(a)*r;const log=cylinder(group,2.5,5,65+i%4*10,logMat,x,terrainHeight(s.id,x,z)+4,z,7);log.rotation.set(Math.PI/2,0,a+.5);}
 for(const [x,z]of [[1030,1060],[1860,1120],[1730,590]]){const ground=terrainHeight(s.id,x,z);for(let i=0;i<5;i++)box(group,18,5,12,army,x+i*18-36,ground+3,z);cylinder(group,1,1.8,62,dark,x,ground+31,z,6);const lamp=box(group,18,9,11,new T.MeshStandardMaterial({color:'#d5dcc9',emissive:'#c7d3ae',emissiveIntensity:.4,roughness:.4}),x,ground+64,z);lamp.rotation.x=.22;}
}

function addWeather(group,stage){if(stage.id!==4&&stage.id!==5)return null;const r=rand(stage.seed+99),points=[],snow=stage.id===5;for(let i=0;i<1800;i++)points.push((r()-.5)*1700,r()*650,(r()-.5)*1700);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));const time={value:0};const mat=new T.ShaderMaterial({uniforms:{time,tint:{value:new T.Color(snow?'#d4e0e8':'#a1bcc6')}},vertexShader:`uniform float time;varying float a;void main(){vec3 p=position;p.y=mod(p.y-time*${snow?'15.':'210.'},650.);p.x+=${snow?'sin(time*.4+position.z*.01)*12.':'time*25.'};p.x=mod(p.x+850.,1700.)-850.;vec4 v=modelViewMatrix*vec4(p,1.);a=clamp(1.-length(v.xyz)/1400.,0.,1.);gl_PointSize=clamp(${snow?'2100.':'4800.'}/max(1.,-v.z),${snow?'1.':'2.'},${snow?'4.':'9.'});gl_Position=projectionMatrix*v;}`,fragmentShader:`uniform vec3 tint;varying float a;void main(){vec2 p=gl_PointCoord-.5;${snow?'if(length(p)>.45)discard;':'if(abs(p.x)>.075)discard;'}gl_FragColor=vec4(tint,a*${snow?'.35':'.2'});}`,transparent:true,depthWrite:false});const obj=new T.Points(geo,mat);obj.frustumCulled=false;group.add(obj);return {obj,time};}

// Mission landmarks are built to scale, with clear working aprons around objectives.
function geothermal(group,s){
 const steel=new T.MeshStandardMaterial({color:'#9da4a0',metalness:.7,roughness:.37}),dark=new T.MeshStandardMaterial({color:'#3d4646',metalness:.6,roughness:.64}),concrete=new T.MeshStandardMaterial({color:'#8a9089',roughness:.95});
 road(group,s,[[-100,1500],[650,1420],[1300,1550],[2300,1500],[3000,1450]],36,surface('asphalt','#6a716e',8,.65));
 for(const [x,z]of [[950,420],[1980,1240]]){
  const facility=building(group,s,x,z,210,55,140,concrete,dark);for(let i=0;i<7;i++)box(facility,18,22,2,dark,-85+i*28,28,72);
  for(let i=0;i<3;i++){
   const xx=x-135+i*130,zz=z-110,y=terrainHeight(s.id,xx,zz),profile=[[34,0],[36,6],[27,36],[20,65],[22,87],[27,95]].map(a=>new T.Vector2(...a));mesh(new T.LatheGeometry(profile,28),concrete,group,xx,y,zz);
   cylinder(group,24,24,2,dark,xx,y+95,zz,28);
   for(let j=0;j<5;j++){const steam=mesh(new T.SphereGeometry(1,9,7),new T.MeshStandardMaterial({color:'#e0e4dc',roughness:1,transparent:true,opacity:.05,depthWrite:false}),group,xx,y+110+j*18,zz);steam.scale.set(20+j*4,15+j*5,18+j*4);steam.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.a*=pow(abs(dot(normal,normalize(vViewPosition))),1.8);');};steam.castShadow=steam.receiveShadow=false;steam.userData.noBatch=true;steam.userData.steam={base:y+100,x:xx,speed:7,phase:j*18};}
  }
  for(const dz of [95,108]){line(group,[x-240,terrainHeight(s.id,x-240,z+dz)+14,z+dz],[x+240,terrainHeight(s.id,x+240,z+dz)+14,z+dz],4,steel);for(let i=0;i<7;i++){const xx=x-230+i*75;cylinder(group,1.6,2,14,dark,xx,terrainHeight(s.id,xx,z+dz)+7,z+dz,6);}}
 }
 for(let i=0;i<15;i++){const x=120+i*190,z=120+Math.sin(i*.8)*50,y=terrainHeight(s.id,x,z);const b=mesh(new T.IcosahedronGeometry(1,2),surface('rock','#505853',1),group,x,y+8,z);b.scale.set(22,14+i%3*9,17);b.rotation.y=i*.8;}
 powerline(group,s,-100,1730,11);
}
function palm(group,s,x,z,scale=1){
 const g=new T.Group();g.position.set(x,terrainHeight(s.id,x,z),z);g.scale.setScalar(scale);group.add(g);
 const bark=new T.MeshStandardMaterial({color:'#837b62',roughness:.96}),leaf=new T.MeshStandardMaterial({color:'#687c42',side:T.DoubleSide,roughness:.88});
 const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(2,19,0),new T.Vector3(6,40,1),new T.Vector3(10,57,2)]);mesh(new T.TubeGeometry(curve,12,1.65,7,false),bark,g);
 const vertices=[];function tri(a,b,c){vertices.push(...a,...b,...c);}
 for(let f=0;f<11;f++){const angle=f*2.399,reach=21+(f%3)*3;for(let k=0;k<10;k++){
  const t=k/10,tn=(k+.65)/10,d=t*reach,dn=tn*reach,y=58+Math.sin(t*Math.PI)*7-t*t*13,yn=58+Math.sin(tn*Math.PI)*7-tn*tn*13;
  const center=[10+Math.cos(angle)*d,y,2+Math.sin(angle)*d],next=[10+Math.cos(angle)*dn,yn,2+Math.sin(angle)*dn],width=Math.sin(t*Math.PI)*5.5+.2;
  for(const sign of [-1,1]){const tip=[center[0]+Math.cos(angle+sign*1.3)*width,center[1]-1.4,center[2]+Math.sin(angle+sign*1.3)*width];tri(center,tip,next);}
 }}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();mesh(geo,leaf,g);
}
function dish(group,s,x,z,size=42){
 const steel=new T.MeshStandardMaterial({color:'#a5b4b6',metalness:.65,roughness:.42}),dark=new T.MeshStandardMaterial({color:'#46575e',metalness:.5,roughness:.7});
 const g=new T.Group();g.position.set(x,terrainHeight(s.id,x,z),z);group.add(g);cylinder(g,5,12,56,dark,0,28,0,10);
 const bowl=new T.Group();bowl.position.y=61;bowl.rotation.set(.6,.5,0);g.add(bowl);
 const profile=[];for(let i=0;i<=12;i++){const rr=i/12*size;profile.push(new T.Vector2(rr,rr*rr/(size*3)));}const shell=mesh(new T.LatheGeometry(profile,36),steel,bowl);shell.material=steel.clone();shell.material.side=T.DoubleSide;
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3;line(bowl,[Math.cos(a)*size,size/3,Math.sin(a)*size],[0,size*.9,0],.6,dark);}cylinder(bowl,2,3,7,dark,0,size*.9,0,8);
}
function tropical(group,s){
 const white=new T.MeshStandardMaterial({color:'#d7d3bb',roughness:.91}),roof=new T.MeshStandardMaterial({color:'#637f7d',metalness:.42,roughness:.63});
 road(group,s,[[300,900],[750,860],[1400,990],[2100,1200],[2700,1480]],24,surface('sand','#c6baa0',7));
 for(const [x,z]of [[970,360],[1820,1420],[2360,560]]){const g=building(group,s,x,z,125,28,75,white,roof);for(let i=0;i<4;i++)box(g,18,13,1,roof,-45+i*30,17,38);dish(group,s,x+90,z,37);}
 const r=rand(s.seed+401);for(let i=0;i<98;i++){const x=150+r()*2500,z=i%2?100+r()*95:1600+r()*160;if(terrainHeight(s.id,x,z)>12&&clearingWeight(s.id,x,z)<.02)palm(group,s,x,z,.65+r()*.7);}
 // A timber boat jetty and a low offshore breakwater establish human scale.
 const wood=new T.MeshStandardMaterial({color:'#858375',roughness:.88});for(let i=0;i<24;i++){const z=1750+i*10;box(group,45,2,9,wood,1300,12,z);if(i%4===0)for(const dx of [-19,19])cylinder(group,1,1.7,25,wood,1300+dx,0,z,6);}
 for(let i=0;i<8;i++){const x=3000+i*55,z=2000+Math.sin(i)*40;const rock=mesh(new T.IcosahedronGeometry(1,2),surface('rock','#7b8675',1),group,x,-2,z);rock.scale.set(42,26,35);}
}
function saltFlat(group,s){
 const concrete=new T.MeshStandardMaterial({color:'#a7a79c',roughness:.93}),steel=new T.MeshStandardMaterial({color:'#6c777a',metalness:.55,roughness:.53}),glass=new T.MeshStandardMaterial({color:'#273a43',metalness:.65,roughness:.24});
 road(group,s,[[100,900],[700,900],[1300,900],[2000,900],[2900,900]],33,surface('asphalt','#898e8b',10,.85));
 for(const [x,z]of [[800,1420],[2100,700]]){const bunker=building(group,s,x,z,160,20,100,concrete,steel);box(bunker,70,18,1,steel,0,10,51);for(let i=0;i<3;i++){const xx=x-58+i*58;cylinder(bunker,17,17,2,steel,xx,22,0,24);}}
 for(let row=0;row<3;row++)for(let col=0;col<12;col++){const x=880+col*92,z=200+row*104,y=terrainHeight(s.id,x,z);const panel=box(group,72,1.4,66,glass,x,y+13,z);panel.rotation.x=-.35;line(group,[x,y,z],[x,y+13,z],1.4,steel);}
 for(const [x,z]of [[450,260],[2250,240],[2500,1600]])dish(group,s,x,z,50);
 const mast=new T.Group();const x=1750,z=1580,y=terrainHeight(s.id,x,z);mast.position.set(x,y,z);group.add(mast);for(let i=0;i<12;i++){const yy=i*12,w=14-i*.6;for(const a of [-1,1]){line(mast,[a*w,yy,-w],[a*(w-.6),yy+12,-w+.6],.7,steel);line(mast,[a*w,yy,w],[a*(w-.6),yy+12,w-.6],.7,steel);line(mast,[-w,yy,a*w],[w-.6,yy+12,a*(w-.6)],.45,steel);}}box(mast,30,10,4,steel,0,150,0);
}

function createFarTerrain(group,stage){
 const mat=surface(stage.ground,stage.groundTint,165,.96,stage.quality);mat.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 farPosition;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nfarPosition=(modelMatrix*vec4(transformed,1.)).xyz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 farPosition;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(farPosition.x>-3299.&&farPosition.x<6099.&&farPosition.z>-2999.&&farPosition.z<4799.)discard;');};
 let sea=null;if(stage.id===7||stage.id===4){const normal=cloneSurfaceMap('rock',true,stage.quality);normal.repeat.set(230,230);const waterMat=new T.MeshStandardMaterial({color:stage.waterColor,roughness:.24,envMapIntensity:.32,metalness:0,normalMap:normal,normalScale:new T.Vector2(.22,.12),transparent:true,opacity:.93});waterMat.onBeforeCompile=mat.onBeforeCompile;const waterGeo=new T.PlaneGeometry(36000,36000,64,64);waterGeo.rotateX(-Math.PI/2);sea=mesh(waterGeo,waterMat,group,0,stage.id===4?1.5:0,0);sea.castShadow=false;sea.userData.noBatch=true;sea.userData.water=true;}
 const tiles=[];let center='';for(let i=0;i<9;i++){const g=new T.PlaneGeometry(12000,12000,40,40);g.rotateX(-Math.PI/2);const tile=mesh(g,mat,group);tile.userData.noBatch=true;tile.castShadow=false;tiles.push(tile);}
 return p=>{const gx=Math.round(p.x/12000),gz=Math.round(p.z/12000),key=gx+','+gz;if(key===center)return;center=key;if(sea){sea.position.x=gx*12000;sea.position.z=gz*12000;}for(let i=0;i<9;i++){const tile=tiles[i],cx=(gx+i%3-1)*12000,cz=(gz+Math.floor(i/3)-1)*12000,pos=tile.geometry.attributes.position;for(let j=0;j<pos.count;j++){const x=(j%41)/40*12000-6000+cx,z=Math.floor(j/41)/40*12000-6000+cz;pos.setXYZ(j,x,terrainHeight(stage.id,x,z),z);}pos.needsUpdate=true;tile.geometry.computeVertexNormals();tile.geometry.computeBoundingSphere();}};
}
export function createStage(index,resources={}){
 const config={...getStage(index),quality:qualityMode(resources.quality)},group=new T.Group();group.name=`stage-${config.id}-${config.name}`;const previousTextureQuality=activeTextureQuality;activeTextureQuality=config.quality;addSky(group,config);addTerrain(group,config);addWater(group,config);addTrees(group,config);addRocks(group,config);[rural,alpine,desert,harbor,arctic,geothermal,tropical,saltFlat,fallenSignal][config.id-1](group,config);buildMerged(group);const weather=addWeather(group,config),streamTerrain=createFarTerrain(group,config);streamTerrain(config.spawn);activeTextureQuality=previousTextureQuality;
 const animated=[];group.traverse(o=>{if(o.userData.steam||o.userData.water)animated.push(o);});
 const heightAt=(x,z)=>terrainHeight(config.id,x,z);
 const spawnPoints=getTargetSites(config.id).map(p=>({...p,y:heightAt(p.x,p.z)}));for(let j=0;j<5;j++)for(let i=0;i<7;i++){const x=340+i*355,z=280+j*265;if(isTargetSite(config.id,x,z))spawnPoints.push({x,z,y:heightAt(x,z)});}
 return {group,config,heightAt,spawnPoints,update(time,p){streamTerrain(p);animated.forEach(o=>{if(o.userData.steam){const t=o.userData.steam;o.position.y=t.base+(time*t.speed+t.phase)%90;o.position.x=t.x+Math.sin(time*.3+t.phase)*8;o.material.opacity=.07*(1-(o.position.y-t.base)/90);}if(o.userData.water)o.material.normalMap.offset.set(time*.008,time*.004);});if(weather){weather.time.value=time;weather.obj.position.set(p.x,terrainHeight(config.id,p.x,p.z),p.z);}},isDryLand:(x,z)=>isDryLand(config.id,x,z),isTargetSite:(x,z)=>isTargetSite(config.id,x,z),dispose(){const materials=new Set();group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});for(const m of materials){for(const k of ['map','normalMap','roughnessMap'])if(m[k]&&!Array.from(textureCache.values()).includes(m[k]))m[k].dispose();m.dispose();}}};
}
