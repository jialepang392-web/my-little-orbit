/** A full spherical assemblage of paper, pewter water, moss and orchid leaves. */
import * as T from 'three';
import { fromLatLon, clamp, seededRandom } from './math.js';
import { part, box, ball, cyl, mergeStatic, makePine, makeBamboo, makeRock, makeInkstone, makePlum, makeOrchid } from './garden-models.js';
export const PLANET_RADIUS=5.4;
const UP=new T.Vector3(0,1,0),WATER=5.425;
const paperDecks=[[[17,103],2.4,2.8,-.32],[[35,83],1.1,.85,.35],[[-19,-108],2,2.6,.4]].map(([ll,w,h,angle])=>{
  const normal=new T.Vector3(...fromLatLon(...ll)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),normal);
  q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),angle));return {inverse:q.invert(),w,h};
});
const edges=[['home','journal'],['home','studio'],['journal','lab'],['studio','lab'],['journal','library'],['studio','observatory'],['library','camp'],['camp','mail'],['mail','observatory'],['mail','lab'],['camp','home']];
function waterField(n){return Math.abs(n.y*.71+n.x*.28+Math.sin(n.z*4+n.x*2)*.19);}
function terrainRadius(n){const river=waterField(n),hill=Math.sin(n.x*9+n.z*3)*Math.cos(n.y*7-1)*.035+Math.sin(n.z*17+n.y*5)*.015;return PLANET_RADIUS+.075+hill-.11*(1-clamp((river-.055)/.065,0,1));}
export function lakeDistance(n){return waterField(n)/.085;}
export function surfaceRadius(n){
  let height=Math.max(terrainRadius(n),WATER+.015);
  for(const deck of paperDecks){const local=n.clone().applyQuaternion(deck.inverse),x=local.x*(PLANET_RADIUS+.12),y=local.y*(PLANET_RADIUS+.12);
    if(local.z>.9&&Math.abs(x)<deck.w/2&&Math.abs(y)<deck.h/2)height=Math.max(height,PLANET_RADIUS+.13+.028*Math.sin(y*3+x));
  }return height;
}
export function placeSurface(object,n,offset=0){object.position.copy(n).multiplyScalar(surfaceRadius(n)+offset);object.quaternion.setFromUnitVectors(UP,n);}
function slerp(a,b,t){const angle=Math.acos(clamp(a.dot(b),-1,1));return a.clone().multiplyScalar(Math.sin((1-t)*angle)).addScaledVector(b,Math.sin(t*angle)).normalize();}
function tube(points,r,color,extra={}){return part(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(12,points.length*2),r,5,false),color,[0,0,0],extra);}
function paperPatch(center,w,h,angle,color,ruled=false){
  const g=new T.Group(),shape=new T.PlaneGeometry(w,h,12,14),p=shape.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,-(x*x+y*y)/(2*PLANET_RADIUS)+.028*Math.sin(y*3+x));}shape.computeVertexNormals();
  g.add(part(shape,color,[0,0,0],{side:T.DoubleSide,roughness:.98}));
  if(ruled){for(let x=-w*.42;x<w*.48;x+=.23){const pts=[];for(let i=0;i<18;i++){const y=-h*.46+h*.92*i/17;pts.push(new T.Vector3(x,y,-(x*x+y*y)/(2*PLANET_RADIUS)+.028*Math.sin(y*3+x)+.008));}g.add(tube(pts,.004,'#b65a4b'));}}
  const nn=new T.Vector3(...fromLatLon(...center));g.position.copy(nn).multiplyScalar(PLANET_RADIUS+.12);g.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),nn);g.rotateZ(angle);return g;
}
export function makeLandscape(normals){
  const root=new T.Group();root.name='longing-poem-sphere';const random=seededRandom(404917);
  const geometry=new T.SphereGeometry(PLANET_RADIUS,144,96),p=geometry.attributes.position,colors=new Float32Array(p.count*3),n=new T.Vector3();
  const stone=new T.Color('#a7b4a6'),moss=new T.Color('#657c51'),ink=new T.Color('#687672'),shore=new T.Color('#c6c6ad');
  for(let i=0;i<p.count;i++){
    n.fromBufferAttribute(p,i).normalize();const river=waterField(n),vein=Math.sin(n.x*21+n.y*17+Math.sin(n.z*11)*2);
    const field=Math.sin(n.x*5+n.z*4)*Math.cos(n.y*8)+Math.sin(n.z*9+n.x*4)*.3;
    const c=stone.clone().lerp(field>.0?moss:ink,Math.min(.77,Math.abs(field)*.6));
    if(river<.14)c.lerp(shore,.75);else c.multiplyScalar(1+vein*.035);
    p.setXYZ(i,...n.clone().multiplyScalar(terrainRadius(n)).toArray());colors.set([c.r,c.g,c.b],i*3);
  }
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.computeVertexNormals();
  const groundMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.96});
  groundMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 poemSurface;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npoemSurface=position;');
    shader.fragmentShader='varying vec3 poemSurface;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float grain=fract(sin(dot(floor(poemSurface*230.),vec3(12.9898,78.233,45.164)))*43758.5453);
      float vein=sin(poemSurface.y*26.+sin(poemSurface.x*7.)*2.+sin(poemSurface.z*13.)*1.7);
      diffuseColor.rgb*=.9+grain*.14+smoothstep(.84,1.,vein)*.075;`);
  };
  const ground=new T.Mesh(geometry,groundMaterial);ground.name='garden-ground';ground.receiveShadow=true;root.add(ground);
  const water=part(new T.SphereGeometry(WATER,128,80),'#769fa2',[0,0,0],{roughness:.25,metalness:.38});water.name='continuous-jade-water';water.castShadow=false;root.add(water);
  const paths=new T.Group(),sampled=[];
  for(const [a,b] of edges){const aa=normals.get(a),bb=normals.get(b),angle=Math.acos(clamp(aa.dot(bb),-1,1)),steps=Math.ceil(angle*PLANET_RADIUS/.19);
    for(let i=1;i<steps;i++){const nn=slerp(aa,bb,i/steps);sampled.push(nn);if([...normals.values()].some(o=>o.dot(nn)>.989))continue;
      const step=box(.185,.035,.11,i%7===0?'#aea896':'#dad8c1',[0,0,0],.018);placeSurface(step,nn,.018);step.rotateY(i*.19);paths.add(step);
    }
    for(let i=2;i<steps-2;i++){const nn=slerp(aa,bb,i/steps);if(waterField(nn)>.065)continue;
      const tangent=slerp(aa,bb,(i+1)/steps).sub(nn).normalize(),side=new T.Vector3().crossVectors(nn,tangent).normalize();
      for(const sign of [-1,1]){const railN=nn.clone().addScaledVector(side,sign*.024).normalize();const post=cyl(.014,.018,.16,'#a94d3b',[0,0,0],6);placeSurface(post,railN,.1);paths.add(post);
        const next=slerp(aa,bb,(i+1)/steps).addScaledVector(side,sign*.024).normalize();paths.add(tube([railN.clone().multiplyScalar(surfaceRadius(railN)+.18),next.clone().multiplyScalar(surfaceRadius(next)+.18)],.012,'#a94d3b'));
      }
    }
  }root.add(mergeStatic(paths));
  const flora=new T.Group(),stonework=new T.Group(),details=new T.Group();
  const pineTemplates=Array.from({length:5},(_,i)=>makePine(1,i)),bambooTemplates=Array.from({length:3},(_,i)=>makeBamboo(1,i));
  // Open terraces around every content destination; flora uses the entire sphere.
  for(let i=0;i<320;i++){
    const y=1-2*(i+.5)/320,az=i*2.3999632297,nn=new T.Vector3(Math.cos(az)*Math.sqrt(1-y*y),y,Math.sin(az)*Math.sqrt(1-y*y));
    const proximity=[...normals.values()].some(o=>o.dot(nn)>.96),onPath=sampled.some(o=>o.dot(nn)>.9984);
    if(waterField(nn)<.14||proximity||onPath)continue;
    if(i%4===0){const plant=(i%12===0?bambooTemplates[i%3]:pineTemplates[i%5]).clone();plant.scale.multiplyScalar(.62+random()*.55);placeSurface(plant,nn,-.015);plant.rotateY(random()*6.28);flora.add(plant);}
    else if(i%4===1){const rock=makeRock(.45+random()*.6,i%7);placeSurface(rock,nn,-.03);rock.rotateY(i);stonework.add(rock);}
    else{const patch=ball(.14,'#6b8050',[0,0,0],[1.5,.25,1]);placeSurface(patch,nn,.025);details.add(patch);}
  }
  root.add(mergeStatic(flora),mergeStatic(stonework),mergeStatic(details));
  const glints=new T.Group();
  for(let i=0;i<210;i++){const nn=new T.Vector3(random()-.5,random()-.5,random()-.5).normalize();if(waterField(nn)>.065)continue;const tangent=new T.Vector3().crossVectors(nn,UP).normalize(),points=[];
    for(let j=0;j<7;j++)points.push(nn.clone().addScaledVector(tangent,(j-3)*.003).normalize().multiplyScalar(WATER+.008));const line=tube(points,.004,'#c5d5ce');line.castShadow=false;glints.add(line);
  }root.add(mergeStatic(glints));
  // Paper and vermilion fragments follow the globe's curvature instead of hiding it.
  const collage=new T.Group();collage.add(paperPatch([17,103],2.4,2.8,-.32,'#e8e2d2',true),paperPatch([35,83],1.1,.85,.35,'#b73529'),paperPatch([-19,-108],2.0,2.6,.4,'#dedac9',true));
  root.add(mergeStatic(collage));
  // Oversized still-life objects are the main composition; small destinations remain clear.
  const assemblage=new T.Group();
  const inkstone=makeInkstone(3.1),inkN=new T.Vector3(...fromLatLon(35,102));placeSurface(inkstone,inkN,.08);inkstone.rotateY(-.5);assemblage.add(inkstone);
  for(const [lat,lon,size,v] of [[6,57,3.1,0],[-19,60,2.8,3],[-31,119,2.2,1],[34,-65,2.8,2],[-38,-127,2.5,4]]){
    const nn=new T.Vector3(...fromLatLon(lat,lon)),rock=makeRock(size,v);placeSurface(rock,nn,-.04);rock.rotateY(lon);assemblage.add(rock);
  }
  for(const [lat,lon,size] of [[-16,129,2.5],[23,134,1.8],[-44,35,2.1],[-2,-114,2.4]]){
    const nn=new T.Vector3(...fromLatLon(lat,lon)),leaves=makeOrchid(size);placeSurface(leaves,nn,.015);leaves.rotateY(lon);assemblage.add(leaves);
  }
  for(const [lat,lon,size] of [[4,52,2.5],[-24,114,2.0],[44,-136,2.3]]){
    const nn=new T.Vector3(...fromLatLon(lat,lon)),plum=makePlum(size);placeSurface(plum,nn,.04);plum.rotateY(.8);assemblage.add(plum);
  }
  const fluteFrom=new T.Vector3(...fromLatLon(43,64)),fluteTo=new T.Vector3(...fromLatLon(-23,112)),flutePoints=[];
  for(let i=0;i<=48;i++)flutePoints.push(slerp(fluteFrom,fluteTo,i/48).multiplyScalar(PLANET_RADIUS+.19));
  assemblage.add(tube(flutePoints,.062,'#b0ab73',{roughness:.45}));
  for(let i=3;i<45;i+=6){const nn=slerp(fluteFrom,fluteTo,i/48),hole=cyl(.034,.034,.008,'#26382f',[0,0,0],12);placeSurface(hole,nn,.26);assemblage.add(hole);}
  for(const [lat,lon] of [[-3,84],[-16,77]]){
    const duck=new T.Group();duck.add(ball(.14,'#786249',[0,.07,0],[.85,.65,1.5]),ball(.09,'#334e42',[0,.18,-.12]),ball(.068,'#bd4933',[0,.14,-.22],[.65,.45,1]),ball(.015,'#151e19',[-.075,.196,-.148]));
    for(const sign of [-1,1]){duck.add(ball(.105,'#e4dbbd',[sign*.095,.09,.015],[.32,.65,1.25]),ball(.055,'#a75035',[sign*.105,.1,.07],[.4,.7,1.1]));}
    const nn=new T.Vector3(...fromLatLon(lat,lon));placeSurface(duck,nn,.025);duck.rotateY(-.6);assemblage.add(duck);
  }
  root.add(mergeStatic(assemblage));
  // Long sculptural orchid leaves form an open, asymmetric ring around the sphere.
  const orchid=new T.Group();
  for(let i=0;i<14;i++){
    const pts=[],phase=-1.65+(i%7)*.055,tilt=-.43+(i%4)*.045;
    for(let j=0;j<=55;j++){const a=phase+j/55*(3.8+(i%3)*.15),r=PLANET_RADIUS+.13+Math.sin(j/55*Math.PI)*(.26+i*.016);const q=new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,Math.sin(j/55*Math.PI)*.24);q.applyAxisAngle(new T.Vector3(1,0,0),tilt).applyAxisAngle(UP,.1);pts.push(q);}
    orchid.add(tube(pts,i%4===0?.025:.012,i%3?'#31473c':'#748369',{roughness:.46,metalness:.15}));
  }
  root.add(mergeStatic(orchid));
  const pewter=new T.Group();
  for(let k=0;k<4;k++){
    const pts=[];for(let i=0;i<=60;i++){const a=-2.2+i/60*3.6,r=PLANET_RADIUS+.07+k*.028;pts.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,.65+Math.sin(a*5+k)*.035));}
    pewter.add(tube(pts,.045,'#a5b2ad',{roughness:.24,metalness:.52}));
  }root.add(mergeStatic(pewter));
  const fireflyPositions=[];for(let i=0;i<45;i++){const q=new T.Vector3(random()-.5,random()-.5,random()-.5).normalize();fireflyPositions.push(...q.multiplyScalar(PLANET_RADIUS+.4+random()*.6).toArray());}
  const fireflyGeo=new T.BufferGeometry();fireflyGeo.setAttribute('position',new T.Float32BufferAttribute(fireflyPositions,3));const fireflies=new T.Points(fireflyGeo,new T.PointsMaterial({color:'#f6d28e',size:.035,transparent:true,opacity:0,depthWrite:false}));root.add(fireflies);
  return {root,ground,surface:ground,animate(t,reduced,dusk){fireflies.material.opacity=dusk?.75:0;if(!reduced)fireflies.rotation.y=t*.009;}};
}
