import * as T from './vendor/three.module.min.js';
import { RGBELoader } from './vendor/RGBELoader.js';
import { createAlienCrew } from './ground-actors.js?v=30.3';
import { animateAlienFace } from './alien-character.js?v=30.3';

// Original real-time bridge interior. The six survivors remain separate from
// the captain; story captions, speech, mute and skip controls belong to the app.
const CAMERA_SHOTS = [
 {from:[0,16,44],to:[0,15,40],look:[0,8,0]},
 {from:[-23,11,22],to:[-22,11,20],look:[-12,8,-6]},
 {from:[23,11,22],to:[22,11,20],look:[12,8,-6]},
 {from:[0,14,30],to:[0,16,46],look:[0,8,-12]}
];
const SPEAKERS = [3,1,2,0];
export function buildRescueBridgeScene(){
 const scene=new T.Scene();scene.background=new T.Color('#010307');scene.fog=new T.FogExp2('#060b11',.000015);
 const camera=new T.PerspectiveCamera(46,16/9,.12,18000),geometries=new Set(),materials=new Set(),textures=new Set();
 const ownGeometry=g=>(geometries.add(g),g),ownMaterial=m=>(materials.add(m),m);
 const loader=new T.TextureLoader(),metalMap=loader.load('./assets/generated/aerospace-metal.png');metalMap.colorSpace=T.SRGBColorSpace;metalMap.wrapS=metalMap.wrapT=T.RepeatWrapping;metalMap.anisotropy=8;textures.add(metalMap);
 // Loading a second texture avoids cloning an image-less source before onload.
 const floorMap=loader.load('./assets/generated/aerospace-metal.png');floorMap.colorSpace=T.SRGBColorSpace;floorMap.wrapS=floorMap.wrapT=T.RepeatWrapping;floorMap.anisotropy=8;floorMap.repeat.set(4,5);textures.add(floorMap);
 const mat=(color,roughness=.7,metalness=.3,map=null)=>ownMaterial(new T.MeshStandardMaterial({color,roughness,metalness,map}));
 const hull=mat('#53616b',.54,.7,metalMap),dark=mat('#19242c',.73,.56,metalMap),trim=mat('#69777e',.36,.83),floor=mat('#3c454b',.84,.42,floorMap),rubber=mat('#152025',.96,.04),pale=mat('#a6b5ba',.45,.42);
 const warm=ownMaterial(new T.MeshStandardMaterial({color:'#d4d7cb',emissive:'#fff0ce',emissiveIntensity:.8,roughness:.32}));
 const mint=ownMaterial(new T.MeshStandardMaterial({color:'#99c2b4',emissive:'#8dbca9',emissiveIntensity:.52,roughness:.35,metalness:.32}));
 const add=(parent,geo,material,x=0,y=0,z=0)=>{const m=new T.Mesh(ownGeometry(geo),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const box=(p,m,x,y,z,w,h,d)=>add(p,new T.BoxGeometry(w,h,d),m,x,y,z);
 const rod=(p,m,a,b,r=.15)=>{const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa);const o=add(p,new T.CylinderGeometry(r,r,delta.length(),8),m);o.position.copy(aa.add(bb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;};
 const interior=new T.Group();interior.name='rescued-crew-bridge';scene.add(interior);
 box(interior,floor,0,-.7,3,88,1.4,118);box(interior,dark,0,34,3,88,1.5,118);
 box(interior,hull,0,17,63,88,34,2);box(interior,dark,0,12.5,61.7,18,25,1.2);for(const side of [-1,1]){box(interior,trim,side*9.6,13,61,1,26,1.1);box(interior,hull,side*4.5,12.5,61,8.6,24,.5);box(interior,warm,side*10.4,14,60.8,.2,20,.2);}box(interior,trim,0,25.8,61,20,1.1,1.1);
 // Broad empty viewport: the planet beyond is actual 3D geometry, never a backdrop.
 box(interior,hull,0,5,-53,88,10,2.4);box(interior,hull,0,32.8,-53,88,5.2,2.4);
 for(const s of [-1,1]){
  box(interior,hull,s*42,19,-53,4.7,29,3);box(interior,dark,s*44,17,3,2,34,118);
  box(interior,trim,s*39.3,20.4,-51.5,1.1,21.8,1.1);
  rod(interior,trim,[s*40,11,-51],[s*35,30.4,-51],.3);
  box(interior,dark,s*41.7,7.6,-28,2.5,14,42);box(interior,dark,s*41.7,7.6,24,2.5,14,43);
  box(interior,warm,s*37,31,-25,.65,.24,45);box(interior,warm,s*37,31,28,.65,.24,40);
  box(interior,mint,s*38,.16,0,.28,.12,94);
  for(let i=0;i<7;i++){
   const z=-43+i*15;box(interior,trim,s*42.4,18,z,.65,30,1.6);box(interior,dark,s*37.6,31,z,9.5,1.3,1.8);
   box(interior,hull,s*43.05,21,z+6,1.1,16,10.5);box(interior,pale,s*42.2,11,z+6,.16,1.2,6.3);
  }
 }
 box(interior,trim,0,10.7,-51.5,79,1,1.1);box(interior,trim,0,30.9,-51.5,79,1.1,1.1);
 const glass=ownMaterial(new T.MeshPhysicalMaterial({color:'#b2cad2',metalness:.03,roughness:.1,clearcoat:1,clearcoatRoughness:.05,transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide}));
 add(interior,new T.PlaneGeometry(77,19.6),glass,0,20.7,-51.15).castShadow=false;
 // Realistic deck seams, floor grilles, overhead ribs and flush maintenance plates.
 for(let i=0;i<11;i++)box(interior,dark,0,.025,-48+i*10,82,.03,.075);
 for(const x of [-28,-14,14,28])box(interior,dark,x,.03,3,.08,.04,112);
 for(let i=0;i<13;i++)box(interior,rubber,-33+i*.43,.08,22,.21,.05,18);
 for(let i=0;i<7;i++){const z=-43+i*15;box(interior,trim,0,32.1,z,76,.45,.7);box(interior,dark,0,33,z+5,69,.7,9);}
 for(const x of [-25,25]){box(interior,dark,x,6.1,-28,13,11.9,14);box(interior,hull,x,11.5,-26,15,1.2,16);}
 // Captain's operations console; small original abstract instrumentation, no story text.
 const panelCanvas=document.createElement('canvas');panelCanvas.width=512;panelCanvas.height=256;const q=panelCanvas.getContext('2d');q.fillStyle='#061018';q.fillRect(0,0,512,256);q.strokeStyle='#659e9a';q.lineWidth=2;
 for(let i=0;i<6;i++){q.globalAlpha=.22;q.beginPath();q.moveTo(0,27+i*37);q.lineTo(512,27+i*37);q.stroke();}q.globalAlpha=.8;
 q.beginPath();q.ellipse(236,126,93,77,-.27,0,Math.PI*2);q.stroke();q.beginPath();q.ellipse(236,126,119,50,-.62,0,Math.PI*2);q.stroke();
 for(let i=0;i<20;i++){q.fillStyle=i%4?'#81afa9':'#c8b48d';q.fillRect(389,20+i*10,18+(i*13%81),2);q.fillRect(24,23+i*10,5,3);}
 const panelMap=new T.CanvasTexture(panelCanvas);panelMap.colorSpace=T.SRGBColorSpace;textures.add(panelMap);const screen=ownMaterial(new T.MeshStandardMaterial({map:panelMap,emissiveMap:panelMap,emissive:'#b7dad2',emissiveIntensity:.4,roughness:.28,metalness:.1}));
 box(interior,dark,0,4.4,-29,24,8.7,9);const dashboard=box(interior,hull,0,8.9,-29,26,1.2,12);dashboard.rotation.x=.16;
 const display=add(interior,new T.PlaneGeometry(20.5,8),screen,0,9.65,-28.5);display.rotation.x=-Math.PI/2+.16;
 for(const side of [-1,1])for(let i=0;i<5;i++){box(interior,rubber,side*(11.6-i*.45),9.6,-25,.25,.25,.45);}
 // Quiet side seating and safety rails put the reunion inside a usable ship.
 for(const s of [-1,1])for(const z of [-2,20]){
  box(interior,dark,s*30,3.4,z,9,1.6,9);box(interior,rubber,s*30,4.4,z,8,1,8);box(interior,rubber,s*30,8.4,z+4,8,8,1.2);
  for(const x of [-3,3])box(interior,trim,s*30+x,1.8,z+2,.5,3.5,.5);
 }
 for(const s of [-1,1]){rod(interior,trim,[s*24,2,-34],[s*24,8,-34],.24);rod(interior,trim,[s*24,8,-34],[s*36,8,-34],.24);}
 const rank=mat('#b6b19a',.54,.6),actors=[];
 const poses=[[0,-22,Math.PI],[-12,-6,Math.PI+.25],[12,-6,Math.PI-.25],[-20,3,Math.PI+.35],[0,4,Math.PI],[20,3,Math.PI-.35],[-6,9,Math.PI]];
 for(let i=0;i<7;i++){
  const body=createAlienCrew();body.name=i?'rescued-survivor-'+i:'ship-captain';const [x,z,yaw]=poses[i];body.position.set(x,0,z);body.rotation.y=yaw;interior.add(body);
  const head=body.userData.head,face=body.userData.face,mouth=face.mouth,lids=face.eyelids;
  if(i===0)for(let bar=0;bar<3;bar++)box(body,rank,-1.9+bar*.65,22.15,-2.55,.32,1.4,.2);
  actors.push({body,head,mouth,lids,baseYaw:yaw,phase:i*1.37,leftArm:body.userData.leftArm,rightArm:body.userData.rightArm});
 }
 // Thin haze, white key light, blue planet fill and a warm console bounce.
 const hemi=new T.HemisphereLight('#d8dce0','#343b40',1.0);scene.add(hemi);
 const sun=new T.DirectionalLight('#f4f0e8',2.3);sun.position.set(-38,47,-90);sun.target.position.set(0,7,-4);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-51,right:51,top:43,bottom:-43,near:1,far:210});sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun,sun.target);
 const faceKey=new T.SpotLight('#e4eaf1',1900,120,.65,.85,2);faceKey.position.set(10,24,30);faceKey.target.position.set(0,12,-12);faceKey.castShadow=false;scene.add(faceKey,faceKey.target);
 const fill=new T.PointLight('#a1c6dc',380,95,2);fill.position.set(-22,18,24);scene.add(fill);
 const bounce=new T.PointLight('#dcc8a4',160,43,2);bounce.position.set(0,10,-25);scene.add(bounce);
 // Existing NASA source imagery is projected onto a curved world outside the viewport.
 const earthMap=loader.load('./assets/space/earth-blue-marble.jpg');earthMap.colorSpace=T.SRGBColorSpace;earthMap.anisotropy=8;textures.add(earthMap);
 const cloudMap=loader.load('./assets/space/earth-clouds.jpg');textures.add(cloudMap);
 const earthMaterial=ownMaterial(new T.ShaderMaterial({uniforms:{surface:{value:earthMap}},vertexShader:'varying vec2 u;varying vec3 n;void main(){u=uv;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D surface;varying vec2 u;varying vec3 n;void main(){float d=dot(normalize(n),normalize(vec3(-.5,.65,.4)));float daylight=smoothstep(-.14,.22,d);vec3 c=texture2D(surface,u).rgb*(.025+daylight*(.35+.85*max(0.,d)));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',fog:false}));
 const earth=add(scene,new T.SphereGeometry(2350,96,64),earthMaterial,440,-1210,-4900);earth.rotation.set(.63,-1.6,.1);earth.castShadow=earth.receiveShadow=false;
 const cloudMaterial=ownMaterial(new T.ShaderMaterial({uniforms:{clouds:{value:cloudMap}},vertexShader:'varying vec2 u;varying vec3 n;void main(){u=uv;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D clouds;varying vec2 u;varying vec3 n;void main(){float day=smoothstep(-.15,.25,dot(normalize(n),normalize(vec3(-.5,.65,.4))));vec3 c=mix(vec3(.02,.04,.07),vec3(.85,.88,.91),day);gl_FragColor=vec4(c,smoothstep(.16,.85,texture2D(clouds,u).r)*.8);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',transparent:true,depthWrite:false,fog:false}));
 const clouds=add(scene,new T.SphereGeometry(2360,80,48),cloudMaterial,440,-1210,-4900);clouds.rotation.copy(earth.rotation);clouds.castShadow=clouds.receiveShadow=false;
 const atmosphereMaterial=ownMaterial(new T.ShaderMaterial({side:T.BackSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'varying vec3 n,p;void main(){vec4 w=modelMatrix*vec4(position,1.);p=w.xyz;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'varying vec3 n,p;void main(){float edge=pow(1.-abs(dot(normalize(n),normalize(cameraPosition-p))),3.);gl_FragColor=vec4(.12,.35,.72,edge*.65);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}',fog:false}));
 add(scene,new T.SphereGeometry(2388,80,48),atmosphereMaterial,440,-1210,-4900).castShadow=false;
 const starPositions=[];for(let i=0;i<850;i++){const y=Math.sin(i*39.237)*.97,a=i*2.399963,r=Math.sqrt(1-y*y);starPositions.push(Math.cos(a)*r*14500,y*14500,Math.sin(a)*r*14500);}
 const starGeometry=ownGeometry(new T.BufferGeometry());starGeometry.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));const stars=new T.Points(starGeometry,ownMaterial(new T.PointsMaterial({color:'#c4d0df',size:1.15,sizeAttenuation:false,fog:false})));scene.add(stars);
 camera.position.fromArray(CAMERA_SHOTS[0].from);camera.lookAt(new T.Vector3(...CAMERA_SHOTS[0].look));
 return {scene,camera,actors,earth,clouds,sun,owned:{geometries,materials,textures},dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();scene.clear();}};
}
export function createRescueCinematic(canvas,{quality='native'}={}){
 const bridge=buildRescueBridgeScene(),renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1.15;renderer.outputColorSpace=T.SRGBColorSpace;
 let active=false,disposed=false,reduced=false,clock=0,beat=0,beatDuration=5.5,speaker=0,onBeat=null,complete=null,completed=false,environmentTarget=null,currentQuality=quality,lastWidth=0,lastHeight=0;
 const pmrem=new T.PMREMGenerator(renderer);new RGBELoader().load('./assets/evening-field.hdr',hdr=>{if(disposed){hdr.dispose();return;}environmentTarget=pmrem.fromEquirectangular(hdr);bridge.scene.environment=environmentTarget.texture;bridge.scene.environmentIntensity=.35;hdr.dispose();pmrem.dispose();},undefined,()=>pmrem.dispose());
 const resize=()=>{if(disposed)return;const rect=canvas.getBoundingClientRect(),width=Math.max(1,Math.round(rect.width||canvas.clientWidth||1280)),height=Math.max(1,Math.round(rect.height||canvas.clientHeight||720));if(width===lastWidth&&height===lastHeight)return;lastWidth=width;lastHeight=height;const native=Math.min(globalThis.devicePixelRatio||1,currentQuality==='auto'?1.4:2),ratio=currentQuality==='ultra'?Math.min(4,Math.sqrt(8294400/(width*height))):native;renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);bridge.camera.aspect=width/height;bridge.camera.updateProjectionMatrix();};
 const setSpeaker=index=>{speaker=Number.isInteger(index)&&index>=0&&index<bridge.actors.length?index:-1;};
 function update(dt=0){if(!active||disposed)return {elapsed:Math.min(clock,beatDuration*4),beat,finished:completed};clock+=Math.min(.1,Math.max(0,dt));const elapsed=Math.min(clock,beatDuration*4),next=Math.min(3,Math.floor(elapsed/beatDuration));if(next!==beat){beat=next;setSpeaker(SPEAKERS[beat]);onBeat?.(beat);}
  const progress=T.MathUtils.clamp((elapsed-beat*beatDuration)/beatDuration,0,1),ease=progress*progress*(3-2*progress),shot=CAMERA_SHOTS[beat],desired=new T.Vector3(...shot.from).lerp(new T.Vector3(...shot.to),reduced?.5:ease),look=new T.Vector3(...shot.look);
  if(!reduced){desired.x+=Math.sin(clock*.19)*.18;desired.y+=Math.sin(clock*.27)*.09;}if(bridge.camera.aspect<1.25)desired.sub(look).multiplyScalar(1.25/Math.max(.4,bridge.camera.aspect)).add(look);bridge.camera.position.copy(desired);bridge.camera.lookAt(look);
  const ended=clock>=beatDuration*4,voice=ended?0:Math.sin(progress*Math.PI)*Math.min(1,progress*10);
  for(let i=0;i<bridge.actors.length;i++){const a=bridge.actors[i],talk=i===speaker?voice:0,breath=Math.sin(clock*1.6+a.phase),motion=reduced?.35:1;
   a.body.position.y=0;a.body.scale.y=.45*(1+breath*.003*motion);a.head.rotation.x=(Math.sin(clock*.9+a.phase)*.025+talk*Math.sin(clock*5)*.045)*motion;
   a.head.rotation.y=(Math.sin(clock*.46+a.phase)*.055+(i===0?.11*Math.sin(clock*.5):-.035))*motion;
   a.head.rotation.z=talk*Math.sin(clock*3+a.phase)*.025*motion;
   const blink=((clock+a.phase*2.1)%5.1)<.12;animateAlienFace(a.body,{speech:talk,blink,time:clock+i*.21});
   a.leftArm.rotation.x=talk*Math.sin(clock*1.8)*.055*motion;a.rightArm.rotation.z=talk*(.035+Math.sin(clock*1.4)*.025)*motion;
  }
  bridge.clouds.rotation.y=bridge.earth.rotation.y+(reduced?0:clock*.00002);resize();renderer.render(bridge.scene,bridge.camera);
  if(ended&&!completed){completed=true;complete?.();}return {elapsed,beat,finished:completed};
 }
 return {get duration(){return beatDuration*4;},get active(){return active;},get elapsed(){return Math.min(clock,beatDuration*4);},start(options={}){if(disposed)return;reduced=!!options.reduced;beatDuration=Math.max(1,options.beatDuration??5.5);clock=0;beat=0;speaker=0;onBeat=options.onBeat??null;complete=options.onComplete??null;completed=false;active=true;lastWidth=lastHeight=0;resize();onBeat?.(0);update(0);},update,setSpeaker,setBeat(index){clock=T.MathUtils.clamp(index,0,3)*beatDuration;beat=Math.min(3,Math.max(0,index));speaker=SPEAKERS[beat];completed=false;update(0);},resize,setQuality(value){currentQuality=value;lastWidth=lastHeight=0;const size=value==='ultra'?2048:value==='auto'?1024:1536;bridge.sun.shadow.mapSize.set(size,size);bridge.sun.shadow.map?.dispose();bridge.sun.shadow.map=null;resize();},stop(){active=false;},dispose(){if(disposed)return;active=false;disposed=true;environmentTarget?.dispose();bridge.dispose();pmrem.dispose();renderer.dispose();}};
}
