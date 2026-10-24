import * as T from './vendor/three.module.min.js';

// Local, original procedural fire/smoke. Shared maps and geometry are retained;
// every wreck owns its materials, sprites and simulation history.
const GROUND = 613, textures = {}, sphere = new T.SphereGeometry(1, 12, 8);
const ringGeometry = new T.RingGeometry(.93, 1, 64);
const debrisGeometry = new T.BoxGeometry(1, 1, 1);
function rng(seed) { let s = (seed | 0) || 15731; return () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) / 4294967296; }; }
function texture(kind) {
  if (textures[kind]) return textures[kind];
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const q = c.getContext('2d'), random = rng(kind === 'smoke' ? 4739 : 9841);
  q.clearRect(0, 0, 256, 256);
  if (kind === 'smoke') {
    // Overlapping irregular lobes preserve a billowing silhouette at many scales.
    for (let i = 0; i < 40; i++) {
      const x = 128 + (random() - .5) * 97, y = 128 + (random() - .5) * 94, r = 27 + random() * 53;
      const a = q.createRadialGradient(x, y, 0, x, y, r);
      a.addColorStop(0, 'rgba(166,168,166,.24)'); a.addColorStop(.48, 'rgba(133,139,140,.17)'); a.addColorStop(1, 'rgba(106,113,119,0)');
      q.fillStyle = a; q.fillRect(x-r, y-r, r*2, r*2);
    }
  } else {
    q.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) {
      const x = 128 + (random() - .5) * 74, y = 143 + (random() - .5) * 76, r = 22 + random() * 49;
      const a = q.createRadialGradient(x, y, 0, x, y, r);
      a.addColorStop(0, 'rgba(255,253,213,.46)'); a.addColorStop(.19, 'rgba(255,215,115,.39)');
      a.addColorStop(.48, 'rgba(255,102,24,.22)'); a.addColorStop(.78, 'rgba(145,34,10,.07)'); a.addColorStop(1, 'rgba(60,9,4,0)');
      q.fillStyle = a; q.fillRect(x-r, y-r, r*2, r*2);
    }
  }
  const map = new T.CanvasTexture(c); map.colorSpace = T.SRGBColorSpace; textures[kind] = map; return map;
}
function sprite(g, materials, kind, additive = false) {
  const mat = new T.SpriteMaterial({map:texture(kind), color:'#ffffff', transparent:true, opacity:0, depthWrite:false, blending:additive?T.AdditiveBlending:T.NormalBlending, toneMapped:!additive});
  const s = new T.Sprite(mat); s.visible = false; g.add(s); materials.push(mat); return s;
}
function fireSource(type) {
  return type==='policeCar'||type==='civilianCar' ? [[-3,4,-7],[3,4,-7]] : type==='sr71' ? [[-33,0,48],[33,0,48]] : type==='blackhawk' ? [[-8,12,15],[8,12,15]] : type==='ufo' ? [[-21,-3,8],[16,-2,14]] : [[-5,-2,40],[5,-2,40]];
}
export function createWreckEffects({type='fighter', seed=1}={}) {
  const g = new T.Group(); g.name = 'burning-aircraft-effects'; const random=rng(seed), materials=[];
  const smoke = Array.from({length:36},()=>({sprite:sprite(g,materials,'smoke'),active:false,position:new T.Vector3(),velocity:new T.Vector3(),age:0,life:3.6,size:10,spin:random()*6.28}));
  const flames = Array.from({length:7},(_,i)=>({sprite:sprite(g,materials,'fire',true),phase:random()*6.28,source:i%2,spread:(i-3)*1.25}));
  const blast = Array.from({length:7},(_,i)=>({sprite:sprite(g,materials,'fire',true),dir:new T.Vector3((random()-.5)*1.9,.15+random()*.7,(random()-.5)*1.9),phase:random()*6.28,delay:i*.025}));
  const coreMaterial = new T.MeshBasicMaterial({color:'#fff1ca',transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}); materials.push(coreMaterial);
  const core = new T.Mesh(sphere, coreMaterial); core.visible=false; g.add(core);
  const shockMaterial = new T.MeshBasicMaterial({color:'#b69b76',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}); materials.push(shockMaterial);
  const shock = new T.Mesh(ringGeometry,shockMaterial); shock.rotation.x=-Math.PI/2;shock.visible=false;g.add(shock);
  const debrisMaterial = new T.MeshStandardMaterial({color:'#292b28',roughness:.94,metalness:.25});materials.push(debrisMaterial);
  const debris = Array.from({length:12},()=>{const o=new T.Mesh(debrisGeometry,debrisMaterial);o.castShadow=true;o.visible=false;o.scale.set(1+random()*3,.7+random()*1.3,2+random()*5);g.add(o);return {mesh:o,velocity:new T.Vector3((random()-.5)*130,35+random()*90,(random()-.5)*130),spin:new T.Vector3(random()*5,random()*5,random()*5)};});
  const light = new T.PointLight('#ff9f45',0,330,1.9);g.add(light);
  g.userData.effectState = {type,random,materials,smoke,smokeIndex:0,smokeClock:0,flames,blast,core,shock,debris,light,sources:fireSource(type),impactStarted:false,impactOrigin:new T.Vector3()};
  return g;
}
function emitSmoke(e, source, scale=1, burst=false) {
  const p=e.smoke[e.smokeIndex++%e.smoke.length],r=e.random;p.active=true;p.age=0;p.life=burst?4.8:3.8;
  p.position.copy(source).add(new T.Vector3((r()-.5)*9,3+(r()-.5)*5,(r()-.5)*9));
  p.velocity.set(4+r()*9,burst?20+r()*36:16+r()*14,(r()-.3)*9);p.size=(burst?17+r()*19:8+r()*9)*scale;p.spin=r()*6.28;p.sprite.visible=true;
}
export function updateWreckEffects(g,wreck,{dt=.016,time=0,reduced=false,groundHeight=()=>0}={}) {
  const e=g.userData.effectState;if(!e)return;
  const step=Math.min(.06,Math.max(0,dt)),impact=!!wreck.impacted,t=Math.max(0,wreck.impactAge||0),origin=new T.Vector3(wreck.x,GROUND-wreck.y,wreck.z);
  const attitude=new T.Quaternion().setFromEuler(new T.Euler(wreck.pitch||0,(wreck.heading||0)+(e.type==='policeCar'||e.type==='civilianCar'?Math.PI:0),wreck.roll||0));
  const sources=e.sources.map(a=>new T.Vector3(...a).applyQuaternion(attitude));
  const life=impact?Math.max(.1,1-t/11):1;
  if(impact&&!e.impactStarted){e.impactStarted=true;e.impactOrigin.copy(origin);for(let i=0;i<16;i++)emitSmoke(e,origin,1.1,true);}
  e.smokeClock+=step;const interval=impact?.12:.095;
  while(e.smokeClock>=interval){e.smokeClock-=interval;const source=impact?new T.Vector3((e.random()-.5)*24,3,(e.random()-.5)*18):sources[e.smokeIndex%sources.length];emitSmoke(e,source.clone().add(origin),impact?1.15:1);}
  for(const p of e.smoke){if(!p.active)continue;p.age+=step;if(p.age>=p.life){p.active=false;p.sprite.visible=false;continue;}
    p.position.addScaledVector(p.velocity,step);const f=p.age/p.life,expand=p.size*(1+f*2.7);
    p.sprite.position.copy(p.position).sub(origin);p.sprite.scale.set(expand*(1+f*.35),expand,1);p.sprite.material.rotation=p.spin+f*.4;
    p.sprite.material.opacity=Math.min(1,p.age/.18)*(1-f)*(.58+(impact?.12:0))*life;
    p.sprite.material.color.setRGB(.18+f*.09,.19+f*.09,.20+f*.1);
  }
  for(let i=0;i<e.flames.length;i++){const f=e.flames[i],wave=reduced?1:.82+Math.sin(time*15+f.phase)*.16+Math.sin(time*23+i)*.07;
    const base=impact?new T.Vector3((i-3)*4,0,Math.sin(f.phase)*9):sources[f.source%sources.length].clone();
    base.x+=f.spread;base.y+=(impact?11:4)+(i%3)*3;
    f.sprite.position.copy(base);const size=(impact?23:15)*wave*life;f.sprite.scale.set(size*.74,size*(1.25+(i%3)*.18),1);
    f.sprite.material.rotation=Math.sin(time*4+f.phase)*.12;f.sprite.material.opacity=(impact?.70:.57)*life;f.sprite.visible=life>.06;
  }
  e.core.visible=impact&&t<.25;e.core.position.set(0,7,0);const coreSize=4+t*68;e.core.scale.set(coreSize,coreSize*.8,coreSize);e.core.material.opacity=impact?Math.max(0,1-t/.25)*(reduced?.3:.72):0;
  for(const b of e.blast){const a=Math.max(0,t-b.delay),f=a/1.35;b.sprite.visible=impact&&t>=b.delay&&f<1;if(!b.sprite.visible)continue;
    b.sprite.position.copy(b.dir).multiplyScalar(a*32);b.sprite.position.y+=8+a*24;const size=19+Math.sin(Math.min(1,f)*Math.PI*.66)*65;
    b.sprite.scale.set(size,size*(.9+f*.3),1);b.sprite.material.opacity=Math.pow(1-f,1.65)*.83*(reduced?.65:1);b.sprite.material.rotation=b.phase+f*.9;
  }
  e.shock.visible=impact&&t<1.15;const radius=8+t*120;e.shock.scale.setScalar(radius);e.shock.material.opacity=Math.max(0,1-t/1.15)*.24;
  e.shock.position.set(0,groundHeight(wreck.x,wreck.z)-origin.y+.7,0);
  for(const d of e.debris){d.mesh.visible=impact&&t<5.8;if(!d.mesh.visible)continue;
    d.mesh.position.copy(d.velocity).multiplyScalar(t);d.mesh.position.y+=5-55*t*t;
    const floor=groundHeight(wreck.x+d.mesh.position.x,wreck.z+d.mesh.position.z)-origin.y+1;
    if(d.mesh.position.y<floor){d.mesh.position.y=floor;d.mesh.position.x*=Math.max(.4,1-(t-1)*.07);d.mesh.position.z*=Math.max(.4,1-(t-1)*.07);}else d.mesh.rotation.set(d.spin.x*t,d.spin.y*t,d.spin.z*t);
  }
  e.light.position.set(0,impact?12:3,0);e.light.intensity=(impact?Math.max(750*life,21000*Math.exp(-t*5)):1400)*(reduced?.65:1);
}
export function charWreckModel(ship) {
  const copies=new Map();ship.traverse(o=>{if(o.isLight){o.intensity=0;return;}if(!o.isMesh)return;
    const convert=m=>{if(copies.has(m))return copies.get(m);const c=m.clone();c.onBeforeCompile=m.onBeforeCompile;c.customProgramCacheKey=m.customProgramCacheKey;
      c.color?.multiplyScalar(.16);if(c.emissive)c.emissive.set('#080603');if('emissiveIntensity'in c)c.emissiveIntensity=.03;if('roughness'in c)c.roughness=.95;if('metalness'in c)c.metalness*=.35;copies.set(m,c);return c;};
    o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
  });return [...copies.values()];
}
export function disposeWreckEffects(g) {
  const e=g?.userData.effectState;if(!e)return;for(const m of e.materials)m.dispose();g.clear();delete g.userData.effectState;
}
