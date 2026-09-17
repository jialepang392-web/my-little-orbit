/** CROSSOVER 02 — paper/foil assemblage based on the supplied visual reference.
 * Tangible geometry: wrapped print sheets, raised sleeve and record, thick
 * cable loops and floating type tiles. No terrain, trees or reused garden models.
 */
import * as T from 'three';
import { seededRandom } from '../math.js?v=060';
import { makePressTextures } from './textures.js?v=060';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const Z=new T.Vector3(0,0,1),Y=new T.Vector3(0,1,0),R=3.02;

export function makeCrossover(){
  const root=new T.Group();root.name='CROSSOVER-02';
  const groups={},materials={},layers=[],random=seededRandom(220916),maps=makePressTextures();
  const group=name=>{const g=new T.Group();g.name=name;groups[name]=g;root.add(g);return g;};
  const metallic=new T.MeshPhysicalMaterial({color:'#dedede',map:maps.foil,bumpMap:maps.foil,bumpScale:.074,metalness:.88,roughness:.24,clearcoat:.3,clearcoatRoughness:.3});
  const ink=new T.MeshPhysicalMaterial({color:'#141417',roughness:.23,metalness:.2,clearcoat:.6,clearcoatRoughness:.28});
  const paperEdge=new T.MeshStandardMaterial({color:'#dfdcd1',roughness:.96});
  const paper=(kind,color='#ffffff')=>{
    const key=kind+color;if(materials[key])return materials[key];
    return materials[key]=new T.MeshStandardMaterial({color,map:maps[kind],roughness:.91,side:T.DoubleSide,bumpMap:maps[kind],bumpScale:.008});
  };
  const mesh=(geo,mat,pos=[0,0,0])=>{const m=new T.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;return m;};
  const core=group('01 / CRUMPLED SILVER');
  const sphere=new T.SphereGeometry(R,112,80),p=sphere.attributes.position;
  for(let i=0;i<p.count;i++){
    const n=new T.Vector3().fromBufferAttribute(p,i).normalize();
    const f=.06*Math.sin(n.x*18+n.y*9)*Math.cos(n.z*16-n.x*12)+.025*Math.sin(n.y*41+n.z*37);
    p.setXYZ(i,...n.multiplyScalar(R+f).toArray());
  }sphere.computeVertexNormals();core.add(mesh(sphere,metallic));
  // Matte broken print overlays avoid the look of an undecorated chrome ball.
  const surfaces=group('02 / WRAPPED PRINT');
  function patch(w,h,radius,seed,mat){
    const random=seededRandom(seed),geo=new T.PlaneGeometry(w,h,28,32),position=geo.attributes.position;
    const edgeL=Array.from({length:33},()=>random()*.13),edgeR=Array.from({length:33},()=>random()*.15);
    for(let i=0;i<position.count;i++){
      const row=Math.floor(i/29),col=i%29;let x=position.getX(i),y=position.getY(i);
      if(col<2)x+=edgeL[row]*(1-col/2);if(col>26)x-=edgeR[row]*(col-26)/2;
      if(row<2)y-=random()*.10*(1-row/2);if(row>30)y+=random()*.11*(row-30)/2;
      const n=new T.Vector3(x,y,R).normalize(),curl=.018*Math.sin(y*6+seed)*Math.sin(x*5);
      position.setXYZ(i,...n.multiplyScalar(radius+curl).toArray());
    }geo.computeVertexNormals();return mesh(geo,mat);
  }
  const specs=[
    [-.55,.74,.72,2.40,1.80,-.28,'news'],[.18,.87,.64,2.85,1.75,.12,'fragments'],
    [.70,.52,.65,1.90,2.95,-.19,'news'],[-.82,.06,.65,2.1,2.6,-.35,'type'],
    [.79,-.24,.58,2.25,2.3,.3,'fragments'],[-.42,-.72,.62,2.3,2.0,-.05,'news'],
    [.22,-.80,.53,2.5,2.1,.32,'diagram'],[-.34,.32,-.88,2.8,3.2,.4,'black'],
    [.55,.67,-.68,2.7,2.9,-.3,'news'],[-.76,-.49,-.47,2.5,2.8,-.2,'fragments'],
    [.72,-.59,-.43,3,2.7,.2,'type'],[.07,-.18,-1,2.8,2.4,-.2,'diagram'],
  ];
  specs.forEach(([x,y,z,w,h,angle,kind],i)=>{
    const m=patch(w,h,R+.062+(i%3)*.023,811+i,paper(kind));m.quaternion.setFromUnitVectors(Z,new T.Vector3(x,y,z).normalize());m.rotateZ(angle);surfaces.add(m);layers.push(m);
  });
  // Ragged foil flakes protrude through the paper, instead of being a flat texture border.
  for(let i=0;i<68;i++){
    const y=1-2*(i+.5)/68,a=i*2.39996,n=new T.Vector3(Math.cos(a)*Math.sqrt(1-y*y),y,Math.sin(a)*Math.sqrt(1-y*y));
    const shard=patch(.24+random()*.61,.2+random()*.9,R+.10+random()*.12,940+i,i%4===0?paper('fragments'):metallic);
    shard.quaternion.setFromUnitVectors(Z,n);shard.rotateZ(random()*6.28);surfaces.add(shard);
  }

  const sleeve=group('03 / RECORD SLEEVE');
  function sheet(w,h,kind,z,x,y,angle,edge=true){
    const g=new T.Group();g.position.set(x,y,z);g.rotation.z=angle;
    const geo=new T.PlaneGeometry(w,h,20,20),a=geo.attributes.position;
    for(let i=0;i<a.count;i++){const xx=a.getX(i),yy=a.getY(i);a.setZ(i,-.065*(xx*xx+yy*yy)+.015*Math.sin(yy*4));}geo.computeVertexNormals();
    g.add(mesh(geo,paper(kind)));
    if(edge){
      const under=geo.clone();under.translate(0,0,-.028);g.add(mesh(under,paperEdge));
    }sleeve.add(g);layers.push(g);return g;
  }
  sheet(3.30,3.72,'diagram',3.045,.06,.12,.16);
  sheet(3.00,3.23,'type',3.12,-.18,.14,.11);
  sheet(2.79,2.81,'black',3.17,-.12,.04,.20);
  // Projecting white sleeve strips retain their thickness and cast contact shadows.
  function strip(a,b,width,depth,color=paperEdge){
    const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p);
    const m=mesh(new T.BoxGeometry(width,d.length(),depth),color);m.position.copy(p).add(q).multiplyScalar(.5);m.quaternion.setFromUnitVectors(Y,d.normalize());return m;
  }
  const border=group('04 / OPEN SLEEVE FRAME');
  const frame=new T.Group();frame.rotation.z=-.20;frame.position.set(.05,.10,2.50);
  frame.add(strip([-1.97,-2.82,0],[-1.97,2.83,0],.083,.033),strip([1.97,-2.82,0],[1.97,2.83,0],.083,.033),strip([-1.97,2.83,0],[1.97,2.83,0],.083,.033),strip([-1.97,-2.82,0],[1.97,-2.82,0],.083,.033));border.add(frame);

  const record=group('05 / TYPE RECORD');record.position.set(.13,-.10,3.35);record.rotation.z=.10;
  const disc=mesh(new T.CylinderGeometry(1.075,1.075,.042,96),paperEdge);disc.rotation.x=Math.PI/2;record.add(disc);
  const label=mesh(new T.CircleGeometry(1.07,96),new T.MeshStandardMaterial({map:maps.disc,roughness:.86}),[0,0,.025]);record.add(label);
  for(const [radius,width,color] of [[1.11,.028,'#e1dfd5'],[.97,.008,'#48454b'],[.71,.014,'#e6e2d8']])record.add(mesh(new T.TorusGeometry(radius,width,6,96),new T.MeshStandardMaterial({color,roughness:.67}),[0,0,.04]));
  // Interrupted white circular stroke, similar to a printed sleeve mark.
  record.add(mesh(new T.TorusGeometry(1.21,.053,8,80,Math.PI*1.70),paperEdge,[-.01,.07,.072]));
  const graphicSlivers=group('06 / TYPE FRAGMENTS');
  for(const [i,info] of [[-.90,1.11,.53,.97,.10],[.55,1.19,.72,.79,-.04],[-1.03,-.4,.48,1.23,.10],[1.08,.18,.30,.82,.12]].entries()){
    const [x,y,w,h,a]=info,m=mesh(new T.PlaneGeometry(w,h),paper('type'),[x,y,3.45]);m.rotation.z=a;graphicSlivers.add(m);
  }

  const accents=group('07 / SMALL COLOUR SIGNALS');
  const blue=new T.MeshPhysicalMaterial({color:'#577eb1',roughness:.48,metalness:.1,transparent:true,opacity:.80,side:T.DoubleSide});
  const rose=new T.MeshStandardMaterial({color:'#db7391',roughness:.83});
  const blueTape=mesh(new T.BoxGeometry(1.30,.55,.018),blue,[.02,2.10,2.59]);blueTape.rotation.set(-.2,.05,-.37);accents.add(blueTape);
  for(let i=0;i<5;i++){const seam=strip([-.53+i*.24,1.89,2.62],[-.54+i*.24,2.25,2.62],.008,.006,paperEdge);seam.rotation.z=-.37;accents.add(seam);}
  const pinkUnder=mesh(new T.PlaneGeometry(.53,.9),new T.MeshStandardMaterial({color:'#cd8890',transparent:true,opacity:.66,side:T.DoubleSide}),[-1.40,1.66,2.72]);pinkUnder.rotation.z=-.42;accents.add(pinkUnder);
  const crimson=mesh(new T.BoxGeometry(.42,1.07,.018),new T.MeshStandardMaterial({color:'#693441',roughness:.95}),[-.79,-2.59,1.63]);crimson.rotation.set(.3,-.3,.46);accents.add(crimson);

  const orbits=group('08 / BLACK CABLE ORBITS');
  const chipMaterials=['#aea68b','#98704e','#874754','#cecac0'].map(color=>new T.MeshBasicMaterial({color}));
  const paths=[
    [[-4.08,1.29,.12],[-3.56,1.90,.80],[-1.9,1.50,2.95],[0,1.00,3.63],[2.30,.93,2.89],[4.00,.39,1.38],[4.42,-.19,.2],[3.04,-.64,-1.5],[.4,-.53,-3.18],[-2.38,.07,-2.4]],
    [[-3.51,-2.73,1.22],[-2.48,-2.13,2.76],[0,-1.49,3.54],[2.78,-.82,2.85],[4.33,.18,1.26],[4.24,1.14,-.51],[1.34,1.82,-3.16],[-2.43,.25,-2.46],[-4.1,-1.98,-.35]],
  ];
  paths.forEach((pts,idx)=>{
    const curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),true,'catmullrom',.45);
    const wire=mesh(new T.TubeGeometry(curve,260,.038+idx*.009,9,true),ink);orbits.add(wire);
    for(let i=0;i<210;i++){
      const t=random(),p=curve.getPointAt(t),tan=curve.getTangentAt(t),side=new T.Vector3().crossVectors(tan,Z).normalize(),az=random()*Math.PI*2;
      p.addScaledVector(side,Math.cos(az)*.045).addScaledVector(Z,Math.sin(az)*.042);
      const chip=mesh(new T.BoxGeometry(.012,.011,.008),chipMaterials[i%4]);chip.position.copy(p);chip.rotation.set(random()*3,random()*3,random()*3);orbits.add(chip);
    }
  });
  const hardware=group('09 / BLACK BAR & PINK CLIP');
  const bar=new T.Group(),barmat=new T.MeshPhysicalMaterial({color:'#111115',metalness:.38,roughness:.29,clearcoat:.6});
  bar.add(mesh(new T.CylinderGeometry(.126,.146,1.93,18),barmat));
  for(const y of [-.83,-.70,.73,.83])bar.add(mesh(new T.CylinderGeometry(.151,.151,.035,18),ink,[0,y,0]));
  for(let i=0;i<25;i++){
    const p=[(random()-.5)*.21,(random()-.5)*1.75,.139];bar.add(mesh(new T.SphereGeometry(.008+random()*.006,5,4),paperEdge,p));
  }
  bar.add(mesh(new T.BoxGeometry(.40,.78,.09),new T.MeshStandardMaterial({color:'#35202a',roughness:.6}),[-.19,-.15,.13]));
  bar.add(mesh(new T.BoxGeometry(.30,.69,.095),rose,[-.19,-.15,.19]));
  bar.rotation.set(0,0,-1.04);bar.position.set(2.49,1.65,2.35);hardware.add(bar);
  const plug=new T.Group();plug.add(mesh(new T.CylinderGeometry(.078,.097,.55,12),ink));plug.add(mesh(new T.CylinderGeometry(.062,.065,.14,12),new T.MeshStandardMaterial({color:'#a99959',metalness:.8,roughness:.28}),[0,.34,0]));plug.rotation.set(.1,0,.35);plug.position.set(-2.54,-3.04,1.95);hardware.add(plug);
  const tail=new T.CatmullRomCurve3([[-3.51,-2.73,1.22],[-3.12,-2.56,1.68],[-2.83,-2.68,1.86],[-2.57,-2.80,1.94]].map(p=>new T.Vector3(...p)));
  hardware.add(mesh(new T.TubeGeometry(tail,32,.039,8,false),ink));

  const ribbons=group('10 / FOLDED PAPER RIBBONS');
  function ribbon(points,width,mat){
    const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),verts=[],uvs=[];
    for(let i=0;i<42;i++)for(const [u,side] of [[i/42,-1],[i/42,1],[(i+1)/42,1],[i/42,-1],[(i+1)/42,1],[(i+1)/42,-1]]){
      const p=path.getPoint(u),t=path.getTangent(u),s=new T.Vector3().crossVectors(t,Z).normalize().multiplyScalar(side*width/2);p.add(s);verts.push(...p.toArray());uvs.push((side+1)/2,u);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();return mesh(geo,mat);
  }
  for(let i=0;i<4;i++)ribbons.add(ribbon([[-4.05,-.98-i*.20,.18],[-2.6,-.88-i*.23,1.08],[-1.74,-1.25-i*.28,2.55],[-.86,-2.40-i*.12,2.0]],.12+i*.018,i%2?paper('news'):metallic));
  ribbons.add(ribbon([[-3.60,3.73,-1.2],[-1.85,2.75,-1.38],[.0,2.06,-1.61],[3.63,1.09,-.82]],.075,paperEdge));

  const tiles=group('11 / FLOATING LETTERS');
  const tileInfo=[[-3.27,2.36,.9,-.60,0],[-1.77,3.63,.28,.11,1],[.38,3.99,-.1,.70,2],[2.12,3.03,.23,-.35,3],[3.89,.64,.95,-.32,4],[-.47,3.21,1.29,-.2,5],[2.83,-2.70,.11,.44,6]];
  tileInfo.forEach(([x,y,z,a,id],i)=>{
    const t=new T.Group();t.name='Letter_'+id;t.position.set(x,y,z);t.rotation.set(.08*(i-2),-.1*(i-3),a);
    t.add(mesh(new T.BoxGeometry(.58,.65,.045),paperEdge));
    const map=maps.letters.clone();map.needsUpdate=true;map.repeat.set(.25,.25);map.offset.set((id%4)*.25,1-(Math.floor(id/4)+1)*.25);
    t.add(mesh(new T.PlaneGeometry(.565,.636),new T.MeshStandardMaterial({map,roughness:.9}),[0,0,.024]));tiles.add(t);
  });
  // Batch within each of the eleven authored layers; retains distinct material
  // and contact-shadow boundaries while avoiding hundreds of chip draw calls.
  root.updateMatrixWorld(true);
  for(const g of Object.values(groups)){
    const inverse=g.matrixWorld.clone().invert(),buckets=new Map();
    g.traverse(o=>{
      if(!o.isMesh)return;const key=o.material.uuid,geo=o.geometry.clone();
      geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      if(!geo.index)geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i));
      if(!geo.attributes.uv)geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
      if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});buckets.get(key).geometries.push(geo);
    });
    g.clear();
    for(const {material,geometries} of buckets.values()){
      const joined=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
      if(!joined)throw new Error('Collage layer could not be batched');g.add(mesh(joined,material));
    }
  }
  // Animate a reversible separation for inspecting the real volume, not a fake backdrop.
  const separated=[surfaces,sleeve,border,record,graphicSlivers,accents,orbits,hardware,ribbons,tiles].map((g,i)=>({g,position:g.position.clone(),axis:new T.Vector3((i%3-1)*.15,0,.10+i*.04)}));
  root.userData.reference='uploaded monochrome collage; interpreted as a new planet, without performer names';
  root.userData.layers=Object.keys(groups).length;
  return {root,groups,textures:maps,setSeparated(value){for(const {g,position,axis} of separated)g.position.copy(position).addScaledVector(axis,value?1:0);},dispose(){const gs=new Set(),ms=new Set(),ts=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){ms.add(m);for(const v of Object.values(m))if(v?.isTexture)ts.add(v);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());}};
}
