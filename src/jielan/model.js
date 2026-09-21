import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials} from './materials.js?v=0190';
const V=p=>new T.Vector3(...p), TAU=Math.PI*2;
function surface(f,nu=36,nv=26){
  const p=[],uv=[],ix=[];
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...f(i/nu,j/nv));uv.push(i/nu,j/nv);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;ix.push(a,a+1,b,b,a+1,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
const tube=(p,r=.007,n=24)=>new T.TubeGeometry(new T.CatmullRomCurve3(p.map(V)),n,r,5,false);
export function makeJielan(){
  const root=new T.Group(),groups=[],m=makeMaterials();root.name='芥兰 / suspended botanical palimpsest';
  const layer=(name,separation)=>{const g=new T.Group();g.name=name;g.userData.separation=separation;root.add(g);groups.push(g);return g;};
  const mesh=(g,geo,mat)=>{const o=new T.Mesh(geo,mat);o.castShadow=!(mat.transmission>0);o.receiveShadow=true;g.add(o);return o;};
  const batch=(g,geos,mat)=>{if(!geos.length)return;const merged=mergeGeometries(geos);geos.forEach(x=>x.dispose());return mesh(g,merged,mat);};
  function skin(g,f,mat,back,thick=.025,nu=36,nv=24,edge=back){
    mesh(g,surface(f,nu,nv),mat);
    const reverse=(u,v)=>{const p=V(f(u,v)),du=V(f(Math.min(1,u+.001),v)).sub(V(f(Math.max(0,u-.001),v))),dv=V(f(u,Math.min(1,v+.001))).sub(V(f(u,Math.max(0,v-.001))));return p.addScaledVector(du.cross(dv).normalize(),-thick).toArray();};
    mesh(g,surface(reverse,nu,nv),back);
    const faces=[];for(const e of [0,1]){faces.push(surface((u,v)=>V(f(u,e)).lerp(V(reverse(u,e)),v).toArray(),nu,1));faces.push(surface((u,v)=>V(f(e,u)).lerp(V(reverse(e,u)),v).toArray(),nv,1));}batch(g,faces,edge);
  }
  // The core is assembled locally. No global projection or radial clamping.
  const plants=layer('01 / broad crinkled kale, inner folds and branched veins',[-.12,.12,0]);
  const veins=[],stems=[];let leafCount=0;
  function leaf(p,n,roll,w,h,seed,young=false){
    const g=new T.Group();g.position.copy(V(p));g.quaternion.setFromUnitVectors(V([0,0,1]),V(n).normalize());g.rotateZ(roll);plants.add(g);
    const f=(u,v)=>{const s=2*u-1,t=v,edge=Math.pow(Math.sin(Math.PI*t),.56),ruffle=.033*Math.sin(t*17+seed)*Math.pow(Math.abs(s),3)*Math.sin(Math.PI*t);return [s*w*.5*edge*(1+.071*Math.sin(t*19+seed)*Math.abs(s)),(t-.43)*h,.15*Math.sin(t*3.4)+.12*s*s+.025*Math.sin(s*9+t*13+seed)*Math.sin(Math.PI*t)+ruffle+.10*Math.pow(t,7)];};
    mesh(g,surface(f,44,64),young?m.young:m.leaf);g.updateMatrixWorld(true);
    const pt=(u,v)=>V(f(u,v)).add(V([0,0,.0035])).applyMatrix4(g.matrixWorld).toArray();
    const spine=[];for(let k=0;k<=28;k++)spine.push(pt(.5,k/28));veins.push(tube(spine,.0045,32));
    for(let k=1;k<8;k++)for(const sign of [-1,1]){const t=k/9,ps=[];for(let j=0;j<=16;j++){const q=j/16;ps.push(pt(.5+sign*.47*q,t+q*.065));}veins.push(tube(ps,.0022,20));for(let z=1;z<4;z++){const u=.5+sign*z*.115,v=t+z*.016;veins.push(tube([pt(u,v),pt(u+sign*.045,v+.024),pt(u+sign*.07,v+.053)],.0011,8));}}
    stems.push(tube([p.map(a=>a*.72),pt(.5,0),pt(.5,.24)],.010,20));leafCount++;
  }
  // Eight intentionally unequal clusters leave the front-right kernel exposed.
  // Each tuple is an authored cluster, not a spherical sampling distribution.
  const clusters=[
    {p:[-1.00,.93,.69],n:[-.32,.30,1],roll:-.60,count:4,w:.72,h:.89},
    {p:[-.30,1.27,.14],n:[-.05,.70,.70],roll:.25,count:3,w:.55,h:.70},
    {p:[-1.18,-.71,.56],n:[-.7,-.18,1],roll:1.10,count:4,w:.61,h:.79},
    {p:[-1.40,.18,-.40],n:[-1,.2,-.2],roll:-.40,count:3,w:.60,h:.73},
    {p:[.78,-1.03,-.15],n:[.55,-.5,.3],roll:-1.10,count:3,w:.50,h:.65},
    {p:[.83,.83,-.80],n:[.7,.5,-1],roll:.70,count:4,w:.64,h:.83},
    {p:[-.79,-.56,-.96],n:[-.5,-.25,-1],roll:-.65,count:3,w:.62,h:.79},
    {p:[-.47,.95,-.79],n:[-.35,.6,-1],roll:1.10,count:3,w:.53,h:.72}
  ];
  clusters.forEach((c,i)=>{for(let k=0;k<c.count;k++){const d=k-(c.count-1)/2,p=[c.p[0]+d*.16,c.p[1]+.12*Math.sin(k*2+i),c.p[2]+d*.085];leaf(p,[c.n[0]+d*.15,c.n[1]+d*.13,c.n[2]],c.roll+d*.38,c.w*(1-.09*k),c.h*(1-.07*k),i*7+k,k===2);}});
  [[[-1.01,.94,.98],[-.22,.3,1],-.60,1.02,1.17],[[-1.37,.28,.51],[-.8,.1,1],.60,.90,1.07],[[.53,.99,-.92],[.3,.4,-1],.45,.92,1.04]].forEach((a,i)=>leaf(...a,i+60));
  batch(plants,veins,m.vein);batch(plants,stems,m.branch);
  const ceramics=layer('02 / hollow cobalt nucleus and five staggered reverse fragments',[.12,0,-.08]);
  // Four staggered, open sectors occupy the depth of a globe, not a plate.
  // Reversed angular winding faces the glaze into the cavity: its joined
  // clay reverse is offset OUTWARD, never over the visible blue interior.
  const basin=new T.Group();basin.position.set(.10,.02,.08);basin.rotation.set(-.16,.30,.20);ceramics.add(basin);
  [[-.24,1.20,.49,1.88,.04,1.17],[1.38,2.64,.61,2.01,.18,1.12],[2.86,3.96,.42,1.82,-.16,1.24],[4.16,5.82,.66,1.96,.09,1.20]].forEach(([a,b,lo,hi,d,radius],i)=>{
    const f=(u,v)=>{const ang=b+(a-b)*u+.018*Math.sin(v*9+i),t=lo+(hi-lo)*v+.047*Math.sin(u*9+i)*v+.018*Math.sin(u*27+i)*v*v,r=radius+.024*Math.sin(ang*7+i);return [r*Math.sin(t)*Math.cos(ang),r*.93*Math.sin(t)*Math.sin(ang),-1.22*Math.cos(t)+d+.018*Math.sin(u*11+v*9)];};
    skin(basin,f,m.blue,m.ceramicBack,.038,68,52,m.porcelain);
    const lip=[];for(let k=0;k<=72;k++)lip.push(f(k/72,.993));mesh(basin,tube(lip,.012,80),m.blue);
  });
  const shards=[[-.92,-.91,-.29,.8,-.6,-.4,.92,.70],[.67,-.46,-.92,-.25,2.90,-.55,.87,.83],[-.32,.42,-1.09,.25,3.20,.5,.89,.75],[.51,.71,-.91,.23,3.45,-.25,.54,.52],[-.56,-.52,-1.0,-.36,2.9,.17,.56,.59]];
  shards.forEach(([x,y,z,rx,ry,rz,w,h],i)=>{const g=new T.Group();g.position.set(x,y,z);g.rotation.set(rx,ry,rz);ceramics.add(g);const f=(u,v)=>{const a=(u-.5)*2,b=(v-.5)*2,chip=1-.13*Math.exp(-(((v-.35-i%2*.2)/.085)**2));return [a*w*.5*(chip+.025*Math.sin(v*23+i)),b*h*.5*(1+.07*Math.sin(u*13+i)),.24*a*a+.19*b*b+.011*Math.sin(u*13+v*11)];};skin(g,f,m.blue,m.ceramicBack,.036,48,36,m.porcelain);});
  const textile=layer('03 / sage linen traversing folds and reversed selvedges',[.12,-.1,.06]);
  const hems=[],fibers=[];
  const folds=[[[1.05,1.0,.74],[1.64,.34,.48],[1.60,-.35,-.25],[1.27,-.80,-.98]],[[-1.17,-.72,1.0],[-.83,-1.45,.51],[-.27,-1.47,-.06]],[[.75,-.20,-1.51],[.22,.23,-1.59],[-.54,.45,-1.47]],[[-.38,.15,-.06],[.13,-.33,.03],[.72,-.53,.42]]];
  folds.forEach((ps,i)=>{const path=new T.CatmullRomCurve3(ps.map(V));const f=(u,v)=>{const p=path.getPoint(u),t=path.getTangent(u),axis=i===0?V([.4,.3,1]):V([-.3,.2,1]),cross=axis.clone().cross(t).normalize(),normal=t.clone().cross(cross).normalize(),s=v-.5,width=(i===0?.72:i===1?.41:i===2?.51:.54)*(.55+.45*Math.sin(Math.PI*u));return p.addScaledVector(cross,s*width).addScaledVector(normal,.12*Math.sin(v*TAU*2.1+u*3+i)+.09*Math.cos(u*7)*s+.08*Math.pow(2*s,4)+.021*Math.sin(u*29+v*11)*Math.sin(Math.PI*u)).toArray();};skin(textile,f,i===1||i===3?m.linenPale:m.linen,m.linenReverse,.014,72,42);for(const v of [.015,.985]){const pts=[];for(let k=0;k<=60;k++)pts.push(f(k/60,v));hems.push(tube(pts,.003,64));for(let k=0;k<40;k++){const p=f(k/39,v);fibers.push(tube([p,[p[0]+.027*Math.sin(k*2),p[1]-.025,p[2]+.022]],.0015,4));}}});
  batch(textile,hems,m.thread);batch(textile,fibers,m.thread);
  // Curled, short saddles bridge front and rear at unequal heights. These
  // leave openings between them and reveal paper edges in the side view.
  const bridge=new T.Group();bridge.rotation.set(.19,-.24,-.37);bridge.scale.set(.74,.80,.82);textile.add(bridge);
  for(let j=0;j<4;j++){
    const f=(u,v)=>{const z=-1.03+u*2.02,s=v-.5;return [.30*Math.sin(u*4+j*.81)+(j-1.5)*.28+s*(.46+j*.035),-.66+j*.39+.13*Math.sin(u*5+j)+.075*Math.cos(v*9+u*5),z+.10*Math.sin(v*3+u*5)];};
    skin(bridge,f,j%2?m.linenPale:m.paper,m.verso,.013,52,24);
    const stitch=[];for(let k=0;k<=45;k++)stitch.push(f(k/45,.97));mesh(bridge,tube(stitch,.003,52),m.thread);
  }
  const paper=layer('04 / small torn cream corners with original green traces',[0,.02,.16]);
  [[-.26,.17,.57,.25,-.30,-.42,.53,.68],[.23,.48,.06,-.32,.24,.40,.51,.62],[.52,-.17,-.11,.38,-.35,-.60,.43,.57],[-.22,-.53,.29,.56,.16,-.25,.55,.36],[.20,.63,-1.49,.1,3.1,-.4,.49,.59],[-.59,-.47,-1.44,.3,2.9,.4,.39,.52]].forEach(([x,y,z,rx,ry,rz,w,h],i)=>{const g=new T.Group();g.position.set(x,y,z);g.rotation.set(rx,ry,rz);paper.add(g);skin(g,(u,v)=>[(u-.5)*w*(1-.18*v)+.004*Math.sin(v*43+i),(v-.5)*h+.004*Math.sin(u*47),.10*Math.sin(u*3)+.16*u**7+.065*Math.sin(v*5+i)],i%2?m.verso:m.menu,m.verso,.008,38,36);});
  const jewels=layer('05 / asymmetric glass pocket and anchored seeds',[.06,-.03,.15]);
  // An irregular, open glass meniscus shelters the offset inner fragments.
  // It has neither a flat medallion face nor a circular metal bezel.
  const meniscus=new T.Group();meniscus.position.set(.37,-.29,1.12);meniscus.rotation.set(-.12,-.22,-.39);jewels.add(meniscus);
  const glassSurface=(u,v)=>{const a=-.37+u*5.61,r=v*(.54+.055*Math.sin(a*3)+.025*Math.cos(a*7));return [Math.cos(a)*r,Math.sin(a)*r*1.17,.25*(1-v*v)+.018*Math.sin(a*4)*v];};
  mesh(meniscus,surface(glassSurface,72,30),m.specimenGlass);
  const glassLip=[];for(let k=0;k<=100;k++)glassLip.push(glassSurface(k/100,1));mesh(meniscus,tube(glassLip,.009,112),m.glassEdge);
  const settings=[];
  [[.44,-.20,.83,.21,.28,.16,'wine'],[.72,.32,.52,.10,.16,.12,'amber'],[-.05,-.61,.83,.12,.15,.09,'violet'],[-1.03,.63,.86,.055,.09,.055,'amber'],[.64,.17,-1.61,.11,.17,.11,'wine'],[-.40,-.72,-1.46,.08,.11,.075,'violet'],[1.34,-.24,-.19,.075,.095,.06,'amber']].forEach(([x,y,z,w,h,d,key],i)=>{const geo=new T.SphereGeometry(1,36,28),a=geo.attributes.position;for(let k=0;k<a.count;k++){const px=a.getX(k),py=a.getY(k),pz=a.getZ(k),q=1+.09*Math.sin(py*5+i)*Math.cos(px*4)+.045*Math.sin(pz*7+i);a.setXYZ(k,px*q*(1-.13*py),py*q,pz*q);}geo.computeVertexNormals();const o=mesh(jewels,geo,m[key]);o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.set(.32+i*.17,-.25,i*.73);for(const s of [-1,1])settings.push(tube([[x+s*w*.7,y-h*.45,z-.03],[x+s*w*.65,y-h*.7,z-d],[x*.90,y-.17,z-.21]],.004,18));});batch(jewels,settings,m.brass);
  const roots=layer('06 / fine dry roots and silver textile filaments',[-.05,.02,-.02]);
  const rootLines=[],silver=[];
  // Two authored net veils sag between material anchors, crossing visible gaps.
  const veil=(u,v,rear=false)=>{const x=-1.10+u*1.70,y=-.73+v*.61+.26*u+.07*Math.sin(u*5+v*3),z=.93-.36*u+.12*Math.sin(v*Math.PI)+.06*Math.sin(u*7);return rear?[-x*.90,y+.93,-z-.72]:[x,y,z];};
  for(const rear of [false,true]){
    for(let j=0;j<25;j++){const ps=[];for(let k=0;k<=36;k++){const u=k/36,v=j/24+.008*Math.sin(u*17+j);ps.push(veil(u,v,rear));}silver.push(tube(ps,j%5===0?.0028:.0017,44));}
    for(let j=0;j<39;j++){const ps=[];for(let k=0;k<=22;k++){const v=k/22,u=j/38+.01*Math.sin(v*12+j);ps.push(veil(u,v,rear));}silver.push(tube(ps,.0016,30));}
    for(let j=0;j<14;j++){const ps=[];for(let k=0;k<=20;k++){const u=k/20,p=veil(u,j/15,rear);p[1]+=.015*Math.sin(u*31+j);p[2]+=.02*Math.sin(u*17+j);ps.push(p);}rootLines.push(tube(ps,.0028,30));}
  }
  batch(roots,rootLines,m.branch);batch(roots,silver,m.silver);
  const seeds=layer('07 / eight warm yellow seed and flower sprigs',[.02,.05,.02]);
  const stalks=[],petals=[];
  [[-.87,.70,1.00],[.00,1.17,.38],[-1.30,-.39,.75],[.58,-.89,.52],[1.13,.51,.13],[.75,.76,-.99],[-.82,.04,-1.02],[-.17,-1.08,-.74]].forEach((p,i)=>{
    const base=[p[0]*.89,p[1]-.12,p[2]*.82];
    for(let j=0;j<4;j++){const tip=[p[0]+.065*Math.sin(j*2.3+i),p[1]+j*.045,p[2]+.07*Math.cos(j*2+i)];stalks.push(tube([base,[(base[0]+tip[0])/2+.025,(base[1]+tip[1])/2,tip[2]-.04],tip],.003,18));const bud=mesh(seeds,new T.SphereGeometry(1,12,10),j%3?m.flower:m.seedGold);bud.position.set(...tip);bud.scale.set(.024,.036,.022);bud.rotation.z=j*.7;
      if(j===1||j===3)for(let k=0;k<4;k++){const a=k*Math.PI/2+i,geo=new T.SphereGeometry(1,10,8);geo.scale(.018,.030,.008);geo.rotateZ(-a);geo.translate(tip[0]+.021*Math.sin(a),tip[1]+.021*Math.cos(a),tip[2]+.01);petals.push(geo);}
    }
  });batch(seeds,stalks,m.branch);batch(seeds,petals,m.petal);
  const orbit=layer('08 / tilted translucent irregular membrane and interrupted brass orbit',[0,0,0]);
  const tilt=new T.Group();tilt.rotation.set(.76,-.27,-.43);orbit.add(tilt);
  const orbital=(u,v)=>{const a=-.55+u*5.65,r=1.99+.10*Math.sin(a*3)+.025*Math.sin(a*7)+(v-.5)*(.25+.075*Math.sin(a*2+.4));return [r*Math.cos(a),.085*Math.sin(a*3)+(v-.5)*.15*Math.sin(a*2),r*Math.sin(a)];};
  mesh(tilt,surface(orbital,180,8),m.film);
  for(const v of [0,1]){const p=[];for(let k=0;k<=140;k++)p.push(orbital(k/140,v));mesh(tilt,tube(p,.006,160),m.glassEdge);}
  // Pressed green inclusions articulate a real transparent ribbon, rather
  // than a decorative circle drawn behind the object.
  for(const [a,length,width] of [[.36,.31,.060],[2.61,.25,.047],[4.40,.32,.059],[5.22,.19,.045]]){
    const g=new T.Group();g.position.set(2.01*Math.cos(a),.018,2.01*Math.sin(a));g.rotation.set(-Math.PI/2,0,a+.55);tilt.add(g);
    mesh(g,surface((u,v)=>{const s=u*2-1;return [s*width*Math.sin(v*Math.PI),length*(v-.5),.005+.012*Math.sin(v*Math.PI)];},16,20),m.young);
  }
  tilt.updateMatrixWorld(true);
  for(const u of [.14,.61]){const p=V(orbital(u,.5)).applyMatrix4(tilt.matrixWorld),q=p.clone().multiplyScalar(.79);mesh(orbit,tube([p.toArray(),p.clone().lerp(q,.5).add(V([.02,.025,0])).toArray(),q.toArray()],.006,18),m.brass);const clamp=mesh(orbit,new T.SphereGeometry(.022,12,10),m.silver);clamp.position.copy(p);}
  const metal=new T.Group();metal.rotation.set(.33,.24,.56);orbit.add(metal);
  for(const [a,b] of [[-.2,1.95],[2.50,4.35]]){const p=[];for(let k=0;k<=90;k++){const t=a+(b-a)*k/90;p.push([2.02*Math.cos(t),.11*Math.sin(t*2),2.03*Math.sin(t)]);}mesh(metal,tube(p,.007,90),m.brass);}
  [[-1.93,.57,.42],[1.75,-.78,-.50]].forEach(p=>{const o=mesh(orbit,new T.SphereGeometry(.055,16,12),m.amber);o.position.set(...p);mesh(orbit,tube([p,p.map(x=>x*.82)],.006,10),m.brass);});
  root.userData={title:'芥兰',englishTitle:'JIE LAN',version:'0.19.0',artRevision:8,leafCount,leafClusters:8,seedSprigs:8,netVeils:2,layers:groups.map(g=>g.name),structure:'Eight unequal leaf clusters around a deep four-sector hollow cobalt nucleus; five staggered reverse porcelain fragments, four crossing cloth folds and four through-depth paper saddles; inset slips and glass seeds under an open meniscus, two anchored mesh veils and oblique membrane with pressed leaf inclusions',referenceBasis:'Composition-02 six-view rejection, yesterday-today actual cover and private user thumbnail; original geometry and procedural textures',back:'Differentiated clusters, reversed slate-sage wedge, cobalt undersides, cream slips, seed sprigs and second net veil; designed completion',visualStatus:'Art approval is recorded separately against the final exported build manifest'};
  return {root,groups,setSeparated(amount){const a=T.MathUtils.clamp(Number(amount)||0,0,1);groups.forEach(g=>g.position.fromArray(g.userData.separation).multiplyScalar(a));},dispose(){const geos=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);});geos.forEach(g=>g.dispose());m.dispose();}};
}
