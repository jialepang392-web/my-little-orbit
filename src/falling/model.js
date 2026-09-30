import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials,random} from './materials.js?v=0280';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),TAU=Math.PI*2;
const S=(lon,lat,r=1.3)=>V(r*Math.cos(lat)*Math.sin(lon),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(lon));
const curve=pts=>new T.CatmullRomCurve3(pts.map(p=>p.isVector3?p.clone():V(...p)));
const tube=(pts,r=.003,n=24,s=4)=>new T.TubeGeometry(curve(pts),n,r,s,false);
function grid(fn,nu=16,nv=20,thickness=0){
  const xyz=[],uv=[],face=[],back=[],edge=[],count=(nu+1)*(nv+1);
  for(let side=0;side<(thickness?2:1);side++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const p=fn(i/nu,j/nv);if(side)p.z-=thickness;xyz.push(...p.toArray());uv.push(i/nu,j/nv);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;face.push(a,b,d,a,d,c);if(thickness)back.push(a+count,d+count,b+count,a+count,c+count,d+count);}
  if(thickness){const rim=[];for(let i=0;i<=nu;i++)rim.push(i);for(let j=1;j<=nv;j++)rim.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)rim.push(nv*(nu+1)+i);for(let j=nv-1;j>0;j--)rim.push(j*(nu+1));for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];edge.push(a,a+count,b+count,a,b+count,b);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([...face,...back,...edge]);g.computeVertexNormals();if(thickness){g.addGroup(0,face.length,0);g.addGroup(face.length,back.length+edge.length,1);}return g;
}
function frame(n,roll=0){return new T.Quaternion().setFromUnitVectors(V(0,0,1),n.clone().normalize()).multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),roll));}
function pose(g,p,n,roll=0){g.applyQuaternion(frame(n,roll));g.translate(...p.toArray());return g;}
function petal(length,width,lift,seed){return grid((a,t)=>{const u=a*2-1,w=width*Math.pow(Math.sin(t*Math.PI*.87),.64)*(1+.12*u*Math.sin(seed));return V(u*w+.12*width*Math.sin(seed)*t*t,t*length*(.86+.14*Math.sqrt(Math.max(0,1-u*u))),lift*Math.sin(t*Math.PI*.71)+u*u*width*.27*t+Math.pow(t,5)*width*.26*Math.sin(u*3+seed));},8,13);}

