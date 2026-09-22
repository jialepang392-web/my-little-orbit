import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials} from './materials.js?v=0200';
const V=p=>new T.Vector3(...p), TAU=2*Math.PI;
function surface(f,nu=32,nv=22,flip=false){
  const p=[],uv=[],ix=[];
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...f(i/nu,j/nv));uv.push(i/nu,j/nv);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;ix.push(...(flip?[a,b,a+1,b,b+1,a+1]:[a,a+1,b,b,a+1,b+1]));}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
// Variable-radius, capped curves: small twig ends never end in open pipe mouths.
function tube(points,r=.007,n=24,end=.65,sides=6){
  const c=new T.CatmullRomCurve3(points.map(V)),frames=c.computeFrenetFrames(n,false);
  const g=surface((u,v)=>{const i=Math.min(n,Math.round(u*n)),a=v*TAU,rad=r*(1-u+end*u)*(1+.045*Math.sin(u*31));return c.getPoint(u).addScaledVector(frames.normals[i],rad*Math.cos(a)).addScaledVector(frames.binormals[i],rad*Math.sin(a)).toArray();},n,sides,true);
  const pos=g.attributes.position,uv=g.attributes.uv,ps=Array.from(pos.array),us=Array.from(uv.array),ix=Array.from(g.index.array);
  for(const k of [0,n]){const id=ps.length/3;ps.push(...c.getPoint(k/n).toArray());us.push(.5,.5);for(let j=0;j<sides;j++){const a=j*(n+1)+k,b=(j+1)*(n+1)+k;ix.push(...(k===0?[id,b,a]:[id,a,b]));}}
  g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('uv',new T.Float32BufferAttribute(us,2));g.setIndex(ix);
  // The two cap centers extend the vertex buffer. Reallocate normals as well;
  // reusing surface()'s shorter buffer makes capped tubes invalid in WebKit.
  g.deleteAttribute('normal');g.computeVertexNormals();return g;
}
export function makeJielan(){
  const root=new T.Group(),groups=[],m=makeMaterials();root.name='芥兰 / forked herbarium assemblage';
  const layer=(name,separation)=>{const g=new T.Group();g.name=name;g.userData.separation=separation;root.add(g);groups.push(g);return g;};
  const mesh=(g,geo,mat,name='')=>{const o=new T.Mesh(geo,mat);o.name=name;const clear=mat.transmission>0||mat.transparent;o.castShadow=!clear;o.receiveShadow=!clear;if(mat.transparent)o.renderOrder=2;g.add(o);return o;};
  const batch=(g,geos,mat,name)=>{if(!geos.length)return;const merged=mergeGeometries(geos);geos.forEach(x=>x.dispose());return mesh(g,merged,mat,name);};
  // Front winding is du x dv. Reverse is offset along the NEGATIVE normal,
  // wound oppositely, and all four boundaries have joined thickness faces.
  function skin(g,f,mat,back,thick=.012,nu=36,nv=22,edge=back){
    const reverse=(u,v)=>{const p=V(f(u,v)),du=V(f(Math.min(1,u+.0005),v)).sub(V(f(Math.max(0,u-.0005),v))),dv=V(f(u,Math.min(1,v+.0005))).sub(V(f(u,Math.max(0,v-.0005))));return p.addScaledVector(du.cross(dv).normalize(),-thick).toArray();};
    mesh(g,surface(f,nu,nv),mat);mesh(g,surface(reverse,nu,nv,true),back);
    const edges=[];for(const e of [0,1]){edges.push(surface((u,v)=>V(f(u,e)).lerp(V(reverse(u,e)),v).toArray(),nu,1,e===0));edges.push(surface((u,v)=>V(f(e,u)).lerp(V(reverse(e,u)),v).toArray(),nv,1,e===1));}batch(g,edges,edge);
  }
  const ellipsoid=(p,s,rotation=0,detail=14)=>{const g=new T.SphereGeometry(1,detail,10);g.scale(...s);g.rotateZ(rotation);g.translate(...p);return g;};
  const local=(parent,p,r)=>{const g=new T.Group();g.position.set(...p);g.rotation.set(...r);parent.add(g);return g;};
  const wood=layer('01 / forked pale driftwood and crossing structural roots',[-.10,.05,-.06]);
  const limbs=[
    [[.42,-1.10,-.30],[-.16,-.44,-.51],[-.63,.43,-.40],[-.83,1.22,-.43],[-.60,1.93,-.30]],
    [[-.61,.39,-.39],[-1.01,.82,-.38],[-1.25,1.37,-.26],[-1.14,1.85,-.13]],
    [[-.24,-.38,-.48],[.20,.10,-.75],[.35,.62,-.84],[.10,1.17,-.71]],
    [[-.65,.40,-.39],[-.91,.62,.03],[-1.10,1.15,.12]],
    [[.33,-.94,-.35],[.75,-.49,-.48],[.91,.02,-.55],[.81,.63,-.44]]
  ];
  batch(wood,limbs.map((p,i)=>tube(p,i===0?.115:i===1?.085:.060,40,.20,7)),m.bark||m.cream,'five tapering driftwood forks');
  const grain=[];limbs.forEach((ps,i)=>{const c=new T.CatmullRomCurve3(ps.map(V));for(let j=0;j<7;j++){const pts=[];for(let k=0;k<=28;k++){const u=k/28,p=c.getPoint(u),a=j*TAU/7+.18*Math.sin(u*8),r=(i===0?.117:i===1?.087:.062)*(1-.8*u);pts.push(p.add(V([Math.cos(a)*r,0,Math.sin(a)*r])).toArray());}grain.push(tube(pts,.0025,30,.45));}});batch(wood,grain,m.branch,'longitudinal wood fissures');
  const wicker=layer('02 / tangled wicker volume, left fibrous veil and rear woven seam',[-.06,0,0]);
  const roots=[],fine=[];
  // Seventeen open root paths grow from shared fork/cloth anchors. They do
  // not orbit a center; the front lower-label and rear ceramic gaps stay open.
  const rootPaths=[
    [[-.63,.43,-.40],[-.97,.27,-.13],[-1.14,-.02,.23],[-.95,-.45,.17]],
    [[-.97,.27,-.13],[-1.17,.16,.13],[-1.30,-.12,.31]],
    [[-.63,.43,-.40],[-.76,.21,.14],[-.72,-.03,.43],[-.89,-.47,.29]],
    [[-.72,-.03,.43],[-.96,-.19,.48],[-1.03,-.41,.36]],
    [[-.83,.84,-.42],[-1.02,.53,-.53],[-1.08,.12,-.48],[-.89,-.27,-.37]],
    [[-.16,-.44,-.51],[-.56,-.65,-.36],[-.83,-.63,-.08],[-1.03,-.39,.08]],
    [[-.56,-.65,-.36],[-.64,-.82,-.20],[-.47,-1.01,-.18]],
    [[.42,-1.10,-.30],[.16,-.82,-.31],[-.18,-.77,-.18],[-.63,-.68,.05]],
    [[.20,.10,-.75],[-.02,.36,-.82],[-.36,.43,-.70],[-.63,.43,-.40]],
    [[.20,.10,-.75],[.36,-.19,-.77],[.39,-.48,-.57],[.16,-.82,-.31]],
    [[.36,-.19,-.77],[.66,-.29,-.64],[.75,-.49,-.48]],
    [[-.63,.43,-.40],[-.49,.20,-.74],[-.47,-.05,-.78],[-.16,-.44,-.51]],
    [[-.47,-.05,-.78],[-.66,-.22,-.62],[-.89,-.27,-.37]],
    [[.35,.62,-.84],[.56,.45,-.62],[.66,.23,-.43],[.91,.02,-.55]],
    [[.66,.23,-.43],[.69,.02,-.19],[.88,-.24,-.20]],
    [[-.76,.21,.14],[-.49,.42,.21],[-.30,.49,.40],[-.15,.42,.54]],
    [[.75,-.49,-.48],[.68,-.64,-.18],[.48,-.80,.10],[.31,-.89,.21]]
  ];
  rootPaths.forEach((ps,j)=>roots.push(tube(ps,[.024,.009,.018,.008,.015,.025,.011,.021,.014,.020,.009,.018,.007,.017,.008,.012,.016][j],28,.23+(j%3)*.10)));
  // Curved cross-ties connect opposite depth layers. The middle is a
  // distributed cradle with pockets of air, not a flat bundle of stems.
  const cradle=[
    [[-.64,.43,-.40],[-.38,.02,-.91],[.05,-.29,-1.01],[.50,-.46,-.75],[.74,-.51,-.47]],
    [[-.76,.21,.14],[-.93,-.15,.47],[-.59,-.59,.54],[-.11,-.70,.50],[.42,-1.10,-.30]],
    [[.20,.10,-.75],[.47,.01,-.29],[.44,-.34,.43],[.11,-.54,.56],[-.16,-.44,-.51]],
    [[-.91,.62,.03],[-1.06,.17,-.43],[-.76,-.21,-.84],[-.49,-.67,-.57]],
    [[-.24,-.38,-.48],[-.29,-.78,-.12],[.03,-.80,.39],[.58,-.60,.53],[.74,-.51,-.47]],
    [[.35,.62,-.84],[.66,.43,-.58],[.92,-.04,-.26],[.74,-.51,-.47]]
  ];
  cradle.forEach((p,i)=>roots.push(tube(p,.012+(i%3)*.003,34,.36)));
  // Small organic collars sit only at the load-bearing joints.
  const collars=[[-.63,.43,-.40,.115,.16,.11],[-.16,-.44,-.51,.13,.17,.13],[.74,-.51,-.47,.10,.14,.13]];
  batch(wood,collars.map(([x,y,z,a,b,c],i)=>ellipsoid([x,y,z],[a,b,c],i*.7,12)),m.bark,'three root joint collars');
  // Rear seam is narrow and diagonal, not a duplicate of the front veil.
  for(let j=0;j<19;j++){const ps=[];for(let k=0;k<=18;k++){const u=k/18;ps.push([-.43+u*.54+.021*Math.sin(u*19+j),-.40+u*.88+(j-9)*.009,-.66-.09*Math.sin(u*3)+.016*Math.cos(u*17+j)]);}fine.push(tube(ps,.0022+(j%5)*.00025,24));}
  for(let j=0;j<47;j++){const ps=[];for(let k=0;k<=24;k++){const u=k/24;ps.push([-1.42+u*1.34,-.22+(j/46)*.66-.23*Math.sin(u*Math.PI)+.032*Math.sin(u*21+j),.32+.36*Math.sin(u*Math.PI)+.07*Math.sin(j*.6+u*9)]);}fine.push(tube(ps,j%8===0?.003:.0018,28));}
  for(let j=0;j<20;j++){const ps=[];for(let k=0;k<=16;k++){const u=k/16;ps.push([-1.40+j*.066+.025*Math.sin(u*19+j),-.25+u*.69,.34+.35*Math.sin(j/19*Math.PI)+.03*Math.sin(u*18+j)]);}fine.push(tube(ps,.0018,20));}
  batch(wicker,roots,m.branch,'23 branching anchor-to-anchor roots and cross-ties');batch(wicker,fine,m.thread,'preserved left veil and gathered rear seam');
  const plants=layer('03 / raised left kale crown and sparse sideways reverse leaves',[-.08,.13,.02]);
  const veins=[],stems=[],dew=[];let leafCount=0;
  function leaf(p,r,w,h,seed,secondary=false){
    const g=local(plants,p,r),f=(u,v)=>{
      const s=u*2-1,t=v,envelope=Math.pow(Math.sin(Math.PI*t),.55+.035*(seed%4))*(.73+.34*t);
      const scallop=1+(.055+.009*(seed%3))*Math.sin(t*TAU*(4+seed%3)+seed)+.018*Math.sin(t*43+seed*.7);
      const lean=.06*w*Math.sin(Math.PI*t)*Math.sin(t*3+seed),curl=(.07+.022*(seed%4))*s*s;
      const ridge=.021*Math.cos(s*7.0+t*4.2+seed)*Math.sin(Math.PI*t),edge=.033*Math.sin(t*(21+seed%5)+seed)*s**6;
      return [lean+s*w*.5*envelope*scallop*(1+.035*s), (t-.27)*h+.025*s*Math.sin(Math.PI*t)*Math.sin(seed+t*3),
        .14*Math.sin(t*(3.8+.12*(seed%4)))+(curl+ridge+edge+.035*s*Math.sin(t*4+seed))*envelope+(.04+.014*(seed%4))*t**7];
    };
    mesh(g,surface(f,secondary?20:32,secondary?26:44),seed%4===1?(m.leafDark||m.leaf):seed%5===0?(m.leafPale||m.young):m.leaf,'kale lamina '+leafCount);g.updateMatrixWorld(true);
    const pt=(u,v)=>V(f(u,v)).add(V([0,0,.004])).applyMatrix4(g.matrixWorld).toArray();
    const mid=[];for(let k=0;k<=22;k++)mid.push(pt(.5,k/22));veins.push(tube(mid,secondary?.0027:.0043,26,.16));
    const count=secondary?5:6+seed%2;
    for(let j=1;j<=count;j++)for(const s of [-1,1]){const t=.10+j*.73/(count+1)+.022*Math.sin(seed*1.7+j*2.2+s),reach=.39+.075*(.5+.5*Math.sin(seed+j*1.9+s)),rise=.075+.065*(.5+.5*Math.cos(seed*.8+j+s)),ps=[];for(let k=0;k<=10;k++){const q=k/10;ps.push(pt(.5+s*reach*q,t+rise*q+.012*Math.sin(q*Math.PI)));}veins.push(tube(ps,.0017+.00035*(j%2),14,.22));
      if(!secondary&&j===2+seed%3){const q=.56,u=.5+s*reach*q,v=t+rise*q+.012*Math.sin(q*Math.PI);veins.push(tube([pt(u,v),pt(u+s*.065,v+.047),pt(u+s*.11,v+.082)],.0010,9,.20));}}
    // Petioles end at the lamina base. Continuing the thick stem a quarter
    // of the way up a curved leaf made it visibly cut through the leaf face.
    const base=V(pt(.5,0)),foot=base.clone().addScaledVector(base.clone().sub(V(pt(.5,.12))).normalize(),.085);
    stems.push(tube([[p[0]*.55,p[1]-.29,p[2]*.50],foot.toArray(),base.toArray()],.011,20,.56));
    if(!secondary&&seed%3===0)for(let k=0;k<3;k++)dew.push(ellipsoid(pt(.3+k*.16,.42+k*.1),[.018,.026,.015],seed));leafCount++;
  }
  // Authored fan: upper-left and crown carry 20 leaves; no radial ring.
  const primary=[[-1.20,.87,.39,-.18,-.30,.46,.70,1.20],[-.81,1.11,.23,.10,.32,.05,.64,1.08],[-.38,1.15,-.02,-.20,-.25,-.36,.67,1.05],[-1.31,.45,.43,.16,-.43,.91,.78,1.03],[-.84,.74,.56,-.28,.22,-.22,.80,1.17],[-.30,.81,.10,.35,.50,-.62,.60,.95],[-1.15,1.03,-.25,.14,-.72,.45,.60,1.08],[-.57,1.20,-.40,.40,.72,-.14,.65,.97],[-1.37,.24,.03,-.35,-.85,1.03,.52,.87],[-.88,.40,-.23,.62,-.40,.39,.57,.88],[-.08,.97,-.45,.27,.90,-.56,.48,.86],[-.65,.68,.15,.40,.04,.51,.59,.92]];
  primary.forEach((a,i)=>leaf(a.slice(0,3),a.slice(3,6),a[6],a[7],i));
  for(let i=0;i<8;i++)leaf([-1.10+(i%4)*.25,.56+Math.floor(i/4)*.48,-.45-(i%3)*.15],[.40+i*.07,-.6+i*.19,.70-i*.19],.38+(i%2)*.09,.63+(i%3)*.08,20+i,true);
  [[[-1.18,-.43,-.13],[.2,-.8,1.4]],[[.12,.57,-.76],[.3,2.6,-.9]],[[.58,-.37,-.66],[.8,2.4,-1.7]],[[1.20,-.62,-.34],[.4,.9,-1.8]],[[.14,-1.00,-.23],[.3,-.7,2.2]]].forEach(([p,r],i)=>leaf(p,r,.39,.64,40+i,true));
  // The reverse is a lower, diagonally growing plant population. Its stems
  // inhabit the depth behind the woven cradle, not a mirrored front fan.
  [
    [[-.52,.32,-.87],[.25,2.70,.55],.64,.94],
    [[-.07,.10,-.99],[-.20,3.40,-.51],.53,.78],
    [[-.57,-.41,-.72],[.35,2.55,1.72],.56,.84],
    [[.43,-.19,-.81],[.60,2.15,-1.20],.48,.72],
    [[-.76,-.48,.47],[-.48,-.50,1.71],.46,.71],
    [[-.43,-.76,.05],[.73,-.48,2.65],.42,.61],
    [[.68,.43,-.49],[.68,1.75,-.79],.43,.70]
  ].forEach(([p,r,w,h],i)=>leaf(p,r,w,h,60+i,i>3));
  batch(plants,veins,m.vein,'unequal branching midribs and veins');batch(plants,stems,m.leafDark,'green petioles anchored through the root cradle');batch(plants,dew,m.dew||m.glassEdge,'attached dew droplets');
  const ceramic=layer('04 / four offset partial porcelain crescents',[.04,-.02,-.08]);
  const shards=[[-1.05,-.04,.02,.22,-.60,.45,.75,.38], [1.03,-.73,.19,-.24,.36,-.47,.63,.42], [.15,.26,-.99,.12,2.88,.57,.66,.38],[-.60,-.81,-.54,.35,2.35,-.48,.48,.26]];
  shards.forEach(([x,y,z,rx,ry,rz,len,width],i)=>{
    const g=local(ceramic,[x,y,z],[rx,ry,rz]),f=(u,v)=>{
      const a=-.97+u*1.72,r=len+(v-.5)*width*(.54+.46*Math.sin(u*Math.PI))*(1+.11*Math.sin(u*17+i));
      const chipped=.006*Math.sin(u*39+i)+.004*Math.sin(u*77+i*.6),edgeLift=.035*(1-u)**6-.025*u**5;
      return [Math.sin(a)*r,Math.cos(a)*r-len+.055*Math.sin(v*Math.PI)+chipped*(v>.5?1:.3),.13*Math.sin(u*Math.PI)+.19*(v-.5)**2+edgeLift];
    };
    skin(g,f,i===3?m.cobalt:m.blue,m.ceramicBack,.039,44,20,m.porcelain);
    // A surviving glazed edge stops BEFORE both fractures: not an intact rim.
    const rim=[];for(let k=0;k<=38;k++)rim.push(V(f(.08+k/38*.82,.96)).add(V([0,0,.003])).toArray());
    mesh(g,tube(rim,.006,40,.75),m.cobalt,'surviving cobalt glaze at a broken porcelain edge');
  });
  const cloth=layer('05 / billowing right linen shoulder and free frayed tails',[.10,-.08,.02]);
  const hems=[],fray=[],roseHems=[];
  function ribbon(parent,ps,width,material,reverse,seed,tail=false){
    const rose=material===m.roseLinen,path=new T.CatmullRomCurve3(ps.map(V)),steps=72,frames=[],tangents=[];
    // Parallel-transport the cross-section instead of cross(Z,tangent) at
    // every point. The latter flips when a gathered fold turns into depth.
    for(let i=0;i<=steps;i++){
      const t=path.getTangent(i/steps).normalize();tangents.push(t);
      if(i===0){let n=V([0,0,1]).cross(t);if(n.lengthSq()<.01)n=V([1,0,0]).cross(t);frames.push(n.normalize());}
      else frames.push(frames[i-1].clone().applyQuaternion(new T.Quaternion().setFromUnitVectors(tangents[i-1],t)).normalize());
    }
    const f=(u,v)=>{
      const p=path.getPoint(u),t=path.getTangent(u),k=Math.min(steps-1,Math.floor(u*steps)),a=u*steps-k;
      const cross=frames[k].clone().lerp(frames[k+1],a);cross.addScaledVector(t,-cross.dot(t)).normalize();const normal=t.clone().cross(cross).normalize(),s=v-.5;
      const twist=(tail?.57:.23)*Math.sin(u*4.4+seed*.62)+(tail?.29:0)*u*u;
      const across=cross.clone().multiplyScalar(Math.cos(twist)).addScaledVector(normal,Math.sin(twist)),out=normal.clone().multiplyScalar(Math.cos(twist)).addScaledVector(cross,-Math.sin(twist));
      const gather=Math.exp(-(((u-.70)/.17)**2)),shoulder=Math.sin(Math.PI*u),breadth=(rose?.84:.75)+(rose?.10:.28)*shoulder-(tail?.15:.27)*gather;
      // Unequal moving valleys: one broad drape, two finer gathered pleats.
      // This is actual relief across the cloth, not a corrugated texture.
      const pleat=rose?.019*Math.sin(v*5.5+u*3):(.028+.038*shoulder)*Math.sin(v*TAU*1.65+u*2.1+seed*.45)+(.015+.020*gather)*Math.sin(v*TAU*3.15-u*2.6+seed);
      const edgeCurl=(rose?.012:.038)*Math.cos(u*6.3+seed)*Math.pow(Math.abs(s)*2,5),edgeWander=.012*Math.sin(u*13.2+seed)+.004*Math.sin(u*37+seed);
      return p.addScaledVector(across,s*width*breadth+edgeWander*s).addScaledVector(out,pleat+edgeCurl+.024*s*Math.sin(u*5.6)).toArray();
    };
    skin(parent,f,material,reverse,rose?.004:.006,72,32);
    for(const v of [0,1]){const edge=[];for(let k=0;k<=58;k++)edge.push(f(k/58,v));(rose?roseHems:hems).push(tube(edge,.0019,60));}
    if(tail)for(let j=0;j<27;j++){
      const p=f(.995,j/26),q=V(f(.96,j/26)),d=V(p).sub(q).normalize(),len=.03+.037*(.5+.5*Math.sin(j*2.7+seed));
      const middle=V(p).addScaledVector(d,len*.45).add(V([.007*Math.sin(j*3),0,.008]));
      const tip=V(p).addScaledVector(d,len).add(V([.014*Math.sin(j*1.9),-.012,.014*Math.cos(j)]));
      (rose?roseHems:fray).push(tube([p,middle.toArray(),tip.toArray()],.0011,7,.18));
    }
    return f;
  }
  // A gathered cloth panel, not a constant-width C-shaped band. Its shoulder
  // spreads above a pinched low corner; moving pleats point toward the knot.
  const shoulder=(u,v)=>{
    const t=1-v,s=u-.5,fall=Math.sin(t*Math.PI),gather=Math.exp(-(((t-.89)/.18)**2));
    const width=.76*(.59+.29*fall-.26*gather),cx=.52+.45*Math.sin(t*Math.PI*.95);
    const crease=.022*Math.sin(u*14+t*9)*Math.exp(-(((t-.71)/.26)**2))+.014*Math.sin(u*9-t*17)*Math.exp(-(((u-.16)/.19)**2));
    const pleat=(.038+.045*fall)*Math.sin(u*8.8+t*2.5)+(.010+.023*gather)*Math.sin(u*17-t*2)+crease;
    return [cx+s*width+.018*Math.sin(t*15+u*4)*s,
      .83-1.27*t+.032*Math.sin(u*8+t*4)*(.2+fall)+.04*Math.cos(u*5)*t*t,
      -.08+.50*Math.sin(t*Math.PI*.85)+.12*s+pleat+.023*s*s*Math.sin(t*12)];
  };
  skin(cloth,shoulder,m.linen,m.linenReverse,.007,48,64);
  // A folded-back upper corner exposes a separate underside and a small
  // shadow pocket instead of ending in a hard, uniformly straight sail edge.
  skin(cloth,(u,v)=>{
    const p=V(shoulder(u,.84+.14*v));
    return p.add(V([.035*Math.sin(u*4+v),.025*Math.sin(v*Math.PI),.045+.070*Math.sin(v*Math.PI)+.019*Math.sin(u*10+v*3)])).toArray();
  },m.linenPale,m.linenReverse,.005,38,18);
  for(const side of [0,1]){const edge=[];for(let k=0;k<=60;k++)edge.push(shoulder(side,k/60));hems.push(tube(edge,.0021,62));}
  // Two loops meet at a linen binding, with two unequal hanging ends.
  ribbon(cloth,[[.73,-.51,.60],[.46,-.37,.78],[.32,-.48,.75],[.47,-.64,.68],[.70,-.53,.62]],.22,m.linenPale,m.linenReverse,7);
  ribbon(cloth,[[.72,-.54,.60],[.95,-.42,.67],[1.02,-.54,.56],[.91,-.66,.60],[.73,-.55,.64]],.19,m.linen,m.linenReverse,8);
  ribbon(cloth,[[.73,-.58,.58],[.64,-.90,.71],[.94,-1.29,.63],[.65,-1.61,.60]],.36,m.linen,m.linenReverse,2,true);
  ribbon(cloth,[[.65,-.59,.48],[.40,-.90,.65],[.36,-1.20,.48],[.12,-1.43,.52]],.27,m.linenPale,m.linenReverse,4,true);
  // A separate sling crosses the rear root junction; it gives the side a
  // connected body without closing it into a bowl or a spherical shell.
  skin(cloth,(u,v)=>{
    const pinch=Math.exp(-(((v-.79)/.19)**2));
    return [-.51+.89*u+.04*Math.sin(v*7+u*2),.34-.75*v+.055*Math.cos(u*5+v),
      -.84-.18*Math.sin(Math.PI*u)+(.050+.045*pinch)*Math.sin(u*8.5+v*3)+.032*Math.cos(v*7-u*2)];
  },m.linen,m.linenReverse,.006,48,38);
  ribbon(cloth,[[-.52,-.41,-.83],[-.16,-.46,-.93],[.27,-.34,-.92],[.54,-.14,-.68]],.21,m.linenPale,m.linenReverse,5);
  ribbon(cloth,[[-1.27,.29,.50],[-1.04,.00,.73],[-.67,-.18,.87],[-.54,-.59,.86],[-.58,-1.15,.64]],.18,m.roseLinen,m.roseLinen,1,true);
  const binding=[];
  for(let j=0;j<5;j++){const pts=[];for(let k=0;k<=38;k++){const a=-.4+k/38*TAU;pts.push([.72+.10*Math.cos(a),-.54+(j-2)*.013+.016*Math.sin(a*2),.60+.092*Math.sin(a)]);}binding.push(tube(pts,.0042,40,.95));}
  batch(cloth,binding,m.thread,'five close linen turns binding the gathered knot');
  batch(cloth,hems,m.thread,'linen selvedges');batch(cloth,fray,m.thread,'free frayed lower ends');batch(cloth,roseHems,m.roseThread||m.wine,'wine ribbon edges');
  const papers=layer('06 / small warm torn front slips and curled verso',[0,.01,.13]);
  [[.01,.23,.88,.10,-.20,-.24,.51,.57],[.24,-.04,.75,-.10,.33,.19,.33,.43],[-.15,-.26,.66,.25,-.16,.43,.30,.39],[.03,.52,.45,-.35,.34,-.48,.30,.40],[-.17,.51,-.90,.2,2.9,-.3,.37,.48],[.41,-.18,-.88,-.2,3.25,.5,.30,.41]].forEach(([x,y,z,rx,ry,rz,w,h],i)=>{const g=local(papers,[x,y,z],[rx,ry,rz]),notch=(q,center,span)=>Math.max(0,1-Math.abs(q-center)/span);skin(g,(u,v)=>[(u-.5)*w+(1-u)*.027*notch(v,.23+i*.037,.043)-u*.020*notch(v,.73-i*.023,.057),(v-.5)*h+(1-v)*.021*notch(u,.68-i*.033,.045)-v*.016*notch(u,.19+i*.051,.032),.019*Math.sin(u*3.5+v*2+i*.3)+.13*u**8+.036*v**6],i===0?m.menu:i<4?(i===2?m.receipt:m.paper):m.verso,m.verso,.004,40,32);});
  // A turned paper saddle reaches from the front slips into the cradle; this
  // otherwise hidden surface is visible from the side and through the roots.
  skin(papers,(u,v)=>[(u-.5)*.72-.22, -.48+.33*v+.055*Math.sin(u*5+v*2), -.51+.98*v+.12*Math.sin(Math.PI*u)-.08*Math.sin(v*5)],m.paper,m.verso,.004,32,36);
  const utensils=layer('07 / interlocked aged spoon and four-tine fork',[0,-.05,.09]);
  const spoon=local(utensils,[-.21,-.79,.86],[.15,-.24,-.66]);
  skin(spoon,(u,v)=>{const a=u*TAU,r=.015+.985*v;return [.145*r*Math.cos(a),.215*r*Math.sin(a),-.069*(1-r*r)];},m.silver,m.silver,.012,40,20);
  mesh(spoon,tube([[0,.19,0],[.01,.37,.035],[-.01,.68,.018],[.02,.85,.028]],.025,32,.70),m.silver,'spoon narrow curved handle');
  const fork=local(utensils,[.08,-.74,.81],[-.12,.20,.61]),prongs=[];
  prongs.push(tube([[0,-.39,.02],[0,-.13,.035],[0,.09,0],[0,.28,.01]],.022,28,.75));
  for(let j=0;j<4;j++){const x=(j-1.5)*.046;prongs.push(tube([[0,.22,.01],[x,.29,.015],[x,.43,.055],[x*.91,.56,.09]],.013,22,.37));}batch(fork,prongs,m.silver,'four separated bent tines and handle');
  const glass=layer('08 / open convex glass pocket and burgundy seed counterweight',[.06,-.02,.14]);
  const pocket=local(glass,[.35,-.67,1.11],[-.12,-.12,-.29]);
  // Offset this small lens from the knot so the right loop and free tails
  // remain visible as real folded cloth instead of one refracted flat patch.
  pocket.scale.set(.86,.90,.92);
  const bowl=(u,v)=>{const a=-.28+u*5.61,r=.025+.975*v,R=.37+.028*Math.sin(a*3);return [R*r*Math.cos(a),.46*r*Math.sin(a),.18*(1-r*r)+.010*Math.sin(a*4)*r];};
  mesh(pocket,surface(bowl,64,28),m.specimenGlass,'open convex glass meniscus');const lip=[];for(let k=0;k<=80;k++)lip.push(bowl(k/80,1));mesh(pocket,tube(lip,.005,84),m.glassEdge,'interrupted clear glass lip');
  const seeds={wine:[],violet:[],seedGold:[]},seedLayout=[],seedGlassGap=.055;
  // Both glass and seeds inherit exactly the same pocket transform. For each
  // rotated ellipsoid, bound its entire XY projection, then bound the lowest
  // glass Z over that rectangle using R >= .342 and ripple >= -.010.
  // The seed's foremost vertex is kept .055 BEHIND that conservative bound;
  // this is a whole-ellipsoid clearance, not just a center-point comparison.
  [[-.14,.17,.075,.11,.055,'wine'],[-.055,-.015,.046,.085,.050,'violet'],[.16,.23,.055,.07,.040,'wine'],[-.14,-.17,.065,.085,.040,'violet'],[.22,.06,.050,.065,.035,'seedGold'],[.02,-.32,.040,.055,.028,'seedGold'],[-.26,-.035,.035,.05,.025,'seedGold']].forEach(([x,y,w,h,d,key],i)=>{
    const angle=[-.28,.19,.53,-.41,.27,-.19,.32][i],cx=Math.cos(angle),sx=Math.sin(angle),extentX=Math.hypot(w*cx,h*sx),extentY=Math.hypot(w*sx,h*cx),radialBound=Math.hypot((Math.abs(x)+extentX)/.342,(Math.abs(y)+extentY)/.46),glassLowerBound=.18*(1-radialBound*radialBound)-.010,z=glassLowerBound-d-seedGlassGap;
    seeds[key].push(ellipsoid([x,y,z],[w,h,d],angle,20));seedLayout.push({material:key,center:[x,y,z],radii:[w,h,d],rotationZ:angle,radialBound,glassLowerBound,minimumLocalZGap:seedGlassGap});
  });
  for(const key of Object.keys(seeds))batch(pocket,seeds[key],m[key],'nested behind glass / '+key+' ovoids');
  // Fine dry stalks join the preserved seeds on the reverse of the lens.
  // Their last points meet the seeds' back surface, never the optical skin.
  batch(pocket,seedLayout.map(s=>tube([[.015,-.25,-.29],[s.center[0]*.57,s.center[1]-.06,Math.min(-.16,s.center[2]-.09)],[s.center[0],s.center[1],s.center[2]-s.radii[2]]],.0027,16,.40)),m.branch,'seven fine dried seed stalks behind the glass');
  pocket.updateMatrixWorld(true);
  const attachments=[[[.18,-.31,.63],.12],[[.68,-.53,.66],.52]];
  batch(glass,attachments.map(([anchor,u])=>{const edge=V(bowl(u,1)).applyMatrix4(pocket.matrixWorld);const mid=V(anchor).lerp(edge,.52).add(V([-.02,-.045,.01]));return tube([anchor,mid.toArray(),edge.toArray()],.0031,20,.68);}),m.thread,'two fine ties connecting the lens to paper and cloth');
  pocket.userData.seedLayout=seedLayout;pocket.userData.minimumSeedGlassGap=seedGlassGap;
  const sprouts=layer('09 / branched seed sprigs and joint blossoms',[0,.05,0]);const twigs=[],buds=[],petals=[],cores=[];
  const joints=[[-.56,.53,.83],[-.35,1.04,.16],[-1.17,-.10,.29],[.86,.33,.05],[.08,.42,-.76],[.25,-.97,-.30]];
  joints.forEach((p,i)=>{const top=[p[0]+.10,p[1]+.30,p[2]+.04];twigs.push(tube([p,[p[0]+.04,p[1]+.17,p[2]],top],.005,16,.35));for(let j=0;j<12;j++){const a=j*2.4+i,t=j/12,base=[p[0]+.07*t,p[1]+.25*t,p[2]+.02*t],tip=[base[0]+.075*Math.cos(a),base[1]+.08,base[2]+.065*Math.sin(a)];twigs.push(tube([base,[(base[0]+tip[0])/2,tip[1]-.025,tip[2]],tip],.0026,8,.3));buds.push(ellipsoid(tip,[.015,.024,.013],a,10));if(j===3||j===8){cores.push(ellipsoid(tip,[.014,.014,.013],0,8));for(let k=0;k<4;k++){const b=k*TAU/4;petals.push(ellipsoid([tip[0]+.025*Math.cos(b),tip[1]+.025*Math.sin(b),tip[2]+.008],[.025,.017,.007],b,10));}}}});
  batch(sprouts,twigs,m.branch,'branching pedicels');batch(sprouts,buds,m.flower,'72 small yellow kale buds');batch(sprouts,petals,m.petal,'12 four-petal blossoms');batch(sprouts,cores,m.warmCore||m.seedGold,'warm flower centers');
  const orbit=layer('10 / oblique specimen ribbon, interrupted brass and moss satellites',[0,0,0]);
  // One OPEN diagonal sweep: it passes behind the upper-left crown, through
  // the right shoulder gap, and in front of the low glass counterweight.
  const filmPath=new T.CatmullRomCurve3([V([-1.68,.98,-.68]),V([-.71,1.61,-.89]),V([.97,1.02,-.55]),V([1.60,-.11,.08]),V([.87,-1.13,.97]),V([-.58,-1.51,.65])]);
  const film=(u,v)=>{const p=filmPath.getPoint(u),t=filmPath.getTangent(u),cross=V([0,0,1]).cross(t).normalize(),width=.082-.026*u*u;return p.addScaledVector(cross,(v-.5)*width).add(V([0,0,.018*Math.sin(u*17+v*3)])).toArray();};
  mesh(orbit,surface(film,110,6),m.film,'open front-to-back pressed leaf film');
  const edges=[];for(const v of [0,1]){const ps=[];for(let k=0;k<=100;k++)ps.push(film(k/100,v));edges.push(tube(ps,.0019,104));}batch(orbit,edges,m.glassEdge,'thin film edges');
  for(const u of [.12,.46,.72,.91]){const p=filmPath.getPoint(u),g=local(orbit,p.toArray(),[0,.45,u*6]);mesh(g,surface((a,b)=>[(a-.5)*.045*Math.sin(b*Math.PI),(b-.5)*.20,.008+.01*Math.sin(b*Math.PI)],10,16),m.young,'pressed botanical inclusion');}
  const brass=[
    [[-1.38,.55,-.37],[-1.79,.17,.12],[-1.44,-.66,.52],[-.67,-1.17,.55],[-.11,-1.23,.28]],
    [[.32,1.47,-.34],[1.19,1.15,-.73],[1.65,.52,-.52],[1.25,.02,-.43]]
  ].map(p=>tube(p,.0037,68,.64));batch(orbit,brass,m.brass,'two unequal open brass connecting sweeps');
  const moss=[],tufts=[],podFibers=[];
  [[-1.61,-.77,.12,.105],[1.59,.68,-.38,.075]].forEach(([x,y,z,r],i)=>{
    const geo=new T.SphereGeometry(r,26,18),p=geo.attributes.position;
    for(let k=0;k<p.count;k++){const q=1+.11*Math.sin(p.getX(k)*47+i)*Math.cos(p.getY(k)*39)+.07*Math.sin(p.getZ(k)*59);p.setXYZ(k,p.getX(k)*q,p.getY(k)*q*.83,p.getZ(k)*q);}
    geo.computeVertexNormals();geo.translate(x,y,z);moss.push(geo);
    for(let j=0;j<17;j++){const a=j*2.399,R=r*(.32+.036*j),h=r*.73+.012*Math.sin(j*4);tufts.push(ellipsoid([x+R*.63*Math.cos(a),y+h,z+R*.63*Math.sin(a)],[.010,.022+(j%3)*.006,.007],a,8));}
    for(let j=0;j<7;j++){const pts=[];for(let k=0;k<=12;k++){const t=k/12,a=-1.1+t*3.9+j*.45;pts.push([x+r*1.01*Math.cos(a),y+r*.87*Math.sin(a),z+(.6+j*.08)*r*Math.sin(a+j)]);}podFibers.push(tube(pts,.0014,16,.48));}
  });
  batch(orbit,moss,m.moss,'two small irregular moss seedpods');batch(orbit,tufts,m.young,'rounded miniature seedpod leaves');batch(orbit,podFibers,m.thread,'fine seedpod root fibers');
  // Increase real layer depth, not the front silhouette. The original draft
  // placed most material close to one picture plane; the deeper cradle and
  // reverse foliage now remain spatially legible from the side.
  root.scale.z=1.18;
  let meshCount=0,triangleCount=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
  root.userData={title:'芥兰',englishTitle:'JIE LAN',version:'0.20.0',artRevision:15,leafCount,leafClusters:3,seedSprigs:6,netVeils:2,porcelainFragments:4,woodForks:5,structuralRoots:23,seedGlassGap,seedLayout,meshCount,triangleCount,layers:groups.map(g=>g.name),detailTargets:{leaves:[-.85,1.02,.413],linen:[.83,-.13,.555],glass:[.35,-.67,1.310],paper:[.01,.23,1.038],utensils:[-.12,-.61,1.015],rearSeam:[-.15,.05,-1.04]},structure:'Open forked wood with 23 connecting roots/cross-ties; left broad-leaf crown and lower reverse foliage, gathered shoulder panel, bound two-loop linen knot, unequal hanging tails, deep rear sling and turned paper saddle; four thick broken porcelain shards and a small low-reflection glass pocket; two unequal interrupted brass sweeps without a spherical shell',referenceBasis:'User botanical collage material relationships; recovered Kale Planet reference viewed without copying its pixels, signatures or typography. Original procedural geometry and local material studies.',back:'Gathered narrow woven seam at wood joints, two curled paper versos, staggered porcelain, sparse sideways leaves and gathered connecting linen with open gaps; independently designed completion',visualStatus:'Revision 15: inherited offset glass pocket and gathered cloth preserved; petioles stop at leaf bases; dried seed stalks and two fine lens ties establish physical connections. Multi-view validation and publication approval are separate source-bound records.'};
  return {root,groups,setSeparated(amount){const a=T.MathUtils.clamp(Number(amount)||0,0,1);groups.forEach(g=>g.position.fromArray(g.userData.separation).multiplyScalar(a));},dispose(){const geos=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);});geos.forEach(g=>g.dispose());m.dispose();}};
}
