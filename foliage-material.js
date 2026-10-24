import * as T from './vendor/three.module.min.js';
let atlas;const uniforms=[];
function map(){if(!atlas){atlas=new T.TextureLoader().load('./assets/generated/evergreen-atlas.png');atlas.colorSpace=T.SRGBColorSpace;atlas.repeat.set(.245,.97);atlas.offset.set(.0025,.015);atlas.anisotropy=8;}return atlas;}
function wind(material){material.onBeforeCompile=shader=>{const time={value:0};shader.uniforms.foliageTime=time;uniforms.push(time);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float foliageTime;').replace('#include <uv_vertex>',`#include <uv_vertex>
 #ifdef USE_INSTANCING
 vMapUv.x+=mod(abs(floor(instanceMatrix[3].x*.031+instanceMatrix[3].z*.017)),4.)*.25;
 #endif
 `).replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 float phase=instanceMatrix[3].x*.012+instanceMatrix[3].z*.017;
 transformed.x+=sin(foliageTime*.8+phase)*pow(max(0.,position.y)/84.,2.)*.65;
 transformed.z+=cos(foliageTime*.55+phase)*pow(max(0.,position.y)/84.,2.)*.3;
 #endif
 `);};material.customProgramCacheKey=()=> 'photo-foliage-wind-v1';return material;}
export function foliageGeometry(){const positions=[],uvs=[],indices=[];for(let i=0;i<3;i++){const a=i*Math.PI/3,x=Math.cos(a)*21,z=Math.sin(a)*21,n=positions.length/3;positions.push(-x,0,-z,x,0,z,x,84,z,-x,84,-z);uvs.push(0,0,1,0,1,1,0,1);indices.push(n,n+1,n+2,n,n+2,n+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;}
export function foliageMaterial(stage){return wind(new T.MeshStandardMaterial({map:map(),color:stage===5?'#d5ded8':'#d1d9c5',alphaTest:.48,side:T.DoubleSide,roughness:1,metalness:0,envMapIntensity:.3}));}
export function foliageDepth(){return wind(new T.MeshDepthMaterial({map:map(),alphaTest:.48,depthPacking:T.RGBADepthPacking,side:T.DoubleSide}));}
export function updateFoliage(time){for(const uniform of uniforms)uniform.value=time;}
