/** Sculpted, deterministic landscape shared by placement and avatar movement. */
import * as T from 'three';
import { fromLatLon, clamp, seededRandom } from './math.js';
import { box, ball, cyl, part, mergeStatic, makeArtTree, makeMeadow, makeMushrooms, PALETTE } from './art-models.js';
export const PLANET_RADIUS=5.4;
const UP=new T.Vector3(0,1,0),lakeN=new T.Vector3(...fromLatLon(10,88));
const lakeX=new T.Vector3().crossVectors(UP,lakeN).normalize(),lakeY=new T.Vector3().crossVectors(lakeN,lakeX).normalize();
const edges=[['home','journal'],['home','studio'],['journal','lab'],['studio','lab'],['journal','library'],['studio','observatory'],['library','camp'],['camp','mail'],['mail','observatory']];
export function lakeDistance(n){const x=n.dot(lakeX)/.255,y=n.dot(lakeY)/.21,a=Math.atan2(y,x);if(n.dot(lakeN)<.8)return 100;return Math.hypot(x,y)/(1+.12*Math.sin(a*3)+.075*Math.cos(a*5));}
export function surfaceRadius(n){const d=lakeDistance(n),wave=(Math.sin(n.x*7+n.z*3)*Math.cos(n.y*8-1)+Math.sin(n.z*11+n.y*4)*.34)*.048;return PLANET_RADIUS+.056+wave*clamp((d-.9)*4,0,1)-.055*(1-clamp((d-.89)*10,0,1));}
export function placeSurface(object,normal,offset=0){object.position.copy(normal).multiplyScalar(surfaceRadius(normal)+offset);object.quaternion.setFromUnitVectors(UP,normal);}
function lakePoint(x,y,offset=.02){const n=lakeN.clone().addScaledVector(lakeX,x).addScaledVector(lakeY,y).normalize();return n.multiplyScalar(PLANET_RADIUS+offset);}
export function makeLandscape(normals){
  const root=new T.Group();root.name='handmade-woodland';const random=seededRandom(260916),geometry=new T.IcosahedronGeometry(PLANET_RADIUS,19),p=geometry.attributes.position,colors=new Float32Array(p.count*3),n=new T.Vector3();
  for(let i=0;i<p.count;i++){n.fromBufferAttribute(p,i).normalize();p.setXYZ(i,...n.clone().multiplyScalar(surfaceRadius(n)).toArray());const d=lakeDistance(n);const field=Math.sin(n.x*5+n.y*3)*Math.cos(n.z*7)+Math.sin(n.x*12+n.z*8)*.18;const c=new T.Color(d<1.08?'#c8c18a':field>.5?'#8dac69':field<-.5?'#66945d':'#80a865');const shade=1+(random()-.5)*.055;c.multiplyScalar(shade);colors.set([c.r,c.g,c.b],i*3);}
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.computeVertexNormals();const planet=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));planet.receiveShadow=true;root.add(planet);
  // Water is its own spherical patch, not a blue-painted triangle on the ground.
  // Subdivide radially as well as around the boundary. A single triangle fan
  // sags below a spherical terrain and creates false holes in the water.
  const waterPositions=[],waterIndices=[],segments=96,rings=14;
  waterPositions.push(...lakePoint(0,0,.032).toArray());
  for(let ring=1;ring<=rings;ring++){
    const base=1+(ring-1)*(segments+1),previous=base-(segments+1);
    for(let i=0;i<=segments;i++){
      const a=i/segments*Math.PI*2,b=(1+.12*Math.sin(a*3)+.075*Math.cos(a*5))*ring/rings;
      waterPositions.push(...lakePoint(Math.cos(a)*.248*b,Math.sin(a)*.204*b,.032).toArray());
      if(i<segments){if(ring===1)waterIndices.push(0,base+i,base+i+1);else waterIndices.push(previous+i,base+i,base+i+1,previous+i,base+i+1,previous+i+1);}
    }
  }
  const waterGeo=new T.BufferGeometry();waterGeo.setAttribute('position',new T.Float32BufferAttribute(waterPositions,3));waterGeo.setIndex(waterIndices);waterGeo.computeVertexNormals();
  const water=new T.Mesh(waterGeo,new T.MeshStandardMaterial({color:'#62aea8',roughness:.28,metalness:.12,side:T.DoubleSide}));water.name='jade-lake';root.add(water);
  const ripples=new T.Group();
  for(let i=0;i<9;i++){const x=(random()-.5)*.31,y=(random()-.5)*.23,points=[];for(let j=0;j<=16;j++){const a=j/16*Math.PI*.8;points.push(lakePoint(x+Math.cos(a)*(.015+i*.001),y+Math.sin(a)*.008,.039));}const line=part(new T.TubeGeometry(new T.CatmullRomCurve3(points),16,.006,3,false),'#b8ded0');line.castShadow=false;ripples.add(line);}root.add(mergeStatic(ripples));
  const sampledPaths=[],paths=new T.Group();
  for(const [a,b] of edges){const from=normals.get(a),to=normals.get(b),angle=Math.acos(clamp(from.dot(to),-1,1)),steps=Math.ceil(angle*PLANET_RADIUS/.18);for(let i=1;i<steps;i++){const t=i/steps,n=from.clone().multiplyScalar(Math.sin((1-t)*angle)).addScaledVector(to,Math.sin(t*angle)).divideScalar(Math.sin(angle)).normalize();sampledPaths.push(n);if(lakeDistance(n)<1.02)continue;const pebble=box(.135,.02,.08,i%5===0?'#c6b28b':'#e7d5ad',[0,0,0],.02);placeSurface(pebble,n,.012);pebble.rotateY(i*.27);paths.add(pebble);}}
  root.add(mergeStatic(paths));
  const flora=new T.Group(),templates=Array.from({length:8},(_,i)=>makeArtTree(1,i));
  for(let i=0;i<180;i++){const y=random()*2-1,a=random()*Math.PI*2,n=new T.Vector3(Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a));if(lakeDistance(n)<1.25||[...normals.values()].some(o=>o.dot(n)>.974)||sampledPaths.some(o=>o.dot(n)>.999))continue;const tree=templates[i%templates.length].clone();tree.scale.setScalar(.65+random()*.75);placeSurface(tree,n,-.02);tree.rotateY(random()*Math.PI*2);flora.add(tree);}root.add(mergeStatic(flora));
  const details=new T.Group(),meadows=Array.from({length:6},(_,i)=>makeMeadow(i)),mushrooms=makeMushrooms();
  for(let i=0;i<280;i++){const n=new T.Vector3(random()-.5,random()-.5,random()-.5).normalize();if(lakeDistance(n)<1.11||[...normals.values()].some(o=>o.dot(n)>.987)||sampledPaths.some(o=>o.dot(n)>.9995))continue;const m=(i%19===0?mushrooms:meadows[i%6]).clone();placeSurface(m,n,.002);m.rotateY(i);details.add(m);}
  for(let i=0;i<45;i++){const n=new T.Vector3(random()-.5,random()-.5,random()-.5).normalize();if(lakeDistance(n)<1.1||[...normals.values()].some(o=>o.dot(n)>.98))continue;const stone=part(new T.DodecahedronGeometry(.07+random()*.1),'#aeb2a2');stone.scale.y=.5;placeSurface(stone,n);details.add(stone);}root.add(mergeStatic(details));
  // Little jetty and a paper sailboat give the lake a readable scale.
  const boat=new T.Group();boat.add(ball(.17,PALETTE.wood,[0,.022,0],[.6,.4,1.8]),box(.028,.47,.028,PALETTE.wood,[0,.24,0]));const sail=new T.Shape();sail.moveTo(0,0);sail.lineTo(.21,0);sail.lineTo(0,.37);sail.closePath();boat.add(part(new T.ShapeGeometry(sail),PALETTE.cream,[.017,.1,0],{side:T.DoubleSide}));const boatRoot=mergeStatic(boat);placeSurface(boatRoot,lakeN,.04);boatRoot.rotateY(-.55);root.add(boatRoot);
  const jetty=new T.Group();for(let i=0;i<6;i++)jetty.add(box(.32,.04,.09,PALETTE.wood,[0,.075,i*.1]));for(const z of [0,.5])for(const x of [-.17,.17])jetty.add(cyl(.025,.025,.23,PALETTE.wood,[x,.12,z]));const dock=mergeStatic(jetty);const dn=lakeN.clone().addScaledVector(lakeX,-.19).addScaledVector(lakeY,-.12).normalize();placeSurface(dock,dn,.04);dock.rotateY(.85);root.add(dock);
  const fireflyGeo=new T.BufferGeometry(),fireflyPositions=[];for(let i=0;i<50;i++){const n=new T.Vector3(random()-.5,random()-.5,random()-.5).normalize();fireflyPositions.push(...n.multiplyScalar(PLANET_RADIUS+.3+random()*.7).toArray());}fireflyGeo.setAttribute('position',new T.Float32BufferAttribute(fireflyPositions,3));const fireflies=new T.Points(fireflyGeo,new T.PointsMaterial({color:'#ffd47c',size:.045,transparent:true,opacity:.0,depthWrite:false}));root.add(fireflies);
  return {root,animate(t,reduced,dusk){if(!reduced){boatRoot.position.copy(lakeN).multiplyScalar(surfaceRadius(lakeN)+.045+Math.sin(t*1.4)*.008);fireflies.rotation.y=t*.015;}fireflies.material.opacity=dusk?.7:0;}};
}
