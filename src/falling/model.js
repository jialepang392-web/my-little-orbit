import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials,random} from './materials.js?v=0260';

const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const TAU=Math.PI*2;
function sphere(lon,lat,r=1.3){return V(r*Math.cos(lat)*Math.sin(lon),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(lon));}
function tube(points,r=.006,segments=40,sides=5){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>p.isVector3?p:V(...p))),segments,r,sides,false);}
function pose(geometry,position,normal,roll=0){const q=new T.Quaternion().setFromUnitVectors(V(0,0,1),normal.clone().normalize());q.multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),roll));geometry.applyQuaternion(q);geometry.translate(...position.toArray());return geometry;}
// Two physical faces plus an irregular closed edge. Folded sheets retain
// thickness when seen from behind; printed maps never replace the geometry.
function sheet(w,h,{seed=1,fold=.15,curl=.09,thickness=.012,nu=22,nv=28,taper=.1,crinkle=.012,ragged=.017,crease=false}={}){
  const r=random(seed),phase=r()*6.28,p=[],uv=[],idx=[];
  function point(u,v,back=false){
    const rag=ragged*Math.sin(v*23+phase)+ragged*.45*Math.sin(v*51+phase*.4);
    const width=1-taper*v+.09*Math.sin(v*4+phase);
    const x=(u-.5)*w*width+rag*Math.pow(Math.abs(2*u-1),5);
    const y=(v-.5)*h+.022*Math.sin(u*32+phase)*Math.pow(Math.abs(2*v-1),8);
    const z=(crease?fold*(Math.abs(u-.34)-.34)+curl*(Math.abs(v-.58)-.58)+crinkle*(Math.abs(u+v*.63-.65)*2+Math.abs(v-u*.41-.21)):
      fold*Math.abs(u-.42)*1.5+curl*Math.sin(v*4+phase)+crinkle*Math.sin(u*21+v*12+phase)+crinkle*.35*Math.cos(u*41-v*19))-(back?(crease?.005:thickness):0);
    return [x,y,z];
  }
  const count=(nu+1)*(nv+1);
  for(let side=0;side<2;side++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...point(i/nu,j/nv,side));uv.push(i/nu,j/nv);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;idx.push(a,b,d,a,d,c,a+count,d+count,b+count,a+count,c+count,d+count);}
  const edge=[];for(let i=0;i<=nu;i++)edge.push(i);for(let j=1;j<=nv;j++)edge.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)edge.push(nv*(nu+1)+i);for(let j=nv-1;j>0;j--)edge.push(j*(nu+1));
  for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];idx.push(a,a+count,b+count,a,b+count,b);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function curvedPanel(lon,lat,w,h,radius,seed,crease=false){
  const g=sheet(w,h,{seed,fold:crease?.09:.04,curl:crease?.09:.015,thickness:.012,nu:22,nv:24,taper:.13,crease});const a=g.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),fold=crease?.019*Math.abs(x*3.1-y*1.7):.025*Math.sin(x*15+y*9+seed)+.023*Math.abs(Math.sin(x*9-y*5));const p=sphere(lon+x/radius,lat+y/radius,radius+z+fold);a.setXYZ(i,...p.toArray());}g.computeVertexNormals();return g;
}
function petal(length,width,cup,seed){
  const nu=12,nv=16,p=[],uv=[],index=[],r=random(seed),tilt=(r()-.5)*.16,lean=(r()-.5)*.42,asym=.85+r()*.23,notch=r()*1.7-.85;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const t=j/nv,u=i/nu*2-1,breadth=Math.pow(Math.sin(t*Math.PI*.52),.67)*width*(1+u*lean);
    const lip=.81+.19*Math.sqrt(Math.max(0,1-u*u))-.035*Math.exp(-Math.pow((u-notch)*9,2));
    const x=u*breadth+lean*width*t*t;
    const y=t*length*lip*(1+.027*Math.sin(u*14+seed)*Math.pow(t,8));
    const z=cup*.70*Math.sin(t*Math.PI*.68)+u*u*width*.24+Math.sin(t*9+u*4+seed)*.0025+t*t*tilt*length+Math.pow(t,6)*width*.26*Math.sin(u*5+seed);
    p.push(x,y*asym,z);uv.push(i/nu,t);
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1;index.push(a,b,c+1,a,c+1,c);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
}
export function makeFalling(){
  const root=new T.Group();root.name='在坠落时 / Still Falling';
  const {m,dispose:disposeMaterials}=makeMaterials();const groups=[],owned=new Set(),rng=random(60929);
  function group(name,move){const g=new T.Group();g.name=name;g.userData.offset=move||[0,0,0];root.add(g);groups.push(g);return g;}
  function mesh(name,g,mat,parent=root,shadow=true){owned.add(g);const o=new T.Mesh(g,mat);o.name=name;o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
  function batch(name,geometries,mat,parent,shadow=false){if(!geometries.length)return;const g=mergeGeometries(geometries,false);geometries.forEach(x=>x.dispose());return mesh(name,g,mat,parent,shadow);}
  function wire(name,points,mat,parent,r=.006){return mesh(name,tube(points,r),mat,parent,false);}
  const body=group('01 / 暗红体量',[0,0,0]);
  const base=new T.SphereGeometry(1.205,96,72),a=base.attributes.position;
  for(let i=0;i<a.count;i++){const p=V().fromBufferAttribute(a,i);p.multiplyScalar(1+(.012*Math.sin(p.x*13+p.y*6)*Math.sin(p.z*11-p.y*9)+.006*Math.sin(p.x*34+p.z*8))/1.205);a.setXYZ(i,...p.toArray());}base.computeVertexNormals();mesh('等轴不透明实体 / closed volume',base,m.core,body);
  const fabric=group('02 / 酒红褶层',[-.04,-.04,.06]);
  // Broad non-uniform mantle pieces read as one sphere at thumbnail size.
  for(let i=0;i<19;i++){
    const lon=(i%7)/7*TAU+.17*Math.sin(i*2.4),lat=i<7?.55:i<14?-.32:-1.06;
    mesh('velvet mantle '+i,curvedPanel(lon,lat,.93+rng()*.32,.9+rng()*.35,1.245,i+15),i%4===0?m.black:m.velvet,fabric);
  }
  const fault=group('03 / 断开的黑银面',[.08,.045,.075]);
  const plateSpecs=[[-.87,.77,.88,.83,1.30,0],[-.36,.94,.59,.66,1.32,1],[.32,.9,.61,.71,1.29,0],[.86,.52,.8,.78,1.31,1],[1.06,-.17,.61,.88,1.30,0],[.54,-.79,.86,.64,1.33,1],[-.24,-.84,.67,.7,1.31,0],[-.89,-.46,.79,.64,1.31,1],[-1.26,.06,.61,.95,1.30,1],[-.18,.30,.71,.54,1.29,0],[.76,.04,.49,.45,1.30,0],[2.00,.64,.75,.84,1.31,0],[2.64,.55,.81,.8,1.31,1],[-2.65,.73,.6,.7,1.3,1],[-2.08,.18,.9,.76,1.31,0],[2.24,-.22,.88,.69,1.31,1],[3.1,-.27,.72,.8,1.33,0],[-2.38,-.6,.76,.76,1.31,1],[1.73,-.64,.62,.8,1.33,0]];
  plateSpecs.forEach(([lon,lat,w,h,rad,light],i)=>mesh('separate folded facet '+i,curvedPanel(lon,lat,w,h,rad,100+i*3,true),light?m.silver:m.black,fault));
  const folds=group('04 / 撕开的纸与织物',[-.09,.025,.09]);
  const specs=[[-1.10,.33,1.27,.42,1.11,-.50,'linen'],[-.81,-.8,1.35,.77,.8,-.64,'silver'],[.85,-.72,1.34,.67,1.12,.49,'silver'],[.74,.7,1.36,.56,1.15,-.44,'black'],[-.47,1.02,1.36,.65,.91,.44,'silver'],[1.19,.1,1.29,.37,.69,-.38,'linen'],[2.53,-.36,1.34,.88,.86,.33,'linen'],[-2.55,.13,1.35,.75,1.02,-.56,'silver'],[3.0,.75,1.33,.61,.86,.31,'black'],[1.89,-.68,1.36,.42,.88,-.50,'paper']];
  specs.forEach(([lon,lat,rad,w,h,roll,mat],i)=>{
    const center=sphere(lon,lat,rad),g=sheet(w,h,{seed:230+i*7,fold:.16,curl:.14,thickness:mat==='paper'?.009:.014,taper:.16,crease:mat==='silver',ragged:mat==='silver'?.008:.017});pose(g,center,center,roll);mesh('frayed fold '+i,g,m[mat],folds);
    const q=new T.Quaternion().setFromUnitVectors(V(0,0,1),center.clone().normalize()).multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),roll));
    const lines=[];
    for(let j=0;j<24;j++){const y=(j/23-.5)*h;const p=V(-w*.49,y,.06).applyQuaternion(q).add(center),end=V(-w*(.54+rng()*.09),y-.018-rng()*.08,.085).applyQuaternion(q).add(center);lines.push(tube([p,p.clone().lerp(end,.5).add(V(.006,.02,.013)),end],.0027,6,3));}
    batch('exposed woven hem '+i,lines,m.thread,folds);
  });
  // Small hinged folios bridge the broad rear facets without repeating the front.
  [[1.62,.54,.33,.64,.36],[2.62,.14,.52,.63,-.43],[-2.64,-.32,.35,.69,.38],[-1.88,.60,.42,.56,-.45],[2.24,-.69,.36,.52,.55],[1.71,-.27,.39,.72,-.28],[-2.93,.71,.27,.58,.48]].forEach(([lon,lat,w,h,roll],i)=>{
    const p=sphere(lon,lat,1.43),normal=p.clone().normalize();
    const lining=pose(sheet(w+.075,h+.055,{seed:1190+i,fold:.05,curl:.06,crinkle:.007,ragged:.014}),p.clone().addScaledVector(normal,-.025),normal,roll);mesh('exposed rear paper lining '+i,lining,m.paper,folds);
    const top=pose(sheet(w,h,{seed:1210+i,fold:.10,curl:.07,crinkle:.006,ragged:.012,crease:i%2===1}),p,normal,roll);mesh('rear hinge fragment '+i,top,i%3===0?m.linen:i%2?m.silver:m.black,folds);
    const q=new T.Quaternion().setFromUnitVectors(V(0,0,1),normal).multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),roll));const stitches=[];
    for(let j=0;j<7;j++){const y=(j/6-.5)*h*.7,s=V(-w*.45,y,.04).applyQuaternion(q).add(p),e=V(-w*.57,y+.025,.055).applyQuaternion(q).add(p);stitches.push(tube([s,s.clone().lerp(e,.5).addScaledVector(normal,.026),e],.0055,8,4));}batch('metal stitches through rear lining '+i,stitches,m.thread,folds);
  });
  [[2.95,.0,.45,.69,-.55],[-2.63,-.43,.41,.51,.65],[1.62,.09,.31,.74,-.3]].forEach(([lon,lat,w,h,roll],i)=>{
    const normal=sphere(lon,lat,1).normalize(),base=sphere(lon,lat,1.46),q=new T.Quaternion().setFromUnitVectors(V(0,0,1),normal).multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),roll));
    mesh('rear opened backing '+i,pose(sheet(w+.045,h+.08,{seed:1380+i,fold:.04,curl:.05,ragged:.01}),base,normal,roll),m.paper,folds);
    mesh('rear lifted foil '+i,pose(sheet(w*.79,h*.81,{seed:1390+i,fold:.19,curl:.10,crease:true,ragged:.007}),base.clone().addScaledVector(normal,.060),normal,roll+.09),i===1?m.black:m.silver,folds);
    const ties=[];for(let j=0;j<5;j++){const yy=(j/4-.5)*h*.6,s=V(-w*.52,yy,0).applyQuaternion(q).add(base),e=V(-w*.20,yy+.04,.11).applyQuaternion(q).add(base);ties.push(tube([s,s.clone().lerp(e,.5).addScaledVector(normal,.035),e],.004,8,4));}batch('rear folio fastening '+i,ties,m.thread,folds);
  });
  const type=group('05 / 残页与中心铭痕',[-.045,.07,.13]);
  mesh('upper torn typographic fold',pose(sheet(.75,1.25,{seed:319,fold:.13,curl:.17,thickness:.015,taper:.31}),V(-.76,1.03,.41),V(-.35,.25,1),-.40),m.printed,type);
  mesh('reverse torn typographic fold',pose(sheet(.57,.77,{seed:399,fold:.1,curl:.1,taper:.28}),V(.38,.64,-1.11),V(.1,.35,-1),.36),m.printed,type);
  const centerGeo=new T.CylinderGeometry(.64,.645,.052,64,1);centerGeo.rotateX(Math.PI/2);centerGeo.scale(1.06,.72,1);centerGeo.rotateZ(-.3);centerGeo.translate(-.06,.08,1.40);
  mesh('broken-memory / charcoal lens',centerGeo,m.ink,type);
  const plaque=sheet(1.12,.68,{seed:439,fold:.008,curl:.005,thickness:.016,nu:28,nv:18,taper:.09,crinkle:.001,ragged:.012});pose(plaque,V(-.03,.11,1.525),V(.03,.13,1),-.29);mesh('fine engraved title fragment',plaque,m.slate,type);
  // A few offset laminae make the center an object, not a cover image.
  mesh('silver exposed lower edge',pose(sheet(1.03,.51,{seed:479,fold:.05,curl:.035}),V(.01,-.20,1.397),V(.03,.1,1),-.32),m.silver,type);
  wire('edge of the charcoal lens',[[-.68,.04,1.47],[-.47,-.24,1.48],[.01,-.3,1.46],[.48,-.09,1.44]],m.thread,type,.005);
  const lace=group('06 / 银色牵引网',[.02,.055,.15]);
  function net(name,start,end,width,bow,seed){
    const r=random(seed),s=V(...start),e=V(...end),direction=e.clone().sub(s).normalize();let side=new T.Vector3().crossVectors(direction,V(0,0,1)).normalize();if(side.length()<.1)side=V(1,0,0);
    const f=(t,u)=>s.clone().lerp(e,t).addScaledVector(side,u*width*(.29+.71*Math.sin(Math.PI*t))+.007*Math.sin(t*33+u*14)).add(V(.019*Math.sin(t*13+u*6),.021*Math.sin(t*18+u*8),bow*Math.sin(Math.PI*t)+.019*Math.sin(t*27+u*5)));
    const strands=[];for(let i=0;i<17;i++){const u=(i/16-.5)*2;const points=[];for(let j=0;j<=22;j++)points.push(f(j/22,u));strands.push(tube(points,.0026+r()*.0011,24,3));}
    for(let j=1;j<26;j++){if(j%7===3)continue;const t=j/26,pts=[],trim=j%5===2?.28:0;for(let i=0;i<11;i++)pts.push(f(t+(i%2?.008:0),(i/10-.5)*2*(1-trim)));strands.push(tube(pts,.0024,16,3));}
    batch(name,strands,m.thread,lace);return f;
  }
  net('open silver fan above lens',[-.12,.32,1.47],[.67,1.46,.70],.32,.16,1);
  net('left torn mesh',[-.72,-.58,1.14],[-1.18,.81,.64],.29,.13,2);
  net('lower right woven seam',[.15,-.72,1.36],[1.16,-.3,.73],.31,.20,3);
  net('diagonal veil',[.82,.35,1.14],[-.96,-.31,1.09],.16,.26,4);
  net('reverse silver fan',[.41,-.78,-1.05],[-.61,.80,-1.05],.31,-.51,5);
  net('rear folded net',[1.07,.14,-.73],[.25,.77,-1.15],.27,-.42,6);
  net('profile woven fold',[1.35,-.63,.13],[1.34,.64,-.26],.24,.16,7);
  net('rear floating seam',[-.47,.33,-1.44],[.57,-.21,-1.45],.16,-.18,8);
  const tethers=group('07 / 下坠的红珠链',[.07,-.08,.10]);
  let beadCount=0;
  function chain(name,points,step=.073,radius=.024){
    const raw=new T.CatmullRomCurve3(points.map(p=>V(...p)));
    const path=Array.from({length:91},(_,j)=>{const p=raw.getPoint(j/90),r=Math.hypot(p.x,p.y);if(p.z>0&&r<.84)p.z=Math.max(p.z,1.68+.06*(1-r/.84));return p;});
    const curve=new T.CatmullRomCurve3(path),n=Math.ceil(curve.getLength()/step);const rings=[],beads=[],dark=[];
    mesh(name+' silk filament',new T.TubeGeometry(curve,n*2,.006,4,false),m.redThread,tethers,false);
    for(let i=0;i<=n;i++){
      const t=i/n,p=curve.getPointAt(t),dir=curve.getTangentAt(t),size=radius*(.82+rng()*.42);
      let normal=p.clone().normalize().addScaledVector(dir,-p.clone().normalize().dot(dir));if(normal.lengthSq()<.01)normal=V(0,0,1).addScaledVector(dir,-dir.z);normal.normalize();
      const right=new T.Vector3().crossVectors(dir,normal).normalize();normal.crossVectors(right,dir).normalize();const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,dir,normal));
      if(i%5===2||i%9===0){const g=new T.SphereGeometry(size*.90,9,7);g.scale(1,.87,1);g.applyQuaternion(q);g.translate(...p.toArray());(i%9===0?dark:beads).push(g);}
      else{const g=new T.TorusGeometry(size,size*.24,7,18);g.scale(1,1.13,1);g.rotateY(i%2?.38:-.30);g.applyQuaternion(q);g.translate(...p.toArray());rings.push(g);}
      beadCount++;
    }
    batch(name+' glass links',rings,m.ruby,tethers);batch(name+' irregular seed beads',beads,m.ruby,tethers);batch(name+' garnet intervals',dark,m.garnet,tethers);
  }
  chain('ascending thread',[[-1.81,1.42,.09],[-1.29,.89,.7],[-.73,.48,1.54],[-.15,.2,1.74],[.69,.45,1.47],[1.55,1.01,.34],[1.88,1.24,-.12]],.069,.025);
  chain('caught around the left shoulder',[[-.39,2.02,-.21],[-.21,1.61,.32],[-.05,1.01,1.15],[-.23,.46,1.68],[-.86,-.16,1.54],[-1.7,-.38,.75],[-1.98,-.12,.2]],.071,.029);
  chain('falling to the lower right',[[1.70,.31,-.13],[1.29,.0,.80],[.91,-.44,1.24],[.6,-.89,1.22],[.94,-1.37,.71],[1.57,-1.82,.35],[1.93,-1.94,.18]],.069,.029);
  chain('low torn orbit',[[-1.97,-.83,-.08],[-1.57,-.61,.59],[-.97,-.60,1.26],[-.45,-.67,1.52],[.07,-1.19,1.12],[.41,-1.77,.55]],.075,.024);
  chain('back loose seam',[[-1.53,.8,-.38],[-.75,.91,-1.11],[.11,.47,-1.44],[.79,-.20,-1.22],[1.61,-.53,-.52],[1.80,-.86,-.15]],.082,.026);
  chain('rear broken fall',[[.68,1.55,-.48],[.75,.97,-.95],[.4,.0,-1.38],[-.29,-.74,-1.26],[-.86,-1.45,-.59]],.078,.023);
  const flowers=group('08 / 留在缝隙的干花',[-.055,-.02,.12]);
  let petalCount=0;
  function flower(name,position,normal,radius,kind,seed){
    const r=random(seed),petals=[[],[],[]],seeds=[],q=new T.Quaternion().setFromUnitVectors(V(0,0,1),V(...normal).normalize()),center=V(...position);
    for(let ring=0;ring<5;ring++){
      const count=[23,21,18,15,11][ring];
      for(let i=0;i<count;i++){
        const angle=(i/count)*TAU+ring*.31+(r()-.5)*.16,rad=radius*(.11+ring*.013),length=radius*(.97-ring*.13)*(r()*.16+.91),width=radius*(.21-ring*.016);
        const g=petal(length,width,radius*(.22+ring*.047),seed+i*17+ring*200);g.rotateX((r()-.5)*.25);g.rotateZ(-angle);g.translate(Math.sin(angle)*rad,Math.cos(angle)*rad,ring*radius*.063);g.applyQuaternion(q);g.translate(...center.toArray());petals[(i+ring)%3].push(g);petalCount++;
      }
    }
    const mat=kind==='cream'?[m.petalIvory,m.petalPale,m.petalIvory]:kind==='rust'?[m.petalRust,m.petalIvory,m.petalRust]:[m.petalOchre,m.petalOchre,m.petalIvory];
    petals.forEach((gs,i)=>batch(name+' curled petals '+i,gs,mat[i],flowers));
    for(let i=0;i<60;i++){const t=i*2.399963,rad=Math.sqrt(i/60)*radius*.21;const p=V(Math.cos(t)*rad,Math.sin(t)*rad,radius*.28+Math.sqrt(1-i/70)*radius*.12).applyQuaternion(q).add(center);const g=new T.IcosahedronGeometry(radius*.034*(.7+r()*.5),0);g.translate(...p.toArray());seeds.push(g);}
    batch(name+' dry seed heart',seeds,m.seed,flowers);
    const back=center.clone().addScaledVector(V(...normal).normalize(),-.24);wire(name+' stem',[back,center.clone().add(V(.04,-.09,-.09)),center],m.driedStem,flowers,.012);
  }
  flower('ochre above left',[-.74,.80,1.11],[-.35,.31,1],.205,'ochre',32);
  flower('fading flower at the fault',[-.84,-.28,1.26],[-.35,.09,1],.245,'ochre',48);
  flower('large ivory flower',[.03,-.94,1.17],[.12,-.45,1],.268,'cream',52);
  flower('rust flower beside ivory',[-.38,-.99,1.08],[-.25,-.25,1],.20,'rust',94);
  flower('small pale remnant',[.29,-1.12,.91],[.38,-.5,1],.155,'cream',123);
  flower('saffron in silver fold',[-.56,-.65,1.26],[-.2,-.18,1],.15,'ochre',180);
  flower('rear pale flower',[.41,.57,-1.18],[.2,.4,-1],.233,'cream',216);
  flower('rear rust flower',[-.46,-.6,-1.19],[-.3,-.4,-1],.192,'rust',292);
  flower('side straw flower',[1.22,.22,-.39],[1,.3,-.2],.17,'ochre',392);
  // Thin wing-like remains, dried umbels and seed heads connect the floral
  // nodes back to the sphere rather than hovering as unrelated decorations.
  const botanical=[];
  [[[-.78,-.17,1.22],[-1.14,.51,1.05]], [[-.57,.74,1.08],[-.18,1.14,1.05]], [[.17,-.83,1.15],[.71,-.47,1.35]], [[-.43,-.61,-1.11],[-1.11,-.31,-.98]]].forEach(([start,end],k)=>{
    const s=V(...start),e=V(...end);botanical.push(tube([s,s.clone().lerp(e,.5).add(V(.1,0,.04)),e],.006,18,4));
    for(let i=0;i<19;i++){const t=.25+i/26,p=s.clone().lerp(e,t);const ang=(i%2?-1:1),tip=p.clone().add(V(ang*(.05+rng()*.20),.13+rng()*.14,.035));botanical.push(tube([p,p.clone().lerp(tip,.5).add(V(.01,.04,.02)),tip],.0033,10,3));}
  });batch('dried umbel filaments',botanical,m.driedStem,flowers);
  // Pressed seed wings: translucent membranes and independently modeled ribs.
  [[[-.62,.47,1.33],-.63,.49,.78],[[-.52,.50,1.31],.72,.43,.72]].forEach(([origin,roll,length,width],k)=>{
    const positions=[],uvs=[],indices=[],q=new T.Quaternion().setFromAxisAngle(V(0,0,1),roll),o=V(...origin),nu=20,nv=17;
    function wing(u,v){const angle=(u-.5)*1.92,rad=length*v*(.83+.12*Math.sin(u*5+k)+.05*Math.sin(u*19+k)-.06*Math.exp(-Math.pow((u-.72)*18,2)));return V(Math.sin(angle)*rad*width,Math.cos(angle)*rad,.085*Math.sin(v*Math.PI)+.014*Math.sin(u*17)*v).applyQuaternion(q).add(o);}
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){positions.push(...wing(i/nu,j/nv).toArray());uvs.push(i/nu,j/nv);}
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i;indices.push(a,a+1,a+nu+2,a,a+nu+2,a+nu+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();mesh('pressed seed membrane '+k,g,m.seedWing,flowers,false);
    const ribs=[];for(let i=0;i<=12;i++){const pts=[];for(let j=0;j<=12;j++)pts.push(wing(i/12,j/12));ribs.push(tube(pts,.0027,13,3));}batch('dry seed wing ribs '+k,ribs,m.driedStem,flowers);
  });
  const mineral=group('09 / 碎石与暗色花瓣',[.07,-.015,.07]);const stones=[],roses=[];
  for(let i=0;i<41;i++){
    const t=i/40,lon=.87+(rng()-.5)*.38,lat=.34-t*1.35,position=sphere(lon,lat,1.35+rng()*.04),g=new T.IcosahedronGeometry(.06+rng()*.055,1);g.scale(.66+rng()*.75,.47+rng()*.72,.40+rng()*.3);g.rotateZ(rng()*6);g.translate(...position.toArray());(i%4===0?roses:stones).push(g);
  }
  for(let i=0;i<16;i++){const p=sphere(-2.40+rng()*.40,-.25+rng()*.85,1.36),g=new T.IcosahedronGeometry(.055+rng()*.045,1);g.scale(1,.6,.55);g.translate(...p.toArray());stones.push(g);}
  batch('granular mineral seam',stones,m.stone,mineral,true);batch('rose quartz fragments',roses,m.roseStone,mineral,true);
  [[-.12,-.64,1.42,-.48,m.amethyst],[.53,-.55,1.24,.35,m.cobalt]].forEach(([x,y,z,rot,mat],i)=>{
    const pts=[new T.Vector2(.012,-.10),new T.Vector2(.064,-.092),new T.Vector2(.075,-.035),new T.Vector2(.066,.022),new T.Vector2(.050,.067),new T.Vector2(.048,.105),new T.Vector2(.033,.105),new T.Vector2(.036,.063),new T.Vector2(.052,.020),new T.Vector2(.060,-.034),new T.Vector2(.050,-.077),new T.Vector2(.012,-.083)];
    const g=new T.LatheGeometry(pts,26,0,TAU*.91),a=g.attributes.position;
    for(let j=0;j<a.count;j++){const yy=a.getY(j),xx=a.getX(j),zz=a.getZ(j),theta=Math.atan2(zz,xx);if(yy>.075)a.setY(j,yy-.012*(.5+.5*Math.sin(theta*7+i))-.011*Math.max(0,Math.sin(theta*3)));a.setX(j,xx*(1+.07*Math.sin(theta*3+i)));}g.computeVertexNormals();g.rotateZ(rot);g.rotateX(.22);g.translate(x,y,z);mesh('broken open glass vessel '+i,g,mat,mineral);
    const rim=new T.TorusGeometry(.054,.004,5,22,TAU*.83);rim.rotateX(Math.PI/2);rim.translate(0,.067,0);rim.rotateZ(rot);rim.rotateX(.22);rim.translate(x,y,z);mesh('wire around broken glass neck '+i,rim,m.silver,mineral,false);
  });
  const loose=group('10 / 未松开的细线',[-.035,.02,.1]);const redFibers=[],darkFibers=[],silverFibers=[];
  for(let i=0;i<57;i++){
    const t=rng(),s=V(-1.5+3*t,-.46+1.05*t,.8+Math.sin(t*Math.PI)*.65),e=s.clone().add(V((rng()-.5)*.82,(rng()-.5)*.71,(rng()-.5)*.28));redFibers.push(tube([s,s.clone().lerp(e,.45).add(V(.04,.03,.03)),e],.0018,12,3));
  }
  for(let i=0;i<25;i++){
    const lon=rng()*TAU,lat=(rng()-.5)*2,s=sphere(lon,lat,1.39),e=s.clone().multiplyScalar(1.13+rng()*.2);e.y-=rng()*.20;const g=tube([s,s.clone().lerp(e,.5).add(V((rng()-.5)*.13,.07,0)),e],.0029,14,3);(i%3===0?silverFibers:darkFibers).push(g);
  }
  batch('crimson fibres through the fault',redFibers,m.redThread,loose);batch('slender black loose threads',darkFibers,m.darkThread,loose);batch('loose silver filaments',silverFibers,m.thread,loose);
  const membrane=group('11 / 透明的红色折光',[.02,.025,.14]);
  [[-.85,.37,1.31,.32,.76,-.7],[.62,-.64,1.32,.38,.74,.47],[-2.55,.4,1.3,.46,.72,.15]].forEach(([lon,lat,rad,w,h,roll],i)=>{const p=sphere(lon,lat,rad);mesh('translucent torn film '+i,pose(sheet(w,h,{seed:716+i,fold:.09,curl:.11,thickness:.007}),p,p,roll),m.crimsonGlass,membrane,false);});
  mesh('smoky glass sliver',pose(sheet(.25,.71,{seed:852,fold:.027,curl:.052,thickness:.019}),V(.61,.22,1.14),V(.4,0,1),-.38),m.glass,membrane,false);
  const falling=group('12 / 被牵住的坠落',[.075,-.115,.02]);
  const scraps=[[-.52,-1.37,.64,.31,.57,-.43,'silver'],[.82,-1.45,.30,.23,.61,.39,'linen'],[-1.50,.14,.20,.20,.45,-.75,'black'],[.73,1.36,-.26,.24,.61,.24,'silver']];
  scraps.forEach(([x,y,z,w,h,rot,mat],i)=>{const p=V(x,y,z);mesh('suspended last fold '+i,pose(sheet(w,h,{seed:971+i,fold:.11,curl:.11,crease:mat==='silver'}),p,V(x*.3,y*.25,z>=0?1:-1),rot),m[mat],falling);wire('joining filament '+i,[p.clone().multiplyScalar(.75),p.clone().multiplyScalar(.9).add(V(.035,.02,.1)),p],m.thread,falling,.004);});
  root.userData={title:'在坠落时',slug:'falling',sceneVersion:'0.26.0',artRevision:4,solidCore:true,bodyRadius:1.205,bodyAxes:[1,1,1],beadCount,petalCount,structureGroups:groups.length,referenceUse:'Original geometry and procedural surfaces interpreting the user-supplied black/silver/crimson assemblage; no copied reference pixels, artist names or logos.',detailTargets:{threads:[-.21,.52,1.28],flowers:[-.16,-.87,1.08],fault:[.72,-.16,1.14]}};
  let triangles=0,meshes=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});Object.assign(root.userData,{meshCount:meshes,triangleCount:triangles});
  return {root,groups,ready:Promise.resolve(),setSeparated(amount){groups.forEach(g=>g.position.fromArray(g.userData.offset).multiplyScalar(amount));},setMoment(t){falling.rotation.z=Math.sin(t*.33)*.015;falling.position.y-=Math.sin(t*.43)*.014;},dispose(){owned.forEach(g=>g.dispose());disposeMaterials();}};
}
