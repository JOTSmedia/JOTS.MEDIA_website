import * as THREE from './vendor/three.module.min.js';

// Original aircraft artwork, built locally from shaped aerodynamic surfaces.
// Aircraft face -Z, with Y up. Geometry and paint maps are shared by instances.
const templates = new Map();
const Y = new THREE.Vector3(0, 1, 0);
const metalMaterials = new Map();
let aircraftDetailTexture;
function detailTexture() {
  if (!aircraftDetailTexture) {
    aircraftDetailTexture = new THREE.TextureLoader().load('./assets/generated/aerospace-metal.png');
    aircraftDetailTexture.colorSpace = THREE.SRGBColorSpace;
    aircraftDetailTexture.wrapS = aircraftDetailTexture.wrapT = THREE.RepeatWrapping;
    aircraftDetailTexture.anisotropy = 4;
  }
  return aircraftDetailTexture;
}
function photographicPaintDetail(material) {
  const detail = detailTexture();
  material.onBeforeCompile = shader => {
    shader.uniforms.aircraftPhotographicDetail = { value: detail };
    shader.fragmentShader = 'uniform sampler2D aircraftPhotographicDetail;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n#ifdef USE_MAP\nvec3 photoDetail = texture2D(aircraftPhotographicDetail, vMapUv).rgb;\ndiffuseColor.rgb *= mix(vec3(1.0), clamp(photoDetail * 3.45, vec3(0.38), vec3(1.6)), 0.42);\n#endif');
  };
  material.customProgramCacheKey = () => 'aircraft-photo-skin-v1';
  material.userData.generatedTexture = './assets/generated/aerospace-metal.png';
  return material;
}
let seed = 317;
function random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
function skinMap(base, kind) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const c = canvas.getContext('2d'); c.fillStyle = base; c.fillRect(0, 0, 1024, 1024);
  // Hand-sized maintenance panels, paint repairs, oil stains and fasteners.
  for (let row = 0; row < 10; row++) for (let col = 0; col < 7; col++) {
    const x = col * 146 + (row % 2) * 37, y = row * 103;
    c.fillStyle = `rgba(${random() > .5 ? '225,231,223' : '0,0,0'},${.003 + random() * .009})`;
    c.fillRect(x + 2, y + 2, 142, 99);
    c.strokeStyle = kind === 'black' ? '#03060888' : '#10182045'; c.lineWidth = 1;
    c.strokeRect(x + 1, y + 1, 144, 101);
    c.strokeStyle = '#c5c9bd17'; c.strokeRect(x + 2, y + 2, 142, 99);
    c.fillStyle = '#1013158a';
    for (let n = 10; n < 140; n += 13) { c.fillRect(x + n, y + 5, 1, 1); c.fillRect(x + n, y + 97, 1, 1); }
    for (let n = 14; n < 98; n += 13) { c.fillRect(x + 5, y + n, 1, 1); c.fillRect(x + 140, y + n, 1, 1); }
    if (random() > .5) { c.strokeStyle = '#0b10152b'; c.beginPath(); c.arc(x + 112, y + 42, 12, 0, Math.PI * 2); c.stroke(); }
  }
  const pixels = c.getImageData(0, 0, 1024, 1024);
  for (let i = 0; i < pixels.data.length; i += 4) { const n = (random() - .5) * 4; for (let j = 0; j < 3; j++) pixels.data[i + j] += n; }
  c.putImageData(pixels, 0, 0);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4; return tex;
}
function paint(base, kind = 'grey') {
  const key = base + kind; if (metalMaterials.has(key)) return metalMaterials.get(key);
  const m = new THREE.MeshStandardMaterial({color: '#ffffff', map: skinMap(base, kind), roughness: kind === 'black' ? .65 : .76, metalness: kind === 'heli' ? .16 : .25});
  photographicPaintDetail(m); metalMaterials.set(key, m); return m;
}
const plain = (color, roughness = .7, metalness = .3) => new THREE.MeshStandardMaterial({color, roughness, metalness});
let palette;
function materials() {
  if (palette) return palette;
  palette = {
    fighter: paint('#68737a'), underside: paint('#7c8789'), radome: plain('#4f5b63', .83, .08),
    black: paint('#20272d', 'black'), blackHot: paint('#383d42', 'black'), heli: paint('#3c443b', 'heli'),
    dark: plain('#151b1e', .85, .25), steel: plain('#6d777a', .36, .86), burnt: plain('#353536', .61, .8),
    glass: new THREE.MeshPhysicalMaterial({color: '#101e24', metalness: .08, roughness: .16, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: .9}),
    rubber: plain('#101215', .98, .05), ivory: plain('#a8ada4', .82, .08), marking: plain('#333c3f', .85, .12),
    red: plain('#742d2a', .75, .12), navRed: new THREE.MeshBasicMaterial({color: '#ff4130'}), navGreen: new THREE.MeshBasicMaterial({color: '#44e1a7'}),
    navWhite: new THREE.MeshBasicMaterial({color: '#e9f1dd'}), exhaust: new THREE.MeshStandardMaterial({color:'#312e2e',emissive:'#bd5a24',emissiveIntensity:.35,roughness:.8})
  }; return palette;
}
function mesh(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
function box(p, w, h, d, mat, x = 0, y = 0, z = 0) { return mesh(p, new THREE.BoxGeometry(w,h,d),mat,x,y,z); }
function cylinder(p, radiusA, radiusB, length, mat, x = 0, y = 0, z = 0, axis = 'z', sides = 20) {
  const o = mesh(p, new THREE.CylinderGeometry(radiusA,radiusB,length,sides,1,false),mat,x,y,z);
  if (axis === 'z') o.rotation.x = Math.PI / 2; if (axis === 'x') o.rotation.z = Math.PI / 2; return o;
}
function rod(p, from, to, radius, mat) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a);
  const o = mesh(p,new THREE.CylinderGeometry(radius,radius,d.length(),6),mat);o.position.copy(a.add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(Y,d.normalize());return o;
}
function loft(parent, stations, mat, radial = 24, exponent = 1) {
  // Each station is [Z, half width, half height, vertical centre].
  const pos = [], uv = [], indices = [], start = stations[0][0], length = stations.at(-1)[0] - start;
  stations.forEach(([z,w,h,cy=0], i) => {
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      pos.push(Math.sign(ca)*Math.pow(Math.abs(ca),exponent)*w,cy+Math.sign(sa)*Math.pow(Math.abs(sa),exponent)*h,z);uv.push(j/radial,(z-start)/length);
      if (i < stations.length-1 && j < radial) {const a = i*(radial+1)+j, b = a+radial+1;indices.push(a,a+1,b,a+1,b+1,b);}
    }
  });
  const geo = new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return mesh(parent,geo,mat);
}
function polygon(p, points, thickness, mat) {
  // A thin airframe plate with an upper surface bevel, all points in X,Z.
  const s = new THREE.Shape(); points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z)); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.24,bevelThickness:.18});
  geo.rotateX(-Math.PI/2);geo.translate(0,-thickness/2,0);
  const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+60)/120,(pos.getZ(i)+85)/160);
  return mesh(p,geo,mat);
}
function fin(p, points, thickness, mat) {
  // Points are Z,Y, surface aligned in the vertical plane.
  const shape=new THREE.Shape(); points.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.2,bevelThickness:.15,bevelSegments:1});
  geo.rotateY(-Math.PI/2);geo.translate(-thickness/2,0,0);
  const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getZ(i)+85)/160,pos.getY(i)/45);
  return mesh(p,geo,mat);
}
function glazing(p, vertices, mat) {
  const g = new THREE.BufferGeometry(); const positions = vertices.flat(); const index=[];
  for(let i=1;i<vertices.length-1;i++)index.push(0,i,i+1);
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap(v=>[(v[0]+20)/40,(v[2]+45)/100]),2));g.setIndex(index);g.computeVertexNormals();
  const m=mesh(p,g,mat);m.material.side=THREE.DoubleSide;return m;
}
function line(p, points, mat, radius=.14) { for(let i=1;i<points.length;i++)rod(p,points[i-1],points[i],radius,mat); }
function nav(p,x,y,z,mat) { return mesh(p,new THREE.SphereGeometry(.65,8,6),mat,x,y,z); }
function ring(p,radius,thickness,mat,x,y,z) {const m=mesh(p,new THREE.TorusGeometry(radius,thickness,5,24),mat,x,y,z);return m;}
function exhaust(p, x, y, z, radius, m) {
  cylinder(p,radius,radius*.94,8,m.burnt,x,y,z-2);
  cylinder(p,radius*.83,radius*.83,1,m.dark,x,y,z+2.2);
  cylinder(p,radius*.56,radius*.56,.4,m.exhaust,x,y,z+2.8);
  ring(p,radius,.45,m.steel,x,y,z+2.5);
  for(let n=0;n<16;n++){const a=n/16*Math.PI*2;rod(p,[x+Math.cos(a)*radius,y+Math.sin(a)*radius,z-5],[x+Math.cos(a)*radius*.95,y+Math.sin(a)*radius*.95,z+2],.16,m.steel);}
}
function decal(p, text, width, height, x,y,z, color='#aab1af',rotation=0) {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');
  c.clearRect(0,0,256,128);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='bold 67px monospace';c.fillText(text,128,64);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide});
  const o=mesh(p,new THREE.PlaneGeometry(width,height),mat,x,y,z);o.rotation.set(-Math.PI/2,0,rotation);return o;
}
function missile(p,x,z,m) {
  loft(p,[[-14,.01,.01],[-11,.6,.6],[-8,1,1],[8,1,1],[11,.7,.7],[12,.01,.01]],m.ivory,12).position.set(x,-5,z);
  const blade=polygon(p,[[x-.5,z+4],[x-3.6,z+10],[x+3.6,z+10],[x+.5,z+4]],.25,m.ivory);blade.position.y=-5;
  const f=fin(p,[[z+4,-5],[z+10,-1.3],[z+10,-8.7]],.3,m.ivory);f.position.x=x;
  box(p,1,4,8,m.dark,x,-2,z);
}
function fighterModel() {
  const m=materials(),root=new THREE.Group();root.name='fighter';
  loft(root,[[-73,.08,.08],[-65,2.5,2.5],[-51,4.5,4],[-39,6,4.6],[-24,7.7,5.5,1],[-8,10,6.4],[11,11.5,7],[28,11,6.5],[43,8.5,5],[54,6.5,4]],m.fighter,32);
  loft(root,[[-73,.09,.09],[-65,2.55,2.55],[-51,4.55,4.05]],m.radome,32);
  // Leading-edge extensions and tapered, swept wings: a recognizable strike fighter silhouette.
  for(const s of [-1,1]) {
    polygon(root,[[s*5,-41],[s*10,-27],[s*16,-4],[s*10,17],[s*7,-6]],.9,m.fighter).position.y=1;
    polygon(root,[[s*9,-10],[s*42,16],[s*43,28],[s*29,30],[s*10,20]],1.2,m.fighter).position.y=-.1;
    polygon(root,[[s*8,31],[s*23,43],[s*25,55],[s*7,50]],.8,m.fighter).position.y=.5;
    const tail=fin(root,[[19,4],[31,28],[42,27],[51,3]],.85,m.fighter);tail.position.x=s*8.2;tail.rotation.z=-s*.24;
    // Split rudder, aileron, leading-edge and flap joints.
    line(root,[[s*16,-3,.4],[s*33,.2,14],[s*41,.2,18]],m.marking,.11);
    line(root,[[s*13,.8,18],[s*29,.8,27],[s*42,.8,25]],m.marking,.13);
    line(root,[[s*8,1,43],[s*22,1,51]],m.marking,.13);
    line(root,[[s*9,9,43],[s*10.5,24,38]],m.marking,.12);
    // Engine shoulders, underwing intake lips and recessed inlet cavities.
    const engine=loft(root,[[-12,3.5,4],[-3,5,5.5],[28,5,5.8],[47,4.9,4.9]],m.fighter,24);engine.position.set(s*5.9,-2,0);
    const inlet=loft(root,[[-25,4.3,3.5],[-23,4.6,3.8],[-9,5,4]],m.underside,8,.5);inlet.position.set(s*7,-4,0);
    const hole=glazing(root,[[s*3.1,-2.3,-25.2],[s*11,-2.3,-25.2],[s*11,-7.3,-25.2],[s*3.1,-7.3,-25.2]],m.dark);
    exhaust(root,s*5.6,-2,52,4.4,m);
    missile(root,s*26,14,m);missile(root,s*41,18,m);
    cylinder(root,.7,.7,12,m.steel,s*42,-.3,20);nav(root,s*43,.5,26,s<0?m.navRed:m.navGreen);
    // Wing pylons and flush maintenance hatches.
    for(const xx of [18,29])box(root,.8,3,11,m.fighter,s*xx,-2,14);
    decal(root,'07',8,5,s*29,1,20,'#444d51',s<0?Math.PI/2:-Math.PI/2);
  }
  const canopy=loft(root,[[-43,.05,.05,5],[-40,3,2.5,6],[-33,4.4,4.1,7],[-21,4.5,4.3,7],[-12,2.7,2.3,6],[-9,.1,.1,5.8]],m.glass,20);
  // Structural canopy bow and cockpit sill, not a toy bubble.
  for(const z of [-36,-16]){const pts=[];for(let j=0;j<=12;j++){const a=j/12*Math.PI;pts.push([Math.cos(a)*4.45,6.8+Math.sin(a)*4.55,z]);}line(root,pts,m.fighter,.26);}
  line(root,[[-4.4,7,-34],[-4.5,7,-21],[-2.8,6,-12]],m.fighter,.25);line(root,[[4.4,7,-34],[4.5,7,-21],[2.8,6,-12]],m.fighter,.25);
  rod(root,[0,11,-34],[0,11.4,-18],.12,m.fighter);
  cylinder(root,.14,.22,5,m.steel,0,0,-76);
  box(root,.55,3,3,m.dark,0,7,17);nav(root,0,8.5,17,m.navWhite);
  return root;
}
function blackbirdModel() {
  const m=materials(),root=new THREE.Group();root.name='sr71';
  loft(root,[[-85,.05,.04],[-76,2.2,1.4],[-62,4.3,2.5],[-48,6,4.2],[-32,7.4,5.2],[-13,8.2,5.7],[12,9,5],[37,8.6,4.3],[57,4.3,2.1],[68,.08,.04]],m.black,32);
  // Continuous sharp chines make the SR-71 a lifting body, extending into the delta.
  for(const s of [-1,1]){
    polygon(root,[[0,-84],[s*7,-58],[s*12,-31],[s*20,-8],[s*47,30],[s*56,52],[s*32,57],[s*9,48],[s*6,9]],.75,m.black).position.y=.2;
    // Large J58 nacelles with extended inlet spikes and metallic exhaust petals.
    const nacelle=loft(root,[[-39,5.7,5.7],[-32,7,7],[-13,8,8],[18,8.1,8.1],[39,7.6,7.6],[58,7.2,7.2]],m.black,32);nacelle.position.x=s*34;
    cylinder(root,5.7,5.7,.7,m.dark,s*34,0,-39.4);
    const spike=loft(root,[[-56,.05,.05],[-48,2.5,2.5],[-36,4.7,4.7],[-31,5,5]],m.blackHot,24);spike.position.x=s*34;
    // Inlet bleed band and cowling service rings.
    ring(root,7,.16,m.blackHot,s*34,0,-28);
    ring(root,8.16,.14,m.blackHot,s*34,0,2);
    ring(root,8,.15,m.blackHot,s*34,0,26);
    exhaust(root,s*34,0,64,7.1,m);
    const tail=fin(root,[[21,5],[37,30],[47,29],[57,5]],1,m.black);tail.position.x=s*34;tail.rotation.z=-s*.25;
    line(root,[[s*34.5,8,49],[s*39,26,44]],m.blackHot,.15);
    // Distinct elevon joints and high-temperature panel stitching.
    line(root,[[s*9,.85,39],[s*25,.85,47],[s*53,.85,49]],m.blackHot,.13);
    line(root,[[s*12,.85,-20],[s*18,.85,-1],[s*26,.85,13]],m.blackHot,.1);
    decal(root,'179',12,5,s*18,1,36,'#656d6b',s<0?Math.PI/2:-Math.PI/2);
    box(root,.3,.3,16,m.red,s*22,1,25);nav(root,s*55,1,51,s<0?m.navRed:m.navGreen);
    // Corrugated heat-expansion strips along the nacelles.
    for(let j=0;j<11;j++)rod(root,[s*(29+j*.9),6.7,8],[s*(29+j*.9),6.7,33],.07,m.blackHot);
  }
  const canopy=loft(root,[[-58,.05,.04,3],[-54,2.5,1.8,4],[-48,3.4,3,5],[-39,3.5,3,5.5],[-31,2,1.7,5],[-28,.1,.1,4]],m.glass,8,.65);
  for(const z of [-51,-42,-34]){
    line(root,[[-3,5,z],[-2,7.7,z],[2,7.7,z],[3,5,z]],m.black,.28);
  }
  line(root,[[0,8.1,-51],[0,8.5,-40],[0,7,-33]],m.black,.2);
  cylinder(root,.12,.17,4,m.steel,0,0,-87);
  return root;
}
function blackhawkModel() {
  const m=materials(),root=new THREE.Group();root.name='blackhawk';
  // UH-60 cabin is a flattened, slab-sided airframe with a sloping armored nose.
  loft(root,[[-40,.1,.1,-3],[-35,6,4,-3],[-29,11.5,5,-3],[-23,13,6,-2],[-17,14,11.4,0],[5,14.5,11.7,0],[24,11,9,1],[33,6,5,3]],m.heli,16,.7);
  loft(root,[[24,6,5,3],[43,3.9,3.5,6],[63,2.9,2.6,10],[84,1.5,1.8,15]],m.heli,12);
  // Windscreen panels are actual planar glazing with visible armored frames.
  for(const s of [-1,1]){
    const front=[[s*.7,12.0,-21.8],[s*11.8,9.6,-25.2],[s*10.6,1.9,-33.7],[s*.7,2.3,-37.8]];
    glazing(root,front,m.glass);line(root,[...front,front[0]],m.heli,.42);
    glazing(root,[[s*.7,12,-21.8],[s*11.8,9.6,-25.2],[s*14.1,10,-15],[s*.7,12,-14]],m.heli);
    const side=[[s*12.2,9.2,-24],[s*14.8,9.8,-15],[s*14.8,1.9,-13],[s*12.5,1.9,-28.5]];
    glazing(root,side,m.glass);line(root,[...side,side[0]],m.heli,.38);
    // Sliding troop cabin door, two rectangular windows and horizontal door track.
    box(root,.45,19,28,m.heli,s*14.15,-.9,6);
    for(const z of [-2,10]){
      const pane=[[s*14.45,7,z-4.6],[s*14.45,7,z+4.6],[s*14.45,.3,z+4.6],[s*14.45,.3,z-4.6]];
      glazing(root,pane,m.glass);line(root,[...pane,pane[0]],m.dark,.25);
    }
    line(root,[[s*14.65,9.2,-9],[s*14.65,9.2,20],[s*14.65,-10,20],[s*14.65,-10,-9]],m.dark,.17);
    rod(root,[s*14.8,10,-11],[s*14.8,10,25],.28,m.steel);box(root,.4,.5,2.8,m.steel,s*14.8,-.7,16);
    // Twin turbine pods, recessed intakes, heat shields and trailing exhausts.
    const turbine=loft(root,[[-17,.4,.4],[-14,4.2,4.2],[-9,5,5],[9,5,4.6],[19,4,3.6]],m.heli,16);turbine.position.set(s*8,12,1);
    cylinder(root,3.3,3.3,1,m.dark,s*8,12,-14);
    ring(root,3.5,.25,m.steel,s*8,12,-14.3);
    cylinder(root,3,3.3,7,m.burnt,s*9,12,21);cylinder(root,2.6,2.6,.3,m.dark,s*9,12,25);
    for(let i=0;i<7;i++)box(root,.7,2,.35,m.dark,s*12,15,-5+i*2.5);
    // Long-stroke main landing gear, tires and hubs, located ahead of the cabin.
    rod(root,[s*9,-7,-17],[s*16,-17,-15],.7,m.steel);rod(root,[s*13,-4,-15],[s*16,-17,-15],.55,m.heli);
    cylinder(root,3.1,3.1,2.3,m.rubber,s*16,-18,-15,'x',16);cylinder(root,1,1,2.5,m.steel,s*16,-18,-15,'x',12);
    rod(root,[s*13,-10,-5],[s*18,-11,15],.45,m.heli);
    box(root,1.2,1,28,m.heli,s*17,-11,5);
    // Compact weapon mount and door-mounted barrel.
    rod(root,[s*14,-1,13],[s*19,-1,10],.65,m.dark);cylinder(root,.45,.5,12,m.dark,s*19,-1,3);
    nav(root,s*14.8,1,-14,s<0?m.navRed:m.navGreen);
    const number=decal(root,'206',12,5,s*9,11,10,'#878e7b',Math.PI/2);
  }
  // Aft stabilator and raised tail pylon with a canted four-blade anti-torque rotor.
  polygon(root,[[-2,63],[-19,69],[-18,76],[0,73],[18,76],[19,69],[2,63]],.9,m.heli).position.y=10;
  const tail=fin(root,[[72,11],[79,36],[85,38],[88,14]],1.8,m.heli);
  line(root,[[-1,17,80],[-1,33,82]],m.dark,.15);
  rod(root,[0,-5,40],[0,-12,46],.65,m.steel);cylinder(root,2.3,2.3,2,m.rubber,0,-13,46,'x',14);
  // Transmission and exposed mast linkages.
  loft(root,[[-9,6,2,15],[0,7,4,15],[12,4,2.5,15],[18,.2,.2,15]],m.heli,12);
  cylinder(root,2,2,11,m.steel,0,21,0,'y',16);cylinder(root,4,4,2,m.dark,0,24,0,'y',16);
  for(const s of [-1,1])rod(root,[s*4,17,3],[s*2,25,-2],.35,m.steel);
  const rotor=new THREE.Group();rotor.name='mainRotor';rotor.position.set(0,28,0);root.add(rotor);
  cylinder(rotor,4.2,4.2,1.5,m.dark,0,0,0,'y',16);
  for(let i=0;i<4;i++) {
    const blade=new THREE.Group();blade.rotation.y=i*Math.PI/2;rotor.add(blade);
    rod(blade,[0,0,0],[0,0,12],.8,m.steel);
    polygon(blade,[[-1.5,8],[-2,24],[-1.5,57],[-.3,64],[2.8,64],[2.1,26],[1.6,8]],.35,m.dark);
    rod(blade,[-1.7,.15,15],[-1.2,.15,58],.1,m.steel);
    box(blade,3,.4,1.4,m.ivory,.7,0,60);
  }
  // Semitransparent rotor disc only adds a slight photographic motion smear.
  const blur=mesh(rotor,new THREE.RingGeometry(14,64,64),new THREE.MeshStandardMaterial({color:'#62695e',transparent:true,opacity:.035,roughness:1,side:THREE.DoubleSide,depthWrite:false}));blur.rotation.x=-Math.PI/2;
  const tailRotor=new THREE.Group();tailRotor.name='tailRotor';tailRotor.position.set(3.2,30,82);root.add(tailRotor);
  cylinder(tailRotor,1.5,1.5,3,m.steel,0,0,0,'x',12);
  for(let i=0;i<4;i++){
    const blade=box(tailRotor,.35,12,1.8,m.dark,0,6,0);blade.geometry.translate(0,6,0);blade.position.y=0;blade.rotation.x=i*Math.PI/2;
  }
  rod(root,[0,9,-35],[0,15,-39],.18,m.dark);rod(root,[0,13,29],[0,21,39],.2,m.dark);
  box(root,1,.4,6,m.dark,0,-11,-27);nav(root,0,17,19,m.navRed);
  return root;
}
function mergeStatic(group, exclusions = new Set()) {
  const batches=new Map(),remove=[];group.updateMatrixWorld(true);
  group.traverse(obj=>{
    if(!obj.isMesh || exclusions.has(obj.parent))return;
    for(let parent=obj.parent;parent;parent=parent.parent)if(exclusions.has(parent))return;
    const mat=obj.material;if(Array.isArray(mat))return;
    let batch=batches.get(mat);if(!batch){batch={p:[],n:[],uv:[]};batches.set(mat,batch);}
    const geo=obj.geometry.index?obj.geometry.toNonIndexed():obj.geometry;
    const pos=geo.attributes.position,normals=geo.attributes.normal,uv=geo.attributes.uv;
    const relative=new THREE.Matrix4().copy(group.matrixWorld).invert().multiply(obj.matrixWorld),normalMat=new THREE.Matrix3().getNormalMatrix(relative),v=new THREE.Vector3(),n=new THREE.Vector3();
    for(let i=0;i<pos.count;i++) {v.fromBufferAttribute(pos,i).applyMatrix4(relative);n.fromBufferAttribute(normals,i).applyMatrix3(normalMat).normalize();batch.p.push(v.x,v.y,v.z);batch.n.push(n.x,n.y,n.z);batch.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0);}
    remove.push(obj);
  });
  for(const o of remove)o.parent.remove(o);
  for(const [mat,b]of batches){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));geo.computeBoundingSphere();mesh(group,geo,mat);}
}
export function createAircraft(type='fighter') {
  if(!templates.has(type)){
    const g=type==='blackhawk'?blackhawkModel():type==='sr71'?blackbirdModel():fighterModel();
    const rotor=g.getObjectByName('mainRotor'),tailRotor=g.getObjectByName('tailRotor');
    mergeStatic(g,new Set([rotor,tailRotor].filter(Boolean)));
    if(rotor)mergeStatic(rotor);if(tailRotor)mergeStatic(tailRotor);
    templates.set(type,g);
  }
  const model=templates.get(type).clone(true);
  model.userData.aircraftType=type;model.userData.assetStyle='original-detailed-airframe';
  const rotor=model.getObjectByName('mainRotor'),tailRotor=model.getObjectByName('tailRotor');
  if(rotor){model.userData.rotor=rotor;model.userData.tailRotor=tailRotor;}
  return model;
}