export function makeFalling(){
  const root=new T.Group();root.name='在坠落时 / Sewn gravity';const{m,dispose:disposeMaterials}=makeMaterials(),r=random(280930),owned=new Set(),groups=[],buckets=new Map();
  function group(name,offset){const g=new T.Group();g.name=name;g.userData.offset=offset;root.add(g);groups.push(g);return g;}
  function add(name,g,mat,parent,shadow=true){owned.add(g);const o=new T.Mesh(g,mat);o.name=name;o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
  function collect(g,mat,parent,name='material fragments',shadow=true){if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));const key=parent.uuid+'/'+mat.uuid+'/'+shadow;let b=buckets.get(key);if(!b){b={gs:[],mat,parent,name,shadow};buckets.set(key,b);}b.gs.push(g);}
  function collectSheet(geometry,materials,parent,name){
    // Merge like materials within each structural layer, retaining distinct
    // fronts, backs and cut edges without hundreds of per-sheet draw calls.
    for(const part of geometry.groups){
      const remap=new Map(),indices=[],arrays={};for(const key of Object.keys(geometry.attributes))arrays[key]=[];
      for(let k=part.start;k<part.start+part.count;k++){
        const source=geometry.index.getX(k);let dest=remap.get(source);
        if(dest===undefined){dest=remap.size;remap.set(source,dest);for(const [key,attr]of Object.entries(geometry.attributes))for(let c=0;c<attr.itemSize;c++)arrays[key].push(attr.array[source*attr.itemSize+c]);}
        indices.push(dest);
      }
      const g=new T.BufferGeometry();for(const[key,values]of Object.entries(arrays))g.setAttribute(key,new T.Float32BufferAttribute(values,geometry.attributes[key].itemSize));g.setIndex(indices);collect(g,materials[part.materialIndex],parent,name);
    }
    geometry.dispose();
  }
  function flush(){for(const b of buckets.values()){const g=mergeGeometries(b.gs,false);if(!g)throw new Error('Incompatible assemblage geometry: '+b.name);b.gs.forEach(g=>g.dispose());add(b.name,g,b.mat,b.parent,b.shadow);}buckets.clear();}
  const core=group('01 / 遮蔽的暗芯',[0,0,0]),cloth=group('02 / 灰粉与酒红衬层',[0,-.027,.012]),black=group('03 / 交错黑纸骨架',[-.04,.03,.055]),silver=group('04 / 银箔反折与冷边',[.035,.023,.070]),gauze=group('05 / 缝口与纤维',[.012,.014,.09]),botanic=group('06 / 夹生于层间的花',[-.022,-.015,.08]),ruby=group('07 / 缠接的红色线索',[.022,-.033,.065]),back=group('08 / 背向的拼接体',[-.02,.016,-.073]),inscription=group('09 / 嵌入与覆印',[0,.01,.068]),tail=group('10 / 松动的边缘',[.024,-.047,.016]);
  // This internal equal-axis support is deliberately recessed. The perceived
  // volume comes from interlocking sheets, not an exposed round shell.
  const ball=new T.SphereGeometry(1.065,64,48),pa=ball.attributes.position;
  for(let i=0;i<pa.count;i++){const p=V().fromBufferAttribute(pa,i),n=p.clone().normalize(),d=.018*Math.sin(n.x*11+n.z*7)*Math.sin(n.y*9-n.z*5);p.multiplyScalar(1+d/1.065);pa.setXYZ(i,...p.toArray());}ball.computeVertexNormals();add('recessed dark equal-axis support',ball,m.core,core);
  let patchCount=0,beadCount=0,petalCount=0,flowerCount=0,stitchCount=0,fragmentCount=0,chainCount=0;
  // Each independently cut sheet bends around its own tangent frame. Angular
  // folds, unequal cut corners and lifted edges prevent a tiled globe reading.
  function patch(name,lon,lat,w,h,roll,mat,parent,{radius=1.27,fold=.07,lift=.10,seed=1,thickness=.006,wrap=.24}={}){
    const origin=S(lon,lat,radius),q=frame(origin,roll),phase=seed*.89;
    const surface=(a,b)=>{const u=a*2-1,v=b*2-1,trim=1-.19*Math.max(0,v-.23)-.13*Math.max(0,-v-.58),x=u*w*.5*trim+.016*w*Math.sin(b*21+phase)*Math.pow(Math.abs(u),7),y=v*h*.5+.022*h*Math.sin(a*17+phase)*Math.pow(Math.abs(v),9);
      const crease=fold*(.70*Math.abs(u-v*.31-.10)+.45*Math.max(0,v+u*.51-.25)-.18),free=lift*(Math.pow(Math.max(0,u),4)*(.25+.75*Math.sin(b*Math.PI))+.27*Math.pow(Math.max(0,v),5));
      const z=crease+free-wrap*(x*x+y*y)+.003*Math.sin(b*19+a*11+phase);return V(x,y,z);
    };
    let g=grid(surface,16,20,thickness);g.applyQuaternion(q);g.translate(...origin.toArray());
    const backing=mat===m.silver||mat===m.edgeSilver?m.silverBack:mat===m.black||mat===m.graphite||mat===m.print?m.paperBack:mat;
    collectSheet(g,[mat,backing],parent,name+' / merged matching faces');patchCount++;
    return (a,b)=>surface(a,b).applyQuaternion(q).add(origin);
  }
  // Compressed dark underlaps: overlapping irregular material surfaces rather
  // than one continuous exposed ball. Different meridians do not share seams.
  for(let band=0;band<3;band++)for(let i=0;i<8;i++){
    const lon=i*TAU/8+band*.36,lat=[-.68,.03,.70][band]+(r()-.5)*.16;
    patch('buried cloth/carbon underlap '+band+'-'+i,lon,lat,.99+r()*.15,1.06,(r()-.5)*1.5,(i+band)%4===0?m.darkSilk:m.black,cloth,{radius:1.12+r()*.028,fold:.055,lift:.045,seed:20+band*8+i});
  }
  // Hand-composed unequal knots. Front is an overlapping broken diagonal;
  // the two flanks and reverse have their own similarly dense assemblies.
  const knots=[
    [-.70,.78,-.72,1.04],[-.19,.64,.31,.88],[.39,.76,-.55,.89],[.84,.38,.52,.93],
    [-.67,.28,-.39,.98],[-.13,.17,.68,1.05],[.37,.01,-.43,.97],[.74,-.29,.48,.85],
    [-.83,-.32,.55,.95],[-.36,-.48,-.62,.99],[.13,-.70,.28,.91],[-.30,-.93,-.23,.79],
    [1.38,.54,-.62,.91],[1.62,.02,.44,1.03],[1.53,-.62,-.48,.92],
    [-1.44,.49,.55,.88],[-1.66,-.13,-.49,.92],[-1.46,-.65,.41,.82],
    [2.20,.57,.55,.91],[2.56,-.02,-.65,.98],[2.49,-.62,.29,.89],
    [3.01,.73,-.43,.89],[3.23,.16,.36,1.01],[-2.61,.50,-.66,.87],[-2.73,-.31,.48,.99],[3.02,-.66,-.31,.91],
    [1.25,.14,-.73,.72],[1.92,.34,.63,.75],[1.85,-.32,-.28,.78],[1.19,-.45,.86,.68],
    [-1.22,-.09,.26,.67],[-1.91,.15,-.74,.79],[-1.82,-.46,.43,.73],
    [2.85,.27,-.88,.72],[-2.88,.01,.69,.76],[2.83,-.21,-.56,.75],[-2.28,-.03,.35,.66],
    [-.15,-.20,.80,.68],[.30,-.33,-.76,.62]
  ];
  const contacts=[];
  knots.forEach(([lon,lat,a,s],i)=>{
    const rear=Math.cos(lon)<-.25,parent=rear?back:black,base=(i>=26?1.32:1.235)+(i%4)*.017;
    const common={seed:100+i*17,wrap:.21};
    patch('fold knot '+i+' / grey-pink backing',lon-.045,lat-.027,.65*s,.73*s,a+.10,i%3===0?m.dustRose:m.linen,rear?back:cloth,{...common,radius:base-.028,fold:.055,lift:.075});
    patch('fold knot '+i+' / carbon load-bearing face',lon,lat,.70*s,.77*s,a,m.black,parent,{...common,radius:base,fold:.12,lift:.12});
    const metal=patch('fold knot '+i+' / narrow silver underturn',lon+.09,lat+.025,.24*s,.69*s,a+.24,i%4===0?m.edgeSilver:m.silver,rear?back:silver,{...common,radius:base+.044,fold:.086,lift:.14,thickness:.003});
    patch('fold knot '+i+' / graphite interleaf',lon-.086,lat-.086,.50*s,.44*s,a-.51,i%6===1?m.print:m.graphite,parent,{...common,seed:109+i*17,radius:base+.097,fold:.083,lift:.09});
    patch('fold knot '+i+' / ash or faded rose offcut',lon+.012,lat-.17,.30*s,.32*s,a+.73,i%3===1?m.dustRose:m.ash,rear?back:cloth,{...common,seed:116+i*17,radius:base+.113,fold:.075,lift:.082});
    patch('fold knot '+i+' / black interrupted cap',lon-.03,lat-.11,.28*s,.38*s,a-.28,m.black,parent,{...common,radius:base+.158,fold:.09,lift:.10});
    if(i%3!==0)patch('fold knot '+i+' / sharp silver lip',lon-.16,lat+.09,.10*s,.36*s,a-.55,m.edgeSilver,rear?back:silver,{...common,radius:base+.13,fold:.08,lift:.13,thickness:.003});
    contacts.push({lon,lat,a,s,metal,parent:rear?back:gauze});
  });
  // Larger narrow charcoal ribs tie knots together without blanking the core.
  for(const [lon,lat,w,h,a]of [[-.44,.98,.30,.82,-.52],[.31,.42,.30,.81,.60],[-.58,-.08,.28,.83,-.65],[.55,-.65,.31,.75,.75],[1.80,.27,.29,.93,-.26],[2.92,-.20,.32,.95,.36],[-2.49,-.14,.30,.85,-.54]])
    patch('long folded carbon bridge',lon,lat,w,h,a,m.black,Math.cos(lon)<0?back:black,{radius:1.40,fold:.10,lift:.17,seed:287+Math.round(lon*10)});
  // Free margins break the outline but remain rooted inside the material mass.
  const margins=[[-.70,1.06,.30,.67,-.50],[-.10,1.20,.21,.48,.45],[.51,1.02,.25,.62,-.38],[1.19,.75,.28,.61,.51],[-1.39,.24,.23,.74,-.30],[1.43,-.23,.27,.65,.42],[-.88,-.91,.27,.56,-.65],[.21,-1.05,.19,.63,.17],[-1.78,.80,.24,.55,.32],[2.15,.87,.28,.62,-.31],[2.94,1.06,.20,.47,.61],[-2.27,-.82,.25,.61,-.45],[2.30,-.88,.21,.50,.47]];
  margins.forEach(([lon,lat,w,h,a],i)=>{
    patch('rooted broken silhouette '+i,lon,lat,w,h,a,i%4===1?m.silver:i%4===2?m.print:m.black,Math.cos(lon)<0?back:tail,{radius:1.35,fold:.13,lift:.25,wrap:.08,seed:340+i});
    if(i%2===0)patch('exposed underside of margin '+i,lon+.017,lat-.025,w*1.05,h*.83,a+.035,m.dustRose,Math.cos(lon)<0?back:cloth,{radius:1.31,fold:.10,lift:.19,seed:340+i});
  });
  // Thread lattices are narrow irregular torn webs, folded into contact zones.
  function net(name,points,width,parent,seed){
    const path=curve(points),rng=random(seed);
    const f=(u,t)=>{const p=path.getPoint(t),d=path.getTangent(t),n=p.clone().normalize(),side=new T.Vector3().crossVectors(d,n).normalize(),span=width*(.14+.34*Math.sin(Math.PI*t)+.052*Math.sin(t*12+seed));return p.addScaledVector(side,u*span).addScaledVector(n,.019*Math.sin(t*Math.PI)+.014*Math.sin(t*12+u*7));};
    for(let i=0;i<14;i++){const start=rng()*.045,end=.98-rng()*.14,pts=[];for(let j=0;j<16;j++)pts.push(f(i/13*2-1,start+(end-start)*j/15));collect(tube(pts,.0017+rng()*.00065,24,3),i%5===1?m.blackThread:m.thread,parent,name,false);}
    for(let j=1;j<22;j++){if(j%7===3)continue;const pts=[];for(let i=0;i<8;i++)pts.push(f(i/7*2-1,(j+.28*Math.sin(i+seed))/25));collect(tube(pts,.0015,13,3),m.thread,parent,name,false);}
  }
  contacts.forEach(({lon,lat,a,s,metal,parent},i)=>{
    for(let j=0;j<5+(i%4);j++){const t=.15+j*.091,p=metal(.77,t),q=metal(.97,t+.032),mid=p.clone().lerp(q,.5).multiplyScalar(1.012);collect(tube([p,mid,q],.0022,7,3),i%3===0?m.redThread:m.thread,parent,'cross-material sewing',false);stitchCount++;}
    if(i%2===0){const pts=[];for(let j=1;j<17;j++)pts.push(metal(.992,j/18));collect(tube(pts,.0021,22,3),m.edgeSilver,parent,'cold cut edges',false);}
    if(i%3!==1)net('torn mesh inside seams',[S(lon-.13,lat+.24,1.38),S(lon-.17,lat+.08,1.48),S(lon+.05,lat-.12,1.49),S(lon+.14,lat-.24,1.36)],.24*s,parent,410+i);
    // Offcuts, tiny inset mineral bits, flakes and folded staples stay near a
    // seam, never uniformly sprayed into the surrounding air.
    for(let j=0;j<8;j++){
      const lo=lon-.15+(r()-.5)*.20,la=lat+.14+(r()-.5)*.34,p=S(lo,la,1.40+r()*.10),g=new T.IcosahedronGeometry(.025+r()*.039,0);g.scale(.65+r()*.8,.30+r()*.52,.12+r()*.22);g.rotateZ(r()*TAU);pose(g,p,p,(r()-.5)*2);collect(g,j%4===0?m.roseStone:j%3===0?m.edgeSilver:m.stone,parent,'embedded flakes and mineral offcuts');fragmentCount++;
    }
    if(i%2===0){const p=metal(.70,.42),g=new T.TorusGeometry(.022,.003,4,12);pose(g,p,p,.7);collect(g,m.oldGold,parent,'crooked little binding eyes',false);}
  });
  // Several red trajectories share actual fastening nodes. They alternate
  // exposed arcs with buried segments rather than circling the whole globe.
  function chain(name,points,size,step,parent=ruby){
    const path=curve(points),count=Math.max(2,Math.floor(path.getLength()/step));chainCount++;
    collect(new T.TubeGeometry(path,count*2,.0028,4,false),m.redThread,parent,'ruby support threads',false);
    for(let i=0;i<=count;i++){
      const t=Math.min(1,Math.max(0,(i+(r()-.5)*.28)/count)),p=path.getPointAt(t),d=path.getTangentAt(t),rr=size*(.65+r()*.60);let g;
      if(i%7===2||i%11===0){g=new T.TorusGeometry(rr,rr*.25,5,13);pose(g,p,p,(r()-.5)*1.4);}else{g=new T.SphereGeometry(rr*.80,9,7);g.scale(.74,1.15+r()*.4,.78);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0,1,0),d));g.translate(...p.toArray());}
      collect(g,i%6===1?m.garnet:m.ruby,parent,name,false);beadCount++;
    }
  }
  const redPaths=[
    [[-.58,1.37,.56],[-.72,.99,1.17],[-.48,.60,1.47],[-.19,.34,1.65],[.20,.12,1.65],[.60,-.16,1.46],[.98,-.65,1.04],[1.04,-1.15,.72],[.91,-1.63,.48]],
    [[.54,1.29,.66],[.77,.82,1.20],[.53,.57,1.48],[.14,.48,1.65],[-.35,.24,1.61],[-.68,-.15,1.40],[-.88,-.58,1.15]],
    [[-1.17,.58,.67],[-.96,.29,1.14],[-.82,-.10,1.43],[-.58,-.41,1.51],[-.12,-.54,1.59],[.35,-.62,1.49],[.78,-.82,1.10]],
    [[1.28,.70,.25],[1.45,.23,.44],[1.50,-.20,.13],[1.38,-.58,-.22],[1.10,-.78,-.65],[.61,-.66,-1.20],[.24,-.24,-1.46]],
    [[-.93,-.61,1.12],[-1.24,-.69,.69],[-1.45,-.36,.19],[-1.48,.02,-.29],[-1.24,.43,-.79],[-.87,.72,-1.08]],
    [[.65,1.11,-.64],[.77,.73,-1.15],[.42,.42,-1.49],[.06,.01,-1.61],[-.51,-.30,-1.42],[-.81,-.85,-.97],[-.72,-1.40,-.60]],
    [[-1.03,.61,-.95],[-.66,.39,-1.38],[-.27,.28,-1.61],[.11,.21,-1.64],[.57,-.04,-1.46],[1.05,-.34,-1.01]]
  ];
  redPaths.forEach((pts,i)=>{
    // Enter below a paper lip, then return to the surface; the two ends fall free.
    for(let j=1;j<pts.length-1;j++)if((i===0&&[2,5].includes(j))||(i!==0&&j%2===1)){
      const p=V(...pts[j]);if(Math.abs(p.y)<1.25&&p.length()>1.46){p.setLength(1.39+(j%3)*.025);pts[j]=p.toArray();}
    }
    chain('red path '+i,pts,[.021,.014,.016,.016,.014,.019,.014][i],[.053,.052,.051,.061,.059,.054,.057][i]);
  });
  redPaths.forEach((pts,i)=>{
    for(let j=0;j<(i<3?3:2);j++){
      const shifted=pts.map((p,k)=>V(...p).add(V(.008+j*.011,Math.sin(k*1.2+j)*.025,.014*Math.cos(k+j))));
      collect(tube(shifted,.0022+j*.0005,90,3),j%2?m.rustThread:m.redThread,ruby,'parallel crimson fibres',false);
    }
  });
  // Local loops and short fallen threads: visible network without airborne chaos.
  for(const [lon,lat,sz]of [[-.26,.28,.18],[.48,.04,.14],[-.56,-.54,.16],[1.52,.13,.15],[2.94,.12,.19],[-2.68,-.39,.14]]){
    const p=S(lon,lat,1.55),q=frame(p,.4),pts=[];for(let j=0;j<24;j++){const a=j/23*TAU*1.55;pts.push(V(Math.cos(a)*sz*(1-j*.010),Math.sin(a)*sz*.58-j*.001,.007*Math.sin(a*2)).applyQuaternion(q).add(p));}collect(tube(pts,.0036,58,4),m.redThread,ruby,'local red knot loops',false);
  }
  for(const [i,p]of redPaths.map((pts,i)=>[i,pts.at(-1)])){
    const origin=V(...p);for(let j=0;j<3;j++){const end=origin.clone().add(V((j-1)*.042,-.09-j*.027,.018*j));collect(tube([origin,origin.clone().lerp(end,.5).add(V(.013,0,.018)),end],.0016,12,3),m.rustThread,ruby,'frayed thread ends',false);}
    if(i===0||i===5){const g=new T.SphereGeometry(.025,12,9);g.scale(.62,1.9,.63);g.translate(...origin.clone().add(V(0,-.055,0)).toArray());collect(g,m.ruby,ruby,'unequal garnet weights');}
  }
  // Flowers are sewn into folds, not pasted as identical rosettes. Different
  // tiers, damaged petals, turns and sizes create irregular partial blooms.
  function flower(name,lon,lat,size,kind,seed,{radius=1.44,tilt=.12,tiers=3}={}){
    const rng=random(seed),origin=S(lon,lat,radius),normal=origin.clone().normalize().add(V(tilt,-tilt*.6,.03)).normalize(),q=frame(normal,rng()*TAU),parent=Math.cos(lon)<-.20?back:botanic;
    const mats=kind==='ivory'?[m.petal,m.petalShadow,m.petal]:kind==='rose'?[m.rose,m.petalShadow,m.rose]:kind==='rust'?[m.rustPetal,m.ochreShadow,m.rose]:[m.ochre,m.ochreShadow,m.ochre];flowerCount++;
    for(let tier=0;tier<tiers;tier++){
      const count=10+Math.floor(rng()*7)-tier*2;
      for(let i=0;i<count;i++){
        if(rng()<.11)continue;
        const a=TAU*i/count+tier*.59+(rng()-.5)*.38,length=size*(1-tier*.21)*(.69+rng()*.45),width=size*(.20-tier*.020)*(.70+rng()*.52),g=petal(length,width,size*(.06+tier*.048),seed+i*11+tier*71);
        g.rotateX((rng()-.5)*.86);g.rotateY((rng()-.5)*.36);g.rotateZ(-a);g.translate(Math.sin(a)*size*.08,Math.cos(a)*size*.08,size*tier*.032);g.applyQuaternion(q);g.translate(...origin.toArray());collect(g,mats[Math.floor(rng()*3)],parent,'irregular pressed and folded petals');petalCount++;
      }
    }
    for(let i=0;i<25;i++){const a=rng()*TAU,rr=Math.sqrt(rng())*size*.17,p=V(Math.cos(a)*rr,Math.sin(a)*rr,size*.10).applyQuaternion(q).add(origin),g=new T.IcosahedronGeometry(size*(.020+rng()*.026),0);g.scale(.75,1,.72);g.translate(...p.toArray());collect(g,m.seed,parent,'aged flower hearts');}
    const buried=S(lon-.055,lat-.16,1.21);collect(tube([buried,S(lon-.034,lat-.08,1.37),origin],.0045,14,4),m.stem,parent,'stems rooted under layers');
  }
  const blooms=[
    [-.69,.75,.180,'ochre'],[-.51,.63,.107,'ivory'],[-.87,.58,.086,'rose'],
    [-.08,.32,.137,'ivory'],[.12,.22,.086,'rose'],[.31,.09,.077,'ochre'],
    [.70,.48,.133,'ivory'],[.90,.27,.076,'rust'],
    [-.63,-.44,.116,'rose'],[-.79,-.63,.086,'ochre'],
    [.11,-.75,.205,'ivory'],[-.15,-.83,.105,'ochre'],[.38,-.64,.101,'rose'],[.27,-.97,.070,'rust'],
    [1.42,.50,.135,'ochre'],[1.58,.29,.082,'ivory'],[1.56,-.46,.149,'ivory'],[1.72,-.67,.079,'rose'],
    [-1.50,.15,.140,'rose'],[-1.38,.35,.082,'ivory'],[-1.45,-.56,.117,'ochre'],
    [2.41,.57,.171,'ivory'],[2.61,.43,.092,'ochre'],[3.17,.18,.133,'rose'],[3.35,.34,.081,'ivory'],
    [2.77,-.53,.163,'ochre'],[2.99,-.70,.087,'rose'],[-2.68,-.30,.131,'ivory'],[-2.40,-.48,.075,'rust']
  ];
  blooms.forEach(([lo,la,size,kind],i)=>flower('seam flower '+i,lo,la,size,kind,610+i*29,{radius:1.47+(i%3)*.014,tilt:(i%2?-.22:.18),tiers:size>.13?3:2}));
  // Dry leaves, broken stems, husks and fibre tufts emerge from those exact
  // seams. Directions vary; no radial repeated starburst around the ball.
  blooms.filter((_,i)=>i%2===0).forEach(([lon,lat,size],i)=>{
    const p=S(lon,lat,1.43),q=frame(p,(i%2?-.6:.7)),parent=Math.cos(lon)<-.2?back:botanic;
    for(let j=0;j<3;j++){
      const len=.16+r()*.15,w=.018+r()*.021,g=petal(len,w,.026,720+i*7+j);g.rotateZ((j-1)*.7);g.translate((j-1)*.055,-.035,-.02);g.applyQuaternion(q);g.translate(...p.toArray());collect(g,j===1?m.ochreShadow:m.petalShadow,parent,'dried leaf offcuts');
      const a=V((j-1)*.04,0,-.04).applyQuaternion(q).add(p),b=V((j-1)*.12,.22+r()*.22,.014).applyQuaternion(q).add(p);
      collect(tube([a,a.clone().lerp(b,.55).add(V(.025,0,.018)),b],.0022,17,3),m.stem,parent,'bent dried sprays',false);
      for(let k=0;k<4;k++){const t=.30+k*.17,c=a.clone().lerp(b,t),end=c.clone().add(V((k%2?1:-1)*.035,.035,.018));collect(tube([c,end],.0012,6,3),m.stem,parent,'fine seed twigs',false);const g=new T.IcosahedronGeometry(.009+r()*.009,0);g.scale(.6,1.6,.7);g.translate(...end.toArray());collect(g,m.oldGold,parent,'small dry pods',false);}
    }
    for(let j=0;j<5;j++){const end=V((r()-.5)*.23,.13+r()*.22,(r()-.5)*.08).applyQuaternion(q).add(p);collect(tube([p,p.clone().lerp(end,.5).add(V(.025,.016,.024)),end],.0013,16,3),j%3?m.blackThread:m.thread,parent,'fine loose fibres',false);}
  });
  patch('partly buried title remnant',-.37,.05,.19,.27,-.69,m.print,inscription,{radius:1.51,fold:.042,lift:.06,seed:801});
  flush();
  root.userData={title:'在坠落时',slug:'falling',sceneVersion:'0.28.0',artRevision:13,solidCore:true,bodyRadius:1.065,bodyAxes:[1,1,1],composition:'high-density stitched assemblage / weak spherical mass / rooted broken perimeter',patchCount,beadCount,petalCount,flowerCount,stitchCount,fragmentCount,chainCount,knotCount:knots.length,structureGroups:groups.length,frontFlowerGroups:6,chainComposition:'seven interlinked bead paths, parallel red fibres and six local knots continuing over both flanks and the reverse',detailTargets:{threads:[-.14,.26,1.44],flowers:[.07,-.78,1.31],fault:[.71,.19,1.18]},referenceUse:'Original actual 3D carbon, foil, grey-pink remnants, flower, mesh and red-fibre assemblage. No generated images, reference pixels or photograph replacement.'};
  let meshCount=0,triangleCount=0,exportPrimitiveCount=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;exportPrimitiveCount+=Array.isArray(o.material)?o.geometry.groups.length:1;}});Object.assign(root.userData,{meshCount,triangleCount,exportPrimitiveCount});let spread=0;
  return {root,groups,ready:Promise.resolve(),setSeparated(value){spread=value;groups.forEach(g=>g.position.fromArray(g.userData.offset).multiplyScalar(value));},setMoment(t){tail.rotation.z=Math.sin(t*.3)*.008;tail.position.y=tail.userData.offset[1]*spread-Math.sin(t*.42)*.008;},dispose(){owned.forEach(g=>g.dispose());disposeMaterials();}};
}
