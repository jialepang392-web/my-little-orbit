/** Yesterday, Today — an independently authored, full-volume album sculpture.
 * The silhouette is held by one ribbed red conduit, not a terrain recolour.
 * Petals, feather barbs, lenses, film folds and record grooves are real geometry.
 */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom } from '../math.js?v=081';
import { makeYesterdayTextures } from './textures.js?v=081';

const Z=new T.Vector3(0,0,1),Y=new T.Vector3(0,1,0),TAU=Math.PI*2;
const vec=p=>new T.Vector3(...p);

export function makeYesterdayToday({glyphs={}}={}){
  const root=new T.Group();root.name='YESTERDAY-TODAY';
  const groups=[],maps=makeYesterdayTextures(glyphs),random=seededRandom(26091703);
  const group=name=>{const g=new T.Group();g.name=name;root.add(g);groups.push(g);return g;};
  const material=o=>new T.MeshPhysicalMaterial({side:T.DoubleSide,...o});
  const shellMat=material({color:'#b0669d',map:maps.membrane,bumpMap:maps.folds,bumpScale:.028,roughness:.36,metalness:.52,clearcoat:.82,clearcoatRoughness:.22,iridescence:.57,iridescenceIOR:1.32});
  const crimson=material({color:'#ed1026',roughness:.26,metalness:.07,clearcoat:1,clearcoatRoughness:.17});
  const redDark=material({color:'#971b3f',roughness:.33,metalness:.27,clearcoat:.8});
  const redFilm=material({color:'#de3d66',roughness:.21,metalness:.2,clearcoat:1,iridescence:.35,transparent:true,opacity:.82,depthWrite:false});
  const pearl=material({color:'#ede4e8',roughness:.29,metalness:.46,clearcoat:.75,iridescence:.88,iridescenceThicknessRange:[160,620]});
  const violet=material({color:'#7762af',roughness:.24,metalness:.57,clearcoat:1,iridescence:.77});
  const silver=material({color:'#d9d7e4',roughness:.3,metalness:.91,bumpMap:maps.folds,bumpScale:.014,iridescence:.36});
  const roseGlass=material({color:'#e4a0c7',roughness:.19,metalness:.09,clearcoat:1,transmission:.62,thickness:.16,ior:1.43,iridescence:.84,iridescenceThicknessRange:[200,590]});
  const clearGlass=material({color:'#eadfed',roughness:.11,metalness:.05,transmission:.79,thickness:.22,ior:1.42,clearcoat:1,iridescence:.75,iridescenceThicknessRange:[190,570]});
  const fineMats=['#a981bc','#dd73a8','#938bc9','#dac8cd'].map(color=>material({color,roughness:.33,metalness:.45,clearcoat:.55}));
  const featherMat=material({color:'#f5e5e6',roughness:.68,metalness:.05,sheen:1,sheenColor:'#d989ae',sheenRoughness:.72});
  const fineRose=material({color:'#c992ad',roughness:.75});
  const whitePetal=material({color:'#fff7f0',map:maps.petal,roughness:.57,sheen:1,sheenColor:'#fbe1e9',sheenRoughness:.5,clearcoat:.14});
  const pinkPetal=material({color:'#eeb7cd',map:maps.petal,roughness:.58,sheen:.8,sheenColor:'#e8abd0',sheenRoughness:.61});
  const stamens=material({color:'#eacaad',roughness:.53,metalness:.15});
  function mesh(geo,mat,p=[0,0,0]){const m=new T.Mesh(geo,mat);m.position.set(...p);m.castShadow=!(mat.transmission>0||mat.transparent);m.receiveShadow=true;return m;}
  function curve(points,closed=false){return new T.CatmullRomCurve3(points.map(vec),closed,'catmullrom',.42);}
  function tube(path,radius,mat,steps=128,radial=7){return mesh(new T.TubeGeometry(path,steps,radius,radial,path.closed),mat);}
  function sphere(p,r,mat,scale=[1,1,1]){const m=mesh(new T.SphereGeometry(r,22,14),mat,p);m.scale.set(...scale);return m;}

  const core=group('01 / PEARLESCENT MEMORY CORE');
  const coreGeo=new T.SphereGeometry(2.63,96,64),pos=coreGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),ripple=.022*Math.sin(x*13+y*6)*Math.cos(z*11)+.011*Math.sin(y*29+z*12);
    const n=new T.Vector3(x,y,z).normalize().multiplyScalar(2.63+ripple);pos.setXYZ(i,n.x,n.y*.985,n.z*.77);
  }coreGeo.computeVertexNormals();core.add(mesh(coreGeo,shellMat));

  // Curved film panels are irregular, but follow the same spherical volume.
  const panels=group('02 / BENT COLOUR MEMBRANES');
  function patch(w,h,direction,radius,mat,seed){
    const geo=new T.PlaneGeometry(w,h,32,30),p=geo.attributes.position,r=seededRandom(seed);
    for(let i=0;i<p.count;i++){
      let x=p.getX(i),y=p.getY(i);const u=x/w*2,v=y/h*2;
      x+=Math.pow(Math.abs(v),15)*(.05*Math.sin(u*23+seed)+r()*.012);y+=Math.pow(Math.abs(u),15)*.09*Math.sin(v*13+seed);
      const normal=new T.Vector3(x,y,2.63).normalize(),edge=Math.pow(Math.max(Math.abs(u),Math.abs(v)),5);
      const q=normal.multiplyScalar(radius+.035*Math.sin(x*5+y*4)+edge*.12*Math.sin(y*3+seed));
      q.z*=.77;p.setXYZ(i,...q.toArray());
    }
    geo.computeVertexNormals();const m=mesh(geo,mat);m.quaternion.setFromUnitVectors(Z,vec(direction).normalize());return m;
  }
  [
    [3.5,2.1,[.30,.74,.65],2.75,crimson],
    [3.1,2.7,[.69,.17,.71],2.73,violet],
    [3.3,2.1,[-.64,.39,.66],2.72,redFilm],
    [2.4,2.8,[-.75,-.22,.62],2.74,roseGlass],
    [3.7,1.7,[.21,-.77,.67],2.77,pearl],
    [2.0,3.1,[.86,-.35,.27],2.70,silver],
    [2.4,2.8,[-.2,.53,-.83],2.73,redDark],
    [3.4,2.3,[.48,-.6,-.63],2.74,violet],
    [2.7,2.8,[-.70,-.13,-.70],2.74,pearl],
  ].forEach(([w,h,n,r,mat],i)=>panels.add(patch(w,h,n,r,mat,820+i)));

  function ribbon(points,width,mat,twist=0){
    const path=curve(points),steps=80,cols=8,p=[],uv=[],index=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,center=path.getPoint(t),tangent=path.getTangent(t);
      const across=new T.Vector3().crossVectors(tangent,Z).normalize();
      across.applyAxisAngle(tangent,twist*Math.sin(t*Math.PI*1.5));
      for(let j=0;j<=cols;j++){
        const u=j/cols*2-1,envelope=.45+.55*Math.sin(Math.PI*t)**.65;
        const q=center.clone().addScaledVector(across,u*width*.5*envelope);
        q.z+=.07*u*u*Math.sin(t*17)+.011*Math.sin(t*60+u*9);p.push(...q.toArray());uv.push(j/cols,t);
        if(i<steps&&j<cols){const a=i*(cols+1)+j,b=a+cols+1;index.push(a,b,a+1,b,b+1,a+1);}
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();return mesh(geo,mat);
  }
  const folds=group('03 / LUCENT FILM & SILK');
  folds.add(ribbon([[-2.9,.75,.4],[-2.4,1.85,1.7],[-1.25,2.45,1.92],[.6,2.05,2.25],[1.5,1.15,1.95]],.62,roseGlass,1.4));
  folds.add(ribbon([[-2.4,-1.3,.6],[-1.6,-2.0,2.0],[.0,-2.43,1.81],[1.72,-2.06,1.41],[2.3,-1.3,.5]],.72,pearl,.9));
  folds.add(ribbon([[-2.62,.38,1.05],[-2.14,-.46,1.87],[-2.25,-1.4,1.77],[-.8,-1.87,2.22],[1.1,-1.8,1.89]],.36,redFilm,2.1));
  folds.add(ribbon([[2.25,1.5,.4],[2.75,.67,1.3],[2.4,-.45,1.8],[1.94,-1.9,1.05]],.79,violet,.75));
  const silkMat=material({map:maps.silk,color:'#e3cee6',roughness:.5,metalness:.15,sheen:1,sheenColor:'#a485c0',transparent:true,opacity:.88,depthWrite:false});
  folds.add(ribbon([[-1.9,1.25,1.98],[-.88,2.08,2.25],[.48,2.18,2.0],[1.46,1.72,1.8]],.47,silkMat,.7));
  for(let i=0;i<9;i++)folds.add(ribbon([[-1.7-i*.04,-1.5,1.88],[-1.05,-2.0-i*.025,2.0],[.65,-2.6+i*.04,1.6],[1.99,-2.21+i*.06,1.02]],.026+i*.004,i%2?pearl:silver,1.1));

  const record=group('04 / RECORD & PRINTED TIME');
  record.position.set(.19,-.10,2.67);record.rotation.set(-.04,-.05,.035);
  const disc=mesh(new T.CylinderGeometry(1.81,1.81,.074,128),violet);disc.rotation.x=Math.PI/2;record.add(disc);
  record.add(mesh(new T.RingGeometry(1.24,1.79,160),shellMat,[0,0,.046]));
  for(let i=0;i<36;i++)record.add(mesh(new T.TorusGeometry(1.29+i*.013,.0027,4,128),i%4?pearl:violet,[0,0,.052]));
  record.add(mesh(new T.TorusGeometry(1.824,.039,10,160),clearGlass,[0,0,.035]));
  record.add(mesh(new T.TorusGeometry(1.248,.014,8,128),silver,[0,0,.070]));
  record.add(mesh(new T.CircleGeometry(1.234,128),new T.MeshStandardMaterial({map:maps.label,roughness:.82,side:T.DoubleSide}),[0,0,.072]));
  record.add(sphere([0,0,.08],.042,redDark,[1,1,.38]));

  const conduit=group('05 / RED CORRUGATED CONDUIT');conduit.position.z=.36;
  const hosePath=curve([[-.73,2.39,1.25],[.35,2.28,2.04],[1.55,1.75,2.24],[2.12,.75,1.9],[2.13,-.37,1.62],[1.91,-1.50,1.55],[1.27,-2.01,1.69]]);
  const seg=840,sides=12,frames=hosePath.computeFrenetFrames(seg,false),verts=[],normUV=[],indices=[];
  for(let i=0;i<=seg;i++){
    const t=i/seg,c=hosePath.getPointAt(t),rib=(.5+.5*Math.cos(t*TAU*87));
    const radius=.122+.042*Math.pow(rib,.65);
    for(let j=0;j<=sides;j++){
      const a=j/sides*TAU,p=c.clone().addScaledVector(frames.normals[i],Math.cos(a)*radius).addScaledVector(frames.binormals[i],Math.sin(a)*radius);
      verts.push(...p.toArray());normUV.push(t*18,j/sides);
      if(i<seg&&j<sides){const k=i*(sides+1)+j,b=k+sides+1;indices.push(k,b,k+1,b,b+1,k+1);}
    }
  }
  const hoseGeo=new T.BufferGeometry();hoseGeo.setAttribute('position',new T.Float32BufferAttribute(verts,3));hoseGeo.setAttribute('uv',new T.Float32BufferAttribute(normUV,2));hoseGeo.setIndex(indices);hoseGeo.computeVertexNormals();conduit.add(mesh(hoseGeo,crimson));
  for(const t of [0,1]){
    const cuff=mesh(new T.CylinderGeometry(.146,.148,.18,24),redDark);cuff.position.copy(hosePath.getPointAt(t));cuff.quaternion.setFromUnitVectors(Y,hosePath.getTangentAt(t));conduit.add(cuff);
    const rim=mesh(new T.TorusGeometry(.13,.018,8,32),crimson);rim.position.copy(hosePath.getPointAt(t)).addScaledVector(hosePath.getTangentAt(t),t?.11:-.11);rim.quaternion.setFromUnitVectors(Z,hosePath.getTangentAt(t));conduit.add(rim);
  }

  const orbits=group('06 / TWO TIMES IN ORBIT');
  const orbitPaths=[
    [[-3.06,1.94,.1],[-2.28,2.86,.88],[.0,2.75,1.62],[2.36,1.89,1.04],[3.05,.16,-.54],[1.72,-2.10,-1.88],[-1.11,-2.99,-.85],[-3.14,-.64,.83]],
    [[-3.08,-2.02,.66],[-2.70,-.72,2.35],[-1.67,1.46,2.34],[.57,3.08,.48],[2.07,2.38,-1.29],[2.02,-.85,-2.00],[-.30,-2.85,-.88]],
    [[-3.10,.19,1.16],[-1.88,-1.15,2.57],[.64,-1.79,2.31],[2.69,-.80,.83],[3.04,.81,-.23],[.97,1.55,-2.21],[-1.8,1.44,-1.49]],
  ];
  orbitPaths.forEach((pts,i)=>orbits.add(tube(curve(pts,true),.014+i*.003,fineMats[i],220,7)));
  const inner=curve([[-2.71,1.12,1.43],[-2.17,.35,2.2],[-2.1,-.86,2.12],[-.99,-1.4,2.32],[.9,-1.8,2.18],[2.2,-1.21,1.6]]);
  orbits.add(tube(inner,.015,fineMats[1],150));

  const lenses=group('07 / TRANSPARENT MEMORY LENSES');
  const lensSpec=[[-2.42,1.48,1.14,.39,-.45],[-1.23,2.79,.24,.43,.2],[-.05,2.71,1.50,.32,-.25],[-2.93,.64,.97,.32,-.65],[-2.34,-1.89,.94,.36,.4],[2.52,-.55,.98,.24,-.3],[-1.62,1.17,2.17,.37,.35],[1.26,2.59,-.30,.28,-.12]];
  lensSpec.forEach(([x,y,z,r,a],i)=>{
    const g=new T.Group();g.position.set(x,y,z);g.rotation.set(.14*(i%3-1),a,a*.6);
    g.add(sphere([0,0,0],r,i===6?material({color:'#b7cd9b',roughness:.24,metalness:.08,transmission:.35,thickness:.2,ior:1.45,iridescence:.7}):i%3?roseGlass:clearGlass,[1,1,.09]));
    g.add(mesh(new T.TorusGeometry(r*.985,.007,5,64),i%2?pearl:fineMats[0]));lenses.add(g);
  });

  const blooms=group('08 / PRESSED BLOSSOMS');blooms.position.z=.44;
  function petalGeometry(length,width,seed){
    const verts=[],uv=[],ind=[],rows=15,cols=8;
    for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
      const t=i/rows,u=j/cols*2-1,w=width*Math.pow(Math.sin(Math.PI*t),.61)*(1+.1*Math.sin(t*15+seed));
      const x=u*w,y=t*length,z=.21*length*Math.sin(t*Math.PI*.91)+.19*length*u*u*Math.sin(t*Math.PI)+.015*Math.sin(t*27+u*3+seed);
      verts.push(x,y,z);uv.push(j/cols,t);
      if(i<rows&&j<cols){const k=i*(cols+1)+j,b=k+cols+1;ind.push(k,b,k+1,b,b+1,k+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;
  }
  const petalBase=petalGeometry(.31,.137,13);
  const flowers=[[-1.02,.67,2.37,.86],[-1.27,.28,2.48,1.06],[-1.16,-.20,2.55,1.08],[-1.57,-.40,2.36,.78],[-.98,-.65,2.48,.91],[-1.36,-.88,2.23,.79],[-.70,-.98,2.25,.67],[-1.03,.99,2.04,.58]];
  flowers.forEach(([x,y,z,s],i)=>{
    const flower=new T.Group();flower.position.set(x,y,z);flower.scale.setScalar(s);flower.rotation.set((random()-.5)*.7,(random()-.5)*.6,random()*TAU);
    for(let k=0;k<6;k++){const petal=mesh(petalBase,i%3?whitePetal:pinkPetal);petal.rotation.z=k/6*TAU;petal.rotation.x=(random()-.5)*.45;flower.add(petal);}
    for(let k=0;k<8;k++){const angle=k/8*TAU,point=[Math.cos(angle)*.048,Math.sin(angle)*.048,.067+random()*.035];flower.add(sphere(point,.018,stamens));}
    blooms.add(flower);
  });
  for(let i=0;i<14;i++){
    const x=-1.72+random()*.88,y=-1.32+random()*2.15;
    blooms.add(sphere([x,y,2.19+random()*.15],.045+random()*.035,i%3?pinkPetal:whitePetal,[.84,1.16,.7]));
  }

  const feathers=group('09 / SOFT FEATHER CODA');
  function feather(points,width,count=96){
    const spine=curve(points);feathers.add(tube(spine,.012,pearl,90,5));
    for(let i=2;i<count;i++){
      const t=i/count,center=spine.getPoint(t),tan=spine.getTangent(t),normal=new T.Vector3().crossVectors(tan,Z).normalize();
      const w=width*Math.pow(Math.sin(Math.PI*t),.71)*(1-.24*t);
      for(const sign of [-1,1]){
        const len=w*(.87+random()*.13),end=center.clone().addScaledVector(normal,sign*len).addScaledVector(tan,.34*len);
        end.z+=.07*Math.sin(t*9+sign);
        const mid=center.clone().lerp(end,.6).addScaledVector(tan,-len*.12);
        const strand=new T.QuadraticBezierCurve3(center,mid,end);
        feathers.add(tube(strand,.0028+random()*.0017,i%6?featherMat:fineRose,10,3));
        if(i%2===0){const tip=end.clone().addScaledVector(tan,.06+random()*.07);feathers.add(tube(new T.QuadraticBezierCurve3(center.clone().lerp(end,.24),end,tip),.0022,featherMat,8,3));}
      }
    }
  }
  feather([[-1.60,-1.59,2.02],[-.85,-2.27,2.13],[.65,-2.76,1.70],[2.33,-2.75,.75],[2.73,-3.0,.38]],.49,136);
  feather([[-1.59,1.3,2.16],[-.98,1.80,2.45],[.13,2.18,2.34],[1.08,2.19,1.83]],.28,96);
  feather([[-2.31,-.8,1.37],[-2.82,-.41,1.82],[-2.97,.34,1.40],[-2.73,1.02,.77]],.23,82);

  const beads=group('10 / PEARLS & SMALL PAUSES');beads.position.z=.40;
  const beadList=[[-.58,-1.44,2.20,.18],[-1.93,-1.53,1.68,.19],[1.58,-1.93,1.90,.20],[2.35,-1.06,1.62,.11],[-2.12,2.20,.72,.12],[.73,1.43,2.43,.07],[.86,1.12,2.37,.08],[1.29,-.68,2.40,.074]];
  beadList.forEach(([x,y,z,r],i)=>beads.add(sphere([x,y,z],r,i%3?pearl:roseGlass)));
  for(let i=0;i<11;i++){const t=i/10,angle=.28+t*1.63;beads.add(sphere([.18+Math.cos(angle)*1.61,-.1+Math.sin(angle)*1.61,2.41],.025+random()*.035,i%3?pearl:violet));}
  beads.add(sphere([.94,-.72,2.50],.095,crimson,[.7,1.14,.7]));

  const verso=group('11 / VERSO — A SECOND TODAY');
  const reverse=mesh(new T.CircleGeometry(1.17,96),new T.MeshStandardMaterial({map:maps.backLabel,roughness:.81}),[-.12,.18,-2.13]);reverse.rotation.y=Math.PI;reverse.rotation.z=-.16;verso.add(reverse);
  const reverseRing=mesh(new T.TorusGeometry(1.23,.041,10,128),roseGlass,[-.12,.18,-2.1]);verso.add(reverseRing);
  verso.add(ribbon([[-2.1,1.48,-1.16],[-1.4,2.05,-1.70],[.09,2.26,-1.34],[1.75,1.71,-.79]],.32,redFilm,1));

  // One draw per material per authored layer; keep transmission meshes separate
  // from opaque surfaces for Three's physical-material rendering pass.
  root.updateMatrixWorld(true);
  const sourceGeometries=new Set();
  for(const g of groups){
    const inv=g.matrixWorld.clone().invert(),buckets=new Map();
    g.traverse(o=>{
      if(!o.isMesh)return;sourceGeometries.add(o.geometry);
      const geometry=o.geometry.clone();geometry.applyMatrix4(inv.clone().multiply(o.matrixWorld));
      if(!geometry.index)geometry.setIndex(Array.from({length:geometry.attributes.position.count},(_,i)=>i));
      if(!geometry.attributes.uv)geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
      const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{mat:o.material,geometries:[]});buckets.get(key).geometries.push(geometry);
    });
    g.clear();
    for(const {mat,geometries} of buckets.values()){
      const merged=mergeGeometries(geometries,false);geometries.forEach(x=>x.dispose());
      if(!merged)throw new Error('Yesterday, Today layer merge failed');g.add(mesh(merged,mat));
    }
  }
  sourceGeometries.forEach(g=>g.dispose());
  const assembly=groups.map((g,i)=>({g,position:g.position.clone(),offset:new T.Vector3((i%3-1)*.12,(i%2)*.05,i===0?0:.1+i*.035)}));
  root.userData={title:'昨天，今天',english:'Yesterday, Today',layers:groups.length,reference:'User-provided pink/purple/red pearlescent album assemblage. Independently authored geometry; no source image, artist credits or watermark included.'};
  return {root,groups,setSeparated(value){const t=T.MathUtils.clamp(Number(value),0,1);for(const a of assembly)a.g.position.copy(a.position).addScaledVector(a.offset,t);},dispose(){const gs=new Set(),ms=new Set(),ts=new Set(Object.values(maps));root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material){ms.add(o.material);for(const value of Object.values(o.material))if(value?.isTexture)ts.add(value);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());}};
}