// Fictional TR-3B-inspired airframe: original artwork for the game's selectable UFO.
// This design is speculative science fiction, not a representation of a verified aircraft.
function triangularHull(parent,outline,rings,mat){
  const p=[],uv=[],idx=[],n=outline.length;
  for(const [scale,y]of rings)for(const [x,z]of outline){p.push(x*scale,y,z*scale);uv.push((x*scale+55)/110,(z*scale+60)/105);}
  for(let r=0;r<rings.length-1;r++)for(let j=0;j<n;j++){const k=(j+1)%n,a=r*n+j,b=(r+1)*n+j,c=r*n+k,d=(r+1)*n+k;idx.push(a,c,b,b,c,d);}
  const low=p.length/3;p.push(0,rings[0][1],0);uv.push(.5,.5);const high=p.length/3;p.push(0,rings.at(-1)[1],0);uv.push(.5,.5);
  for(let j=0;j<n;j++){const k=(j+1)%n;idx.push(low,k,j);idx.push(high,(rings.length-1)*n+j,(rings.length-1)*n+k);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return mesh(parent,geo,mat);
}
function triangleUfoModel(){
  const g=new THREE.Group();g.name='TR-3B-inspired triangle';const m=materials();
  const skin=paint('#283136','black'),edge=plain('#414c50',.53,.5),seams=plain('#101a1e',.84,.2),deck=paint('#364045','black');
  const engine=new THREE.MeshStandardMaterial({color:'#d1e8de',emissive:'#9dc8b5',emissiveIntensity:1.35,roughness:.35,metalness:.32});
  const core=new THREE.MeshStandardMaterial({color:'#8eafbd',emissive:'#718bba',emissiveIntensity:.68,roughness:.25,metalness:.4});
  const outline=[[0,-58],[-3,-55],[-48,28],[-49,32],[-45,37],[45,37],[49,32],[48,28],[3,-55]];
  const topY=(x,z)=>{const r=Math.max(z/37,(1.94*Math.abs(x)-z)/58);return r<.39?7:r<.9?7-(r-.39)/.51*2.9:4.1-(r-.9)*32;};
  const topLine=(points,mat,r=.12)=>line(g,points.map(([x,y,z])=>[x,topY(x,z)+.16,z]),mat,r);
  triangularHull(g,outline,[[.91,-6],[1,-2.5],[1,.9],[.9,4.1],[.39,7]],skin);
  // Brushed perimeter lip and raised faceted deck distinguish the aircraft in grazing light.
  for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];rod(g,[a[0]*.994,-1.3,a[1]*.994],[b[0]*.994,-1.3,b[1]*.994],.19,edge);}
  polygon(g,[[-2,-31],[-17,10],[-13,18],[13,18],[17,10],[2,-31]],.45,deck).position.y=7.18;
  // Small armored canopy with a shallow triangular profile, rather than a bubble dome.
  glazing(g,[[0,9,-20],[-6.5,7,-5],[0,7.8,3]],m.glass);
  glazing(g,[[0,9,-20],[0,7.8,3],[6.5,7,-5]],m.glass);
  line(g,[[0,9.1,-20],[0,7.9,3]],edge,.14);
  for(const s of [-1,1]){
    topLine([[s*2,3.9,-46],[s*35,3.9,18],[s*35,3.9,26]],seams,.15);
    topLine([[s*8,6,-17],[s*24,4.6,17],[s*17,5.1,24]],seams,.12);
    topLine([[s*18,4.8,4],[s*31,4.1,4],[s*38,3.3,19]],edge,.09);
    // Flush thermal shutters and trailing edge control surfaces.
    for(let j=0;j<5;j++){const x=s*(17+j*2.2),z=16+j*.1;box(g,1,.18,4.2,m.dark,x,topY(x,z)+.16,z);}
    topLine([[s*6,4.15,30],[s*37,3.25,30]],seams,.16);
    polygon(g,[[s*6,30],[s*36,30],[s*39,34],[s*7,34]],.25,edge).position.y=topY(20,32)+.15;
    nav(g,s*41,-1.2,28,s<0?m.navRed:m.navGreen);
  }
  // Three inset corner propulsion wells: concentric rings, dark centers and flush fasteners.
  for(const [x,z]of [[0,-39],[-32,23],[32,23]]){
    cylinder(g,7.5,7.1,1.1,m.dark,x,-6.1,z,'y',32);
    const rim=mesh(g,new THREE.TorusGeometry(6.75,.48,8,36),edge,x,-6.8,z);rim.rotation.x=Math.PI/2;
    const glow=mesh(g,new THREE.TorusGeometry(5.5,.58,8,36),engine,x,-7.05,z);glow.rotation.x=Math.PI/2;
    cylinder(g,4.75,4.75,.45,m.dark,x,-6.96,z,'y',24);
    cylinder(g,2.1,2.1,.2,core,x,-7.25,z,'y',24);
    for(let j=0;j<6;j++){const a=j/6*Math.PI*2;cylinder(g,.18,.18,.13,m.steel,x+Math.cos(a)*6.5,-7.4,z+Math.sin(a)*6.5,'y',6);}
  }
  cylinder(g,8.2,7.7,1,m.dark,0,-6.4,1,'y',36);
  const centerRing=mesh(g,new THREE.TorusGeometry(6.5,.32,8,40),core,0,-7.1,1);centerRing.rotation.x=Math.PI/2;
  cylinder(g,4.7,5.2,.65,edge,0,-7.15,1,'y',32);
  cylinder(g,2.8,2.8,.3,core,0,-7.55,1,'y',24);
  const underlight=new THREE.PointLight('#91c5ac',300,105,1.8);underlight.position.set(0,-9,0);g.add(underlight);
  // Recessed ventral laser aperture and paired weapon-bay seams.
  box(g,3.2,1.1,7.5,m.dark,0,-5.8,-21);box(g,.65,.3,2,core,0,-6.45,-23.1);
  for(const s of [-1,1])line(g,[[s*10,-6.2,-6],[s*19,-6.2,14],[s*14,-6.2,21]],seams,.14);
  mergeStatic(g);return g;
}
export function createTriangleUfo(){
  if(!templates.has('_tr3b'))templates.set('_tr3b',triangleUfoModel());
  const g=templates.get('_tr3b').clone(true);g.userData.ufoModel='tr3b';return g;
}
