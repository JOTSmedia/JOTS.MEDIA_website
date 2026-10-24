import * as T from './vendor/three.module.min.js';

// A shared, articulated grey-alien sculpt. Coordinates face -Z; the 0.45 scale
// preserves the rescue crew's existing 15-unit ground height and animation rig.
let template, palette;
const V=(x,y,z)=>new T.Vector3(x,y,z);
const clamp=T.MathUtils.clamp;
function grain(size,cloth=false){
 const pixels=new Uint8Array(size*size*4);let seed=78124;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed>>>24)/255;
  const weave=cloth?Math.sin(x*Math.PI*.5)*Math.cos(y*Math.PI*.5)*22:Math.sin(x*.24+y*.19)*4;
  const value=clamp((cloth?149:204)+noise*(cloth?25:24)+weave,0,255),i=(y*size+x)*4;pixels[i]=value;pixels[i+1]=value;pixels[i+2]=value;pixels[i+3]=255;
 }const tex=new T.DataTexture(pixels,size,size,T.RGBAFormat);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.needsUpdate=true;return tex;
}
function materials(){
 if(palette)return palette;
 const pores=grain(256),weave=grain(256,true);weave.repeat.set(6,10);
 // Separate UV windows sample the skin and woven-cloth halves of the same
 // generated atlas. Cropping within the seam prevents dark bleed onto faces.
 const skinMap=new T.TextureLoader().load('./assets/generated/alien-materials-v2.png');skinMap.colorSpace=T.SRGBColorSpace;skinMap.repeat.set(.486,.984);skinMap.offset.set(.007,.008);skinMap.anisotropy=8;
 const suitMap=new T.TextureLoader().load('./assets/generated/alien-materials-v2.png');suitMap.colorSpace=T.SRGBColorSpace;suitMap.repeat.set(.486,.984);suitMap.offset.set(.507,.008);suitMap.anisotropy=8;
 palette={skin:new T.MeshPhysicalMaterial({map:skinMap,color:'#d5d9d0',roughness:.76,metalness:0,bumpMap:pores,bumpScale:.012,clearcoat:0,envMapIntensity:.45}),
  suit:new T.MeshStandardMaterial({map:suitMap,color:'#a8afb5',roughness:.86,metalness:.08,bumpMap:weave,bumpScale:.022}),
  seam:new T.MeshStandardMaterial({color:'#303437',roughness:.76,metalness:.12}),
  boot:new T.MeshStandardMaterial({color:'#11171a',roughness:.7}),
  fold:new T.MeshStandardMaterial({color:'#777f73',roughness:.85}),
  socket:new T.MeshStandardMaterial({color:'#495149',roughness:.88}),
  eye:new T.MeshPhysicalMaterial({color:'#010204',roughness:.19,metalness:0,clearcoat:.16,clearcoatRoughness:.16,reflectivity:.2,specularIntensity:.22,envMapIntensity:.12}),
  mouth:new T.MeshStandardMaterial({color:'#444d45',roughness:.88}),
  trim:new T.MeshStandardMaterial({color:'#748b88',roughness:.56,metalness:.5})};
 // Keep pores as a fine surface cue. The full atlas contrast can otherwise
 // read like stone in a close-up under the bridge's strong white key light.
 palette.skin.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','vec3 apSkinBase=diffuseColor.rgb;\n#include <map_fragment>\ndiffuseColor.rgb=mix(apSkinBase*vec3(.62,.64,.60),diffuseColor.rgb,.32);');};
 palette.skin.customProgramCacheKey=()=> 'alien-soft-skin-v3';
 return palette;
}
function mesh(parent,geometry,material,name){const o=new T.Mesh(geometry,material);o.name=name||'';o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function group(parent,name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
function curveMesh(parent,points,radius,material,name,segments=30){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),segments,radius,5,false),material,name);}
function sphere(parent,m,x,y,z,sx,sy,sz,name){const o=mesh(parent,new T.SphereGeometry(1,16,12),m,name);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
// Cross-sections use smooth Catmull-Rom interpolation, so anatomy and clothing
// are continuous surfaces, rather than visible cylinders joined at each joint.
function loft(rows,radial=40,rings=52,deform=null){
 const tracks=[0,1,2,3,4].map(axis=>new T.CatmullRomCurve3(rows.map((r,i)=>V(i,r[axis]||0,0))));
 const values=t=>tracks.map(track=>track.getPoint(t).y),pos=[],uv=[],idx=[];
 for(let j=0;j<=rings;j++){const t=j/rings,[y,rx,rz,cx,cz]=values(t);for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2;let p={x:cx+Math.sin(a)*Math.max(.001,rx),y,z:cz-Math.cos(a)*Math.max(.001,rz)};if(deform)p=deform(p,t,a);pos.push(p.x,p.y,p.z);uv.push(i/radial,t);}}
 for(let j=0;j<rings;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;if(rows[rows.length-1][0]>=rows[0][0])idx.push(a,b,a+1,b,b+1,a+1);else idx.push(a,a+1,b,b,a+1,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
const gaussian=(v,c,w)=>Math.exp(-Math.pow((v-c)/w,2));
function headSculpt(){
 const rows=[[-.2,.05,.08,0,.13],[.12,.72,.72,0,-.1],[.75,1.15,1.13,0,-.2],[1.45,1.55,1.55,0,-.05],[2.2,2.02,1.96,0,.04],[3.15,2.65,2.2,0,.12],[4.1,3.15,2.38,0,.15],[5.4,3.46,2.62,0,.27],[7,3.58,2.83,0,.36],[8.3,3.03,2.47,0,.4],[9.3,1.9,1.65,0,.4],[9.8,.03,.04,0,.4]];
 return loft(rows,80,100,(p,t,a)=>{
  const front=Math.pow(Math.max(0,Math.cos(a)),5),x=p.x,y=p.y;
  // Orbital cavities, a narrow bridge, cheek ridges, muzzle and chin are carved
  // into the same manifold cranium instead of layered primitive head shapes.
  const socket=(gaussian(x,1.35,.92)+gaussian(x,-1.35,.92))*gaussian(y,3.65,.79);
  const brow=(gaussian(x,1.35,1.1)+gaussian(x,-1.35,1.1))*gaussian(y,4.65,.28);
  const cheek=(gaussian(x,1.62,.54)+gaussian(x,-1.62,.54))*gaussian(y,2.38,.45);
  const nose=gaussian(x,0,.38)*(gaussian(y,2.8,1)*.32+gaussian(y,2.22,.28)*.25);
  const lips=gaussian(x,0,.72)*gaussian(y,1.2,.22)*.14;
  p.z+=front*(socket*.32-brow*.15-cheek*.17-nose-lips);
  p.z+=front*gaussian(y,5.8,1.2)*Math.cos(y*17+x*.45)*.017;
  p.x*=1-.08*T.MathUtils.smoothstep(y,4.5,7.2);
  return p;
 });
}
function almondGeometry(width,height,depth,radial=48,rings=10){
 const p=[],uv=[],idx=[];for(let j=0;j<=rings;j++){const r=j/rings;for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2,s=Math.sin(a),x=width*Math.cos(a)*r,y=height*Math.sign(s)*Math.pow(Math.abs(s),1.4)*r;
  p.push(x,y,-depth*Math.sqrt(Math.max(0,1-r*r)));uv.push(x/(width*2)+.5,y/(height*2)+.5);}}
 for(let j=0;j<rings;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;idx.push(a,a+1,b,b,a+1,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
function eye(parent,side,m){
 const socket=group(parent,side<0?'leftEye':'rightEye',side*1.32,3.67,-1.98);socket.rotation.z=side*.29;socket.rotation.y=side*-.19;
 mesh(socket,almondGeometry(1.08,.65,.23),m.socket);
 mesh(socket,almondGeometry(.99,.51,.31),m.eye);
 const lid=mesh(socket,almondGeometry(1.01,.55,.325),m.skin,side<0?'leftEyelid':'rightEyelid');lid.visible=false;
 const upper=[],lower=[];for(let i=0;i<=20;i++){const a=i/20*Math.PI,x=1.04*Math.cos(a),y=.59*Math.pow(Math.sin(a),1.7);upper.push([x,y,-.055]);lower.push([x,-y,-.055]);}
 curveMesh(socket,upper,.085,m.skin);curveMesh(socket,lower,.055,m.skin);
}
function buildHead(g,m){
 const h=group(g,'head',0,24.45,0);
 mesh(h,loft([[-2,.75,.77,0,.1],[-1.2,.94,.9,0,.1],[0,.83,.83,0,.06],[.7,1.13,1.01,0,.15]],32,20),m.skin,'neck');
 mesh(h,headSculpt(),m.skin,'sculptedCranium');for(const s of [-1,1])eye(h,s,m);
 // Restrained forehead furrows, nasolabial creases and small nose apertures.
 for(let i=0;i<3;i++){const y=5.22+i*.42,pts=[];for(let k=0;k<=14;k++){const x=-1.8+k/14*3.6;pts.push([x,y+.10*Math.cos(x*1.5),.26-2.63*Math.sqrt(1-Math.pow(x/3.47,2))-i*.062-.025]);}curveMesh(h,pts,.018,m.fold,'foreheadFurrow',24);}
 for(const s of [-1,1]){
  sphere(h,m.mouth,s*.18,2.09,-2.43,.085,.055,.035,'nostril');
  curveMesh(h,[[s*.42,2.06,-1.96],[s*.56,1.75,-1.85],[s*.72,1.31,-1.65]],.022,m.fold);
  curveMesh(h,[[s*1.7,2.73,-1.72],[s*1.52,2.17,-1.68],[s*1.03,1.63,-1.53]],.024,m.fold);
 }
 const mouth=group(h,'mouth',0,1.06,-1.55);const pts=[[-.58,.04,0],[-.3,-.015,-.045],[0,.01,-.08],[.3,-.015,-.045],[.58,.04,0]];
 curveMesh(mouth,pts,.035,m.mouth,'mouthLine',20);
 const inner=mesh(mouth,almondGeometry(.48,.11,.035,32,5),m.mouth,'mouthOpening');inner.position.z=-.025;inner.scale.y=.05;
 curveMesh(mouth,[[-.51,-.045,0],[0,-.1,-.07],[.51,-.045,0]],.027,m.skin,'lowerLip',20);
 return h;
}
function buildArm(g,side,m){
 const arm=group(g,side<0?'leftArm':'rightArm',side*3.35,22.5,0);
 mesh(arm,loft([[.45,.35,.45,0,0],[0,1.15,1.18,0,0],[-1.4,1.04,1.01,side*.3,.05],[-4.3,.77,.82,side*.65,.15],[-5.3,.76,.78,side*.7,.05],[-6.2,.86,.79,side*.72,-.05],[-8.6,.60,.60,side*.75,-.18],[-9.1,.57,.55,side*.77,-.22]],24,36),m.suit,'tailoredSleeve');
 curveMesh(arm,[[side*.05,-.7,-1],[side*.4,-3.5,-.77],[side*.72,-5.6,-.72],[side*.76,-8.7,-.76]],.027,m.seam);
 for(let k=0;k<3;k++)curveMesh(arm,[[-.57+side*.7,-4.6-k*.24,-.43],[side*.7,-4.65-k*.24,-.75],[.57+side*.7,-4.55-k*.24,-.43]],.028,m.seam);
 mesh(arm,loft([[-9,.43,.4,side*.77,-.22],[-9.5,.58,.39,side*.80,-.23],[-10.3,.64,.35,side*.8,-.27],[-10.8,.47,.3,side*.85,-.29]],24,20),m.skin,'hand');
 // Four separate gently curled digits and an opposable thumb have a tapered
 // silhouette and real joints, readable in the ending's close shots.
 for(let f=0;f<4;f++){const x=side*.8+(f-1.5)*.29,len=[1.25,1.63,1.52,1.15][f];
  const pts=[[x,-10.45,-.3],[x+(f-1.5)*.06,-11.0,-.36],[x+(f-1.5)*.08,-10.65-len,-.55],[x+(f-1.5)*.06,-10.7-len,-.83]];
  const curve=new T.CatmullRomCurve3(pts.map(p=>V(...p)));const geo=new T.TubeGeometry(curve,16,.135,7,false);const a=geo.attributes.position;
  for(let j=0;j<=16;j++){const c=curve.getPointAt(j/16);for(let k=0;k<=7;k++){const ix=j*8+k,v=V(a.getX(ix),a.getY(ix),a.getZ(ix)).sub(c).multiplyScalar(1-j/16*.42).add(c);a.setXYZ(ix,v.x,v.y,v.z);}}geo.computeVertexNormals();mesh(arm,geo,m.skin,'finger');
 }
 curveMesh(arm,[[side*.32,-9.7,-.2],[side*-.05,-10.15,-.45],[side*-.09,-10.7,-.7],[side*.15,-10.97,-.83]],.19,m.skin,'thumb',18);
 return arm;
}
function buildLeg(g,side,m){
 const leg=group(g,side<0?'leftLeg':'rightLeg',side*1.55,12.6,0);
 mesh(leg,loft([[.7,1.4,1.5,0,0],[-.4,1.44,1.48,side*.05,0],[-3,1.16,1.21,side*.17,.08],[-5.4,.83,.9,side*.28,-.1],[-6.2,.89,.94,side*.32,.02],[-8.1,.9,.94,side*.35,.14],[-10.9,.62,.67,side*.38,.08],[-11.5,.60,.65,side*.38,.04]],28,42),m.suit,'tailoredLeg');
 curveMesh(leg,[[side*1.27,0,-.4],[side*1.18,-3.2,-.35],[side*1.04,-5.8,-.3],[side*.98,-10.7,-.18]],.025,m.seam);
 mesh(leg,loft([[-11,.62,.69,side*.38,0],[-11.6,.66,.85,side*.38,-.22],[-12.05,.73,1.3,side*.38,-.61],[-12.5,.67,1.28,side*.38,-.62]],24,20),m.boot,'fittedBoot');
 return leg;
}
function mergeStaticParts(root,protectedParts=[]){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map(),removed=[];
 root.traverse(o=>{if(!o.isMesh||protectedParts.includes(o))return;for(let p=o.parent;p&&p!==root;p=p.parent)if(protectedParts.includes(p))return;
  const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry,position=geo.attributes.position,normal=geo.attributes.normal,uv=geo.attributes.uv,transform=inverse.clone().multiply(o.matrixWorld),nm=new T.Matrix3().getNormalMatrix(transform);
  let bucket=buckets.get(o.material);if(!bucket){bucket={p:[],n:[],u:[]};buckets.set(o.material,bucket);}const v=new T.Vector3(),n=new T.Vector3();
  for(let i=0;i<position.count;i++){v.fromBufferAttribute(position,i).applyMatrix4(transform);n.fromBufferAttribute(normal,i).applyMatrix3(nm).normalize();bucket.p.push(v.x,v.y,v.z);bucket.n.push(n.x,n.y,n.z);bucket.u.push(uv.getX(i),uv.getY(i));}
  if(geo!==o.geometry)geo.dispose();removed.push(o);
 });
 for(const o of removed){o.parent.remove(o);o.geometry.dispose();}
 for(const [material,data]of buckets){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(data.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(data.u,2));mesh(root,geo,material,'sharedSculptSurface');}
}
function makeTemplate(){
 const g=new T.Group(),m=materials();g.name='sculptedGreyRescueCrew';
 mesh(g,loft([[11.6,1.7,1.45,0,0],[12.7,2.85,1.69,0,0],[14.2,2.65,1.6,0,0],[16.5,2.25,1.46,0,0],[19,2.65,1.67,0,.06],[21.6,3.48,1.88,0,.02],[22.8,3.58,1.71,0,.08],[23.6,2.35,1.15,0,.04],[24.1,.9,.88,0,0]],48,64),m.suit,'tailoredTorso');
 mesh(g,loft([[23.7,1.01,.96,0,0],[24.8,1,.94,0,0],[25,.88,.87,0,0]],32,14),m.boot,'highCollar');
 curveMesh(g,[[0,24.4,-.98],[0,23.1,-1.47],[0,21.2,-1.94],[0,18,-1.58],[0,15.2,-1.49],[0,14.2,-1.65]],.043,m.seam,'frontClosure');
 for(const s of [-1,1]){
  curveMesh(g,[[s*.9,23.8,-.77],[s*1.8,22.4,-1.52],[s*3.07,21.7,-1.24]],.037,m.seam);
  curveMesh(g,[[s*2.85,21.7,-1.03],[s*2.17,19.1,-1.05],[s*1.89,16.4,-.94],[s*2.22,13.7,-1.07]],.026,m.seam);
  buildArm(g,s,m);buildLeg(g,s,m);
 }
 const badge=mesh(g,new T.CircleGeometry(.24,6),m.trim,'crewInsignia');badge.rotation.y=Math.PI;badge.position.set(-1.1,21.5,-1.77);
 buildHead(g,m);
 const pivots=['head','leftArm','rightArm','leftLeg','rightLeg'].map(name=>g.getObjectByName(name)),face=['mouthOpening','lowerLip','leftEyelid','rightEyelid'].map(name=>g.getObjectByName(name));
 mergeStaticParts(g,pivots);for(const part of pivots)mergeStaticParts(part,face);
 g.scale.setScalar(.45);return g;
}
export function createAlienCharacter(){
 template ||= makeTemplate();const g=template.clone(true);
 const head=g.getObjectByName('head'),leftArm=g.getObjectByName('leftArm'),rightArm=g.getObjectByName('rightArm'),leftLeg=g.getObjectByName('leftLeg'),rightLeg=g.getObjectByName('rightLeg');
 Object.assign(g.userData,{actor:'alien',head,leftArm,rightArm,leftLeg,rightLeg,arms:[leftArm,rightArm],legs:[leftLeg,rightLeg],walking:true,face:{mouth:g.getObjectByName('mouthOpening'),lowerLip:g.getObjectByName('lowerLip'),eyelids:[g.getObjectByName('leftEyelid'),g.getObjectByName('rightEyelid')]}});
 return g;
}
export function animateAlienFace(actor,{speech=0,blink=false,time=0}={}){
 const face=actor.userData.face;if(!face)return;
 const opening=clamp(speech,0,1)*(.25+Math.abs(Math.sin(time*9.7))*.7);face.mouth.scale.y=.05+opening;
 face.lowerLip.position.y=-opening*.075;for(const lid of face.eyelids)lid.visible=blink;
}
