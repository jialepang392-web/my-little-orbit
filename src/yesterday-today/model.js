/** v0.9 — folded time specimen. Authored all around an unflattened volume.
 * Printed fragments, attachment points and front/back passages are geometry.
 * No generated cover is projected onto the sculpture; exports use this scene.
 */
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom } from '../math.js?v=090';
import { makeYesterdayTextures } from './textures.js?v=090';
const Z=new T.Vector3(0,0,1),Y=new T.Vector3(0,1,0),TAU=Math.PI*2;
const v=p=>new T.Vector3(...p);

export function makeYesterdayToday({glyphs={}}={}){
  const root=new T.Group();root.name='YESTERDAY-TODAY';
  const groups=[],maps=makeYesterdayTextures(glyphs),random=seededRandom(26091809);
  const layer=name=>{const g=new T.Group();g.name=name;root.add(g);groups.push(g);return g;};
  const mat=o=>new T.MeshPhysicalMaterial({side:T.DoubleSide,...o});
  const pearl=mat({color:'#e0cfdb',map:maps.membrane,roughness:.39,metalness:.24,iridescence:.68,iridescenceIOR:1.34,iridescenceThicknessRange:[180,570],clearcoat:.48,bumpMap:maps.folds,bumpScale:.035});
  const depth=mat({color:'#50374f',roughness:.51,metalness:.25,bumpMap:maps.folds,bumpScale:.052});
  const violet=mat({color:'#716096',roughness:.31,metalness:.59,iridescence:.47,clearcoat:.4,bumpMap:maps.folds,bumpScale:.022});
  const silver=mat({color:'#e0dce2',roughness:.30,metalness:.96,bumpMap:maps.folds,bumpScale:.046});
  const white=mat({color:'#eee4da',roughness:.68,metalness:.02});
  const red=mat({color:'#e40824',roughness:.27,metalness:.04,clearcoat:.63,clearcoatRoughness:.25});
  const redDark=mat({color:'#891b35',roughness:.38,metalness:.23});
  const glass=mat({color:'#f6edf3',roughness:.09,metalness:0,transmission:.90,thickness:.14,ior:1.44,iridescence:.56,clearcoat:.65,iridescenceThicknessRange:[180,460]});
  const rose=mat({color:'#d9a5c6',roughness:.22,transmission:.57,thickness:.11,ior:1.37,iridescence:.5,clearcoat:.5});
  const wine=mat({color:'#b72960',roughness:.28,metalness:.35,iridescence:.18});
  const pink=mat({color:'#f3c7d2',map:maps.petal,roughness:.62,sheen:.7,sheenColor:'#f5c8d6',sheenRoughness:.7});
  const pale=mat({color:'#fff1e8',map:maps.petal,roughness:.70,sheen:.55,sheenColor:'#e6c0d4'});
  const fiber=mat({color:'#f3d4df',roughness:.87,sheen:.8,sheenColor:'#f2b5d0'});
  const fiberDark=mat({color:'#ce86a7',roughness:.82});
  const wire=mat({color:'#b775a8',metalness:.77,roughness:.3});
  const steel=mat({color:'#bfc0cc',metalness:.94,roughness:.23});
  const inkPaper=[maps.paperA,maps.paperB,maps.paperC].map(map=>mat({map,color:'#fff9f0',roughness:.95,metalness:0,bumpMap:maps.paperGrain,bumpScale:.011}));
  function mesh(geo,m,p=[0,0,0]){const o=new T.Mesh(geo,m);o.position.set(...p);o.castShadow=!(m.transmission>0||m.transparent);o.receiveShadow=true;return o;}
  const curve=(pts,closed=false)=>new T.CatmullRomCurve3(pts.map(v),closed,'catmullrom',.48);
  const tube=(path,r,m,steps=100,sides=6)=>mesh(new T.TubeGeometry(path,steps,r,sides,path.closed),m);
  function ball(p,r,m,scale=[1,1,1]){const o=mesh(new T.SphereGeometry(r,20,14),m,p);o.scale.set(...scale);return o;}
  function orient(o,normal,spin=0){o.quaternion.setFromUnitVectors(Z,v(normal).normalize());o.rotateZ(spin);return o;}

  const core=layer('01 / FOLDED PEARLESCENT MEMORY CORE');
  const cg=new T.SphereGeometry(1.94,72,48),cp=cg.attributes.position;
  for(let i=0;i<cp.count;i++){const n=new T.Vector3().fromBufferAttribute(cp,i).normalize(),r=1.91+.12*Math.sin(n.x*8+n.y*3)*Math.cos(n.z*7)+.045*Math.sin(n.y*21+n.z*11);cp.setXYZ(i,n.x*r,n.y*r*1.035,n.z*r);}
  cg.computeVertexNormals();core.add(mesh(cg,depth));
  // Core lobes enclose actual space; this thickness does not come from orbits.
  [[-.65,.88,.77,.98],[.77,.7,.65,.98],[-.82,-.63,.48,1.02],[.7,-.74,.6,.95],[-.67,.68,-.8,1.03],[.76,-.5,-.73,1.04]].forEach(([x,y,z,r],i)=>{
    const l=ball([x,y,z],r,i%3===1?violet:pearl,[1,.94,1.02]);l.rotation.set(i*.53,i*.71,i*.19);core.add(l);
  });
  // A radially wrapped, curled surface. Its edges leave the sphere and reveal
  // underlayers; tearing changes the silhouette, not just its colour map.
  function sheet(w,h,normal,radius,m,spin=0,seed=1,curl=.18){
    const geo=new T.PlaneGeometry(w,h,30,24),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i);const u=x/w*2,t=y/h*2,edge=Math.max(Math.abs(u),Math.abs(t));
      x+=Math.pow(Math.abs(t),18)*(.038*Math.sin(u*49+seed)+.018*Math.sin(u*93));
      y+=Math.pow(Math.abs(u),18)*(.035*Math.sin(t*38+seed)+.013*Math.sin(t*87));
      const n=new T.Vector3(x,y,2.25).normalize();
      const fold=(m.metalness>.15?.065:.018)*Math.sin(u*12+t*5+seed)+.013*Math.sin(t*28+u*7);
      n.multiplyScalar(radius+fold+Math.pow(edge,4)*curl*(.6+.4*Math.sin(u*4+t*3+seed)));
      p.setXYZ(i,n.x,n.y,n.z);
    }geo.computeVertexNormals();return orient(mesh(geo,m),normal,spin);
  }
  const skins=layer('02 / CURVED MEMBRANES & SILVER SEAMS');
  const skinspec=[
    [2.6,1.9,[-.46,.73,.51],2.22,pearl,-.6],[2.8,1.6,[.43,.83,.19],2.21,wine,.5],
    [1.8,2.8,[.85,.14,.45],2.22,violet,-.3],[2.1,2.6,[-.84,.16,.3],2.20,silver,.6],
    [3.0,1.6,[.2,-.85,.36],2.24,pearl,.25],[1.6,2.3,[-.57,-.58,.55],2.25,rose,-.8],
    [2.5,2.0,[.18,.65,-.8],2.24,pearl,.6],[2.1,2.3,[-.79,.12,-.59],2.21,violet,-.5],
    [2.5,2.2,[.64,-.21,-.72],2.24,silver,.55],[2.5,1.8,[-.1,-.81,-.52],2.20,wine,-.3],
    [1.3,2.3,[.12,.13,-1],2.27,rose,.1],[1.65,1.7,[-.47,-.71,-.62],2.30,pearl,.6],
    [1.45,1.14,[-.30,.48,.85],2.18,pearl,-.4],[1.36,.68,[-.06,-.60,.82],2.18,silver,.3]
  ];
  skinspec.forEach(([w,h,n,r,m,s],i)=>skins.add(sheet(w,h,n,r,m,s,10+i,.24)));

  function ribbon(points,width,m,twist=.6){
    const path=curve(points),rows=90,cols=6,ps=[],uv=[],ids=[];
    for(let i=0;i<=rows;i++){const t=i/rows,c=path.getPoint(t),tan=path.getTangent(t),across=new T.Vector3().crossVectors(tan,Z).normalize();across.applyAxisAngle(tan,twist*Math.sin(t*5));for(let j=0;j<=cols;j++){const u=j/cols*2-1,q=c.clone().addScaledVector(across,u*width*.5*(.45+.55*Math.sin(Math.PI*t)**.4));q.z+=u*u*.09*Math.sin(t*14)+.018*Math.sin(t*68+u*12);ps.push(...q.toArray());uv.push(j/cols,t);if(i<rows&&j<cols){const a=i*(cols+1)+j,b=a+cols+1;ids.push(a,b,a+1,b,b+1,a+1);}}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return mesh(g,m);
  }
  const films=layer('03 / LUCENT FOLDS');
  films.add(ribbon([[-2.27,.6,.3],[-2.1,1.9,.75],[-.8,2.24,1.2],[.72,1.86,1.7],[1.45,.94,1.7]],.68,rose,1.9));
  films.add(ribbon([[-1.92,-.45,1.1],[-1.5,-1.8,1.85],[.02,-2.15,1.9],[1.72,-1.58,1.45],[2.04,-.63,.48]],.73,pearl,1.15));
  films.add(ribbon([[1.15,1.73,-1.3],[2.01,.85,-.6],[2.35,-.4,.22],[1.85,-1.1,1.58],[.5,-1.0,2.3]],.42,glass,1.3));
  films.add(ribbon([[-1.8,-1.5,-.25],[-1.38,-.96,-1.82],[-.12,.05,-2.47],[1.02,1.3,-1.72]],.53,glass,1.4));
  for(let i=0;i<5;i++)films.add(ribbon([[-1.8,-1.2,1.2],[-.7,-2.03-i*.03,1.5],[.95,-2.29+i*.06,.94],[1.84,-1.65,.67]],.04+i*.014,i%2?pearl:silver,.9));

  const record=layer('04 / EMBEDDED RECORD & PRINTED TIME');
  record.position.set(.28,-.12,2.02);record.rotation.set(.10,-.19,-.105);
  const disc=mesh(new T.CylinderGeometry(1.07,1.03,.10,100),depth);disc.rotation.x=Math.PI/2;record.add(disc);
  record.add(mesh(new T.RingGeometry(.77,1.068,128),violet,[0,0,.058]));
  for(let i=0;i<18;i++)record.add(mesh(new T.TorusGeometry(.815+i*.012,.0018,3,100),i%3?steel:pearl,[0,0,.063]));
  record.add(mesh(new T.CircleGeometry(.767,100),mat({map:maps.label,roughness:.88}),[0,0,.071]));
  record.add(mesh(new T.TorusGeometry(1.08,.016,7,110,.0+Math.PI*1.52),steel,[0,0,.018]));
  record.add(ball([0,-.43,.085],.036,red,[.66,1.06,.5]));
  // The first visual review rejected a broad, flat C-shaped frame. A narrow
  // bent bridge now connects two folds without becoming a second front plate.
  films.add(ribbon([[-1.34,1.15,1.60],[-.72,1.46,2.13],[.10,1.31,2.30],[.66,.73,2.09]],.12,steel,.5));
  films.add(ribbon([[1.15,.39,2.0],[1.31,-.03,1.93],[1.28,-.48,1.76]],.073,silver,.4));

  const conduit=layer('05 / RED CORRUGATED CONDUIT');
  const hose=curve([[-1.1,1.16,-1.80],[-1.0,2.18,-.73],[-.63,2.39,.70],[.3,2.02,1.70],[1.35,1.39,1.94],[2.15,.52,1.24],[2.30,-.52,.14],[1.72,-1.54,-.86],[.44,-2.06,-1.04]]);
  const seg=1160,sides=14,frames=hose.computeFrenetFrames(seg,false),hp=[],hu=[],hi=[];
  for(let i=0;i<=seg;i++){const t=i/seg,c=hose.getPointAt(t),r=.105+.038*Math.pow(.5+.5*Math.cos(t*TAU*116),.65);for(let j=0;j<=sides;j++){const a=j/sides*TAU,p=c.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);hp.push(...p.toArray());hu.push(t*20,j/sides);if(i<seg&&j<sides){const k=i*(sides+1)+j,b=k+sides+1;hi.push(k,b,k+1,b,b+1,k+1);}}}
  const hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(hp,3));hg.setAttribute('uv',new T.Float32BufferAttribute(hu,2));hg.setIndex(hi);hg.computeVertexNormals();conduit.add(mesh(hg,red));
  for(const t of [0,.20,.62,1]){const c=mesh(new T.CylinderGeometry(.143,.143,t===0||t===1?.19:.048,24),steel);c.position.copy(hose.getPointAt(t));c.quaternion.setFromUnitVectors(Y,hose.getTangentAt(t));conduit.add(c);}
  // Thin return line ties the lower foreground back to the larger red device.
  conduit.add(tube(curve([[-2.1,.48,-1.1],[-2.43,-.51,.32],[-1.42,-1.18,2.15],[.46,-1.4,2.15],[1.64,-.79,1.76],[2.22,.38,.8]]),.027,redDark,150,7));

  const orbits=layer('06 / ORBITAL ATTACHMENTS');
  const paths=[
    curve([[-2.53,1.42,.12],[-1.32,2.71,.63],[.7,2.65,-.58],[2.38,1.27,-1.16],[2.65,-.62,.02],[.47,-2.53,1.68],[-1.79,-1.86,1.73],[-2.70,.21,1.25]],true),
    curve([[-2.58,-1.37,.05],[-2.16,-.04,1.89],[-.69,1.55,2.05],[1.22,2.50,.64],[2.29,1.20,-1.31],[1.14,-1.71,-2.12],[-.63,-2.58,-.71]],true),
    curve([[-2.36,.50,-1.13],[-1.55,-.33,-2.23],[.89,.43,-2.40],[2.54,.50,-.43],[2.14,-.32,1.83],[.28,-.87,2.55],[-1.88,-.24,1.89]],true)
  ];
  paths.forEach((p,i)=>orbits.add(tube(p,i===0?.014:.010,i===1?steel:wire,180,6)));
  for(const [index,t] of [[0,.02],[0,.40],[0,.71],[1,.18],[1,.57],[2,.23],[2,.82]]){const point=paths[index].getPoint(t);orbits.add(ball(point.toArray(),.052,steel));const clasp=mesh(new T.TorusGeometry(.068,.009,5,20),steel,point.toArray());orient(clasp,paths[index].getTangent(t).toArray());orbits.add(clasp);}

  const lenses=layer('07 / GLASS MEMORY WINDOWS');
  [[-1.05,2.27,1.12,.42,-.32],[-2.35,.74,1.13,.38,-.52],[1.91,-.87,1.5,.38,.42],[-1.81,-1.92,.89,.47,.44],[.71,2.45,-.78,.36,.8],[-1.76,.95,-1.76,.38,-.3]].forEach(([x,y,z,r,a],i)=>{
    const lens=new T.Group();lens.position.set(x,y,z);lens.rotation.set(.2,a,a*.57);lens.add(ball([0,0,0],r,i%3?glass:rose,[1,1.14,.16]));lens.add(mesh(new T.TorusGeometry(r,.006,5,68),steel));lens.add(ball([0,-r,.005],.04,steel));lenses.add(lens);
  });

  const blooms=layer('08 / BLOSSOMS THROUGH THE SEAM');
  function petal(length,width,seed){const p=[],uv=[],idx=[],rows=16,cols=8;for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){const t=i/rows,u=j/cols*2-1,w=width*Math.pow(Math.sin(Math.PI*t),.58)*(1+.1*Math.sin(t*19+seed)),z=length*(.28*Math.sin(t*2.8)+u*u*.20*Math.sin(t*Math.PI))+.009*Math.sin(t*28+u*4+seed);p.push(u*w,t*length,z);uv.push(j/cols,t);if(i<rows&&j<cols){const a=i*(cols+1)+j,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
  const pg=petal(.39,.18,91);
  [[-1.08,.92,1.86,.85],[-1.55,.56,1.60,.75],[-1.27,.15,1.97,1.06],[-1.63,-.14,1.67,.63],[-1.02,-.42,2.11,.68],[-.83,-1.17,1.85,.70],[-1.39,1.23,1.33,.56],[-1.97,.80,.76,.54],[-.76,-.71,-2.12,.78],[-1.16,-.25,-1.88,.63]].forEach(([x,y,z,s],i)=>{
    const flower=new T.Group();flower.position.set(x,y,z);flower.scale.setScalar(s);orient(flower,[x*.19,y*.18,z>0?1:-1],i*1.67);
    for(let k=0;k<7;k++){const p=mesh(pg,i%3?pink:pale);p.rotation.set((random()-.5)*.38,0,k*TAU/7);flower.add(p);}
    for(let k=0;k<7;k++){const a=k*TAU/7;flower.add(ball([Math.cos(a)*.05,Math.sin(a)*.05,.10+random()*.025],.014,white));}
    const anchor=v([x*.82,y*.86,z*.86]);blooms.add(tube(new T.QuadraticBezierCurve3(anchor,anchor.clone().lerp(flower.position,.6).add(v([-.05,.08,.07])),flower.position),.017,redDark,20,5));blooms.add(flower);
  });
  for(const [p,s,a] of [[[-1.96,1.07,1.16],.54,.8],[[.88,-1.82,1.39],.46,-.5],[[-2.32,-.29,.94],.42,-.8]]){const o=mesh(pg,pale,p);o.scale.setScalar(s);o.rotation.set(.6,.3,a);blooms.add(o);}

  const feathers=layer('09 / SOFT FEATHER CODA');
  function plume(pts,width,count){const spine=curve(pts);feathers.add(tube(spine,.010,fiberDark,72,5));for(let i=2;i<count;i++){const t=i/count,center=spine.getPoint(t),tan=spine.getTangent(t),normal=new T.Vector3().crossVectors(tan,Z).normalize(),w=width*Math.sin(t*Math.PI)**.72;for(const sign of [-1,1]){const len=w*(.65+random()*.43),end=center.clone().addScaledVector(normal,sign*len).addScaledVector(tan,.36*len);end.z+=.10*Math.sin(t*9+sign)+(random()-.5)*.04;const mid=center.clone().lerp(end,.57).addScaledVector(tan,-len*.11);feathers.add(tube(new T.QuadraticBezierCurve3(center,mid,end),.0021+random()*.0017,i%9?fiber:fiberDark,10,3));if(i%2===0){const tip=end.clone().addScaledVector(tan,.06+random()*.09);feathers.add(tube(new T.QuadraticBezierCurve3(center.clone().lerp(end,.3),end,tip),.0018,fiber,7,3));}}}}
  plume([[-1.18,-1.29,1.76],[-.77,-1.91,2.0],[.47,-2.27,1.95],[1.65,-2.18,1.36],[2.35,-2.35,.74]],.41,135);
  plume([[-1.65,1.28,1.21],[-.88,1.79,1.98],[.03,1.84,2.10],[.88,1.57,1.77]],.21,90);
  plume([[.39,-1.69,-1.55],[.99,-.91,-2.17],[1.12,.05,-2.04],[.90,.70,-1.95]],.24,80);

  const details=layer('10 / PEARLS & FIXINGS');
  [[-1.93,-1.1,1.14,.15],[-.66,1.77,1.55,.11],[1.07,-1.57,1.72,.17],[1.72,.86,1.40,.12],[-2.01,1.30,.76,.11],[.51,.91,-2.28,.13],[-1.83,-.68,-1.4,.12]].forEach(([x,y,z,r],i)=>details.add(ball([x,y,z],r,i%3===0?rose:i%3===1?pearl:glass)));
  for(const [p,r,m] of [[[1.47,-.69,1.88],.07,red],[[-1.7,1.96,.85],.065,violet],[[.06,-2.1,-1.36],.085,red]])details.add(ball(p,r,m));
  const papers=layer('11 / PRINTED MEMORY — RECTO & VERSO');
  const paperSpec=[
    [1.48,1.20,[-.69,.42,.7],2.35,-.40,0],[1.26,1.64,[-.82,-.40,.51],2.37,.38,1],
    [1.27,.88,[.68,.51,.67],2.40,.40,2],[1.10,1.5,[.77,-.40,.42],2.40,-.38,0],
    [1.34,1.05,[.07,-.77,.7],2.40,.2,1],[1.12,1.02,[-.36,.90,.20],2.31,-.5,1],
    [1.34,.83,[-.13,.53,.84],2.25,.16,2],
    [1.52,1.58,[-.44,.43,-.81],2.41,-.35,0],[1.50,1.15,[.45,.50,-.74],2.39,.3,1],
    [1.31,1.75,[.36,-.49,-.8],2.42,-.3,2],[1.20,1.2,[-.6,-.41,-.72],2.38,.25,1]
  ];
  paperSpec.forEach(([w,h,n,r,s,k],i)=>{
    const backing=sheet(w+.025,h+.025,n,r-.016,white,s,310+i,.26);papers.add(backing);
    papers.add(sheet(w,h,n,r,inkPaper[k],s,310+i,.26));
    // Small wire staples actually bridge paper and substrate.
    const pin=orient(new T.Group(),n,s);pin.add(tube(curve([[-w*.25,h*.28,r-.08],[-w*.25,h*.28,r+.05],[-w*.12,h*.28,r+.07],[-w*.12,h*.28,r-.08]]),.009,steel,20,5));papers.add(pin);
  });
  // Back has a distinct open seam and an inset glass window, not another label.
  papers.add(tube(curve([[-.47,.43,-2.18],[-.33,.66,-2.37],[.16,.54,-2.46],[.31,.05,-2.34]]),.015,steel,70,7));

  // Merge within an authored layer, retaining physically distinct materials.
  root.updateMatrixWorld(true);const originals=new Set();
  for(const g of groups){const inv=g.matrixWorld.clone().invert(),buckets=new Map();g.traverse(o=>{if(!o.isMesh)return;originals.add(o.geometry);const geo=o.geometry.clone();geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));if(!geo.index)geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i));if(!geo.attributes.uv)geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{m:o.material,geos:[]});buckets.get(key).geos.push(geo);});g.clear();for(const {m,geos} of buckets.values()){const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!merged)throw new Error('Artwork geometry merge failed');g.add(mesh(merged,m));}}
  originals.forEach(g=>g.dispose());
  const positions=groups.map(g=>g.position.clone());
  root.userData={title:'昨天，今天',english:'Yesterday, Today',version:'0.9.0',layers:groups.length,coreAxes:[3.88,4.01,3.88],labelRadius:.767,provenance:'Original procedural sculpture and limited lettering. No source cover, artist credits, watermark or font file.'};
  return {root,groups,setSeparated(value){const t=T.MathUtils.clamp(Number(value),0,1);groups.forEach((g,i)=>{g.position.copy(positions[i]);if(i){g.position.z+=(i%2?1:-1)*(.11+i*.023)*t;g.position.x+=(i%3-1)*.07*t;}});},dispose(){const gs=new Set(),ms=new Set(),ts=new Set(Object.values(maps));root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());}};
}
