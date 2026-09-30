import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials,random} from './materials.js?v=0290';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),TAU=Math.PI*2;
const S=(lo,la,r=1.3)=>V(r*Math.cos(la)*Math.sin(lo),r*Math.sin(la),r*Math.cos(la)*Math.cos(lo));
const curve=ps=>new T.CatmullRomCurve3(ps.map(p=>p.isVector3?p.clone():V(...p)));
const frame=(n,a=0)=>new T.Quaternion().setFromUnitVectors(V(0,0,1),n.clone().normalize()).multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),a));
function pose(g,p,n,a=0){g.applyQuaternion(frame(n,a));g.translate(...p.toArray());return g;}
function grid(fn,nu=12,nv=22,thickness=0){
  const p=[],uv=[],ix=[],count=(nu+1)*(nv+1);
  for(let side=0;side<(thickness?2:1);side++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const v=fn(i/nu,j/nv);if(side)v.z-=thickness;p.push(...v.toArray());uv.push(i/nu,j/nv);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;ix.push(a,b,d,a,d,c);if(thickness)ix.push(a+count,d+count,b+count,a+count,c+count,d+count);}
  if(thickness){const rim=[];for(let i=0;i<=nu;i++)rim.push(i);for(let j=1;j<=nv;j++)rim.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)rim.push(nv*(nu+1)+i);for(let j=nv-1;j>0;j--)rim.push(j*(nu+1));for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];ix.push(a,b+count,b,a,a+count,b+count);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function tube(ps,r=.002,n=24,s=3){return new T.TubeGeometry(curve(ps),n,r,s,false);}
const hash=(x,y,z)=>{const q=Math.sin(x*13.17+y*51.83+z*27.11)*43847.2;return q-Math.floor(q);};

export function makeFalling(){
  const root=new T.Group();root.name='在坠落时 / Textile gravity';const{m,dispose:disposeMaterials}=makeMaterials(),r=random(290930),groups=[],owned=new Set(),buckets=new Map();
  function group(name,offset){const g=new T.Group();g.name=name;g.userData.offset=offset;root.add(g);groups.push(g);return g;}
  function collect(g,mat,parent,name='woven fragments',shadow=true){
    if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
    const key=parent.uuid+'/'+mat.uuid+'/'+shadow;let b=buckets.get(key);if(!b){b={gs:[],mat,parent,name,shadow};buckets.set(key,b);}b.gs.push(g);
  }
  function flush(){for(const b of buckets.values()){const g=mergeGeometries(b.gs,false);if(!g)throw new Error('Geometry formats differ: '+b.name);b.gs.forEach(g=>g.dispose());owned.add(g);const mesh=new T.Mesh(g,b.mat);mesh.name=b.name;mesh.castShadow=b.shadow;mesh.receiveShadow=true;b.parent.add(mesh);}buckets.clear();}
  const core=group('01 / 断续的红色底层',[0,0,0]),structure=group('02 / 黑色撕片与纸背',[-.028,.018,.032]),textile=group('03 / 撕开的银灰织物',[.03,.014,.05]),foil=group('04 / 金属反光与毛边',[-.02,.008,.075]),fiber=group('05 / 红色纤维斜向缠接',[.025,-.012,.08]),ruby=group('06 / 成串的玻璃环珠',[-.025,-.018,.09]),flowers=group('07 / 花材与脆弱叶脉',[-.03,-.018,.08]),gravel=group('08 / 碎石、红枝与嵌入物',[.042,.002,.05]),reverse=group('09 / 背向的织物与红线',[-.03,.013,-.08]),tail=group('10 / 松散的织物边缘',[.025,-.045,.015]),label=group('11 / 被缝入的字迹',[0,0,.045]);
  let patchCount=0,beadCount=0,petalCount=0,flowerCount=0,stitchCount=0,fragmentCount=0,chainCount=0,fiberCount=0;
  const ball=new T.SphereGeometry(1.12,64,44),bp=ball.attributes.position;
  for(let i=0;i<bp.count;i++){const p=V().fromBufferAttribute(bp,i),d=.016*Math.sin(p.x*12+p.z*8)*Math.sin(p.y*11);p.multiplyScalar(1+d/1.12);bp.setXYZ(i,...p.toArray());}ball.computeVertexNormals();collect(ball,m.core,core,'recessed crimson textile support');
  // Torn strips have asymmetric straight cut runs, ruptured ends and many
  // small creases. They are not repeated curving leaf-shaped paper tiles.
  function sheet(name,p,n,w,h,a,mat,parent,{seed=1,crease=.07,curl=.05,taper=.16,thickness=.003,wrap=.22,fray=0}={}){
    const rng=random(seed),cutsL=Array.from({length:9},()=>.82+rng()*.25),cutsR=Array.from({length:9},()=>.80+rng()*.30),q=frame(n,a),origin=p.isVector3?p.clone():V(...p);
    const sample=(xs,t)=>{const i=Math.min(7,Math.floor(t*8));return T.MathUtils.lerp(xs[i],xs[i+1],t*8-i);};
    const f=(u,t)=>{const b=u*2-1,v=t*2-1,edge=sample(b<0?cutsL:cutsR,t),end=1-taper*(Math.max(0,v)*.9+Math.max(0,-v)*.4),xx=b*w*.5*edge*end+.009*w*Math.sin(t*137+seed)*Math.pow(Math.abs(b),7),yy=v*h*.5+(u-.5)*h*.12+(Math.sin(u*81+seed)+.4*Math.sin(u*171))*h*.012*Math.pow(Math.abs(v),10);
      const z=crease*(.56*Math.abs(b+.22*v)-.20+.36*Math.abs(v-b*.63+.15))+.010*Math.sin(t*28+u*9+seed)+.004*Math.sin(t*73-u*23)+curl*Math.pow(Math.max(0,v),3)-wrap*(xx*xx+yy*yy);return V(xx,yy,z);};
    const g=grid(f,12,28,thickness);g.applyQuaternion(q);g.translate(...origin.toArray());collect(g,mat,parent,name);patchCount++;
    const world=(u,t)=>f(u,t).applyQuaternion(q).add(origin);
    if(fray){
      for(let side=0;side<2;side++){
        const pts=[];for(let j=0;j<36;j++)pts.push(world(side,j/35));collect(tube(pts,.0022,38,3),m.darkThread,parent,'dark torn selvedges',false);
        for(let j=0;j<fray;j++){const t=rng(),start=world(side,t),end=start.clone().add(V((side?1:-1)*(.018+rng()*.045),(.5-rng())*.058,(rng()-.5)*.03).applyQuaternion(q));collect(tube([start,start.clone().lerp(end,.5).add(V(.004,.004,.008)),end],.0007+rng()*.00055,7,3),j%4?m.thread:m.darkThread,parent,'frayed metallic cloth edge',false);fiberCount++;}
      }
    }
    if(mat===m.silverCloth||mat===m.silverDark){
      for(let k=0;k<8;k++){const u=.08+k*.117,ps=[];for(let j=0;j<17;j++){const p=world(u+.003*Math.sin(j+k),j/16);p.addScaledVector(n.clone().normalize(),.002);ps.push(p);}collect(tube(ps,.00065,24,3),k%3?m.darkThread:m.thread,parent,'broken longitudinal textile strands',false);fiberCount++;}
    }
    return world;
  }
  function patch(name,lo,la,w,h,a,mat,parent,opts={}){const p=S(lo,la,opts.radius||1.30);return sheet(name,p,p,w,h,a,mat,parent,opts);}
  // Red is a torn backing glimpsed between seams, not a cleaned spherical rim.
  for(const [i,lo,la,w,h,a]of [[0,-.64,.80,.86,.70,-.22],[1,.57,.64,.73,.75,.43],[2,-.77,-.56,.80,.72,.22],[3,.36,-.96,.91,.54,-.20],[4,1.72,.51,.75,.70,.50],[5,2.69,.66,.88,.68,-.43],[6,3.11,-.69,.91,.67,.30], [7,-1.72,-.45,.77,.85,-.46]])patch('broken red backing '+i,lo,la,w*.72,h*.74,a,m.redCloth,core,{radius:1.18,seed:30+i,crease:.03,curl:.015,taper:.06});
  // The front is arranged along a lower-left / upper-right fault. The flanks
  // and reverse carry different continuations, not a repeated grid of knots.
  const sites=[[-.87,.77,-.28,1.05],[-.31,.94,.18,.90],[.28,.80,-.50,1.06],[.66,.49,-.43,.95],[.91,.16,.36,.93],[-.86,.31,-.51,1.01],[-.54,-.09,-.69,.97],[-.06,-.06,-.31,.86],[.32,-.37,.52,.87],[-.78,-.55,-.71,1.13],[-.27,-.84,.52,.98],[.28,-.91,-.42,1.01],[.83,-.66,.48,.89],
    [1.42,.68,-.43,.93],[1.63,.18,.57,1.05],[1.42,-.42,-.71,1.04],[1.78,-.79,.34,.87],[-1.48,.61,.53,.94],[-1.72,.08,-.69,1.08],[-1.54,-.54,.37,1.02],
    [2.23,.60,-.53,.96],[2.73,.91,.39,.88],[3.15,.65,-.44,.91],[-2.67,.39,.56,1.01],[2.67,.29,.42,1.05],[3.07,-.12,-.65,.98],[-2.65,-.32,-.23,1.09],[2.34,-.35,.73,.97],[2.73,-.82,-.33,.96],[-2.91,-.85,.54,.91],[-2.16,-.19,.43,.90]];
  sites.forEach(([lo,la,a,s],i)=>{
    const parent=Math.cos(lo)<-.2?reverse:structure,clothParent=Math.cos(lo)<-.2?reverse:textile,base=1.25+(i%3)*.015;
    patch('charcoal structural torn plane '+i,lo,la,.58*s,.94*s,a,m.black,parent,{radius:base,seed:100+i*23,crease:.12,curl:.08,taper:.27});
    const surf=patch('silver grey woven strip '+i,lo-.025,la-.025,.43*s,1.08*s,a-.11,i%4===2?m.silverDark:m.silverCloth,clothParent,{radius:base+.050,seed:101+i*23,crease:.065,curl:.08,taper:.35,fray:9});
    if(i%3!==1)patch('narrow charcoal torn spine '+i,lo+.085,la+.11,.14*s,.73*s,a+.45,m.charcoal,parent,{radius:base+.099,seed:104+i*23,crease:.087,curl:.06,taper:.35});
    patch('interleaved dusty scrap '+i,lo-.10,la-.13,.19*s,.44*s,a+.61,i%3?m.ash:m.dustRose,clothParent,{radius:base+.077,seed:107+i*23,crease:.04,curl:.04,taper:.42});
    if(i%2===0)patch('small cold foil return '+i,lo+.075,la-.14,.10*s,.50*s,a-.49,m.silver,Math.cos(lo)<-.2?reverse:foil,{radius:base+.12,seed:108+i*23,crease:.092,curl:.04,taper:.55});
    for(let j=0;j<4;j++){const p=surf(.11,.22+j*.13),end=surf(.37,.235+j*.13);collect(tube([p,p.clone().lerp(end,.5).multiplyScalar(1.008),end],.0018,7,3),i%3?m.thread:m.redThread,clothParent,'unequal stitches at cloth junctions',false);stitchCount++;}
    for(let j=0;j<4;j++)patch('splinter in cloth knot '+i+'-'+j,lo+(r()-.5)*.26,la+(r()-.5)*.38,.052+r()*.10,.20+r()*.32,a+(r()-.5)*1.9,j%3?m.silverDark:m.black,clothParent,{radius:1.37+r()*.06,seed:400+i*11+j,crease:.07,curl:.055,taper:.70});
  });
  // Front infill is an unequal braid of cloth shards, with one central
  // inscription window. It conceals the support without restoring a clean rim.
  const frontInfill=[[-.42,.52,.28,.84,-.63],[-.77,.48,.25,.92,.27],[.19,.51,.27,.90,.39],[.55,.29,.23,1.01,-.29],[-.73,-.19,.35,.90,-.83],[-.40,-.36,.29,.86,.51],[.26,-.62,.27,.89,-.41],[.57,-.46,.27,.93,.31],[-.20,-.67,.26,.75,-.78],[.38,.08,.20,.78,-.15]];
  frontInfill.forEach(([lo,la,w,h,a],i)=>{patch('interlocking front textile '+i,lo,la,w,h,a,i%4===0?m.silverDark:m.silverCloth,textile,{radius:1.36,seed:770+i*9,crease:.053,curl:.045,taper:.45,fray:8});if(i%2===0)patch('cross-cut carbon fragment '+i,lo+.04,la+.09,.11,.49,a+.69,m.black,structure,{radius:1.415,seed:779+i*9,crease:.065,curl:.03,taper:.53});});
  const flankInfill=[[1.22,.34,.51],[1.89,.39,-.64],[1.45,-.13,.42],[1.84,-.35,-.29],[1.21,-.61,.63],[-1.24,.31,-.44],[-1.90,.31,.63],[-1.46,-.20,-.53],[-1.89,-.45,.46],[2.93,.37,-.41],[2.46,-.08,.59],[-2.87,-.19,-.64],[2.90,-.45,.41]];
  flankInfill.forEach(([lo,la,a],i)=>{const parent=Math.cos(lo)<0?reverse:textile;patch('side-back infill cloth '+i,lo,la,.36,.71,a,i%3===0?m.silverDark:m.silverCloth,parent,{radius:1.39,seed:860+i*13,crease:.079,curl:.05,taper:.42,fray:9});patch('angled carbon overlap in side seam '+i,lo-.05,la+.08,.15,.55,a+.66,m.black,parent,{radius:1.445,seed:862+i*13,crease:.06,curl:.04,taper:.53});patch('small buried pale remnant '+i,lo+.12,la-.13,.17,.39,a-.56,i%4===1?m.dustRose:m.ash,parent,{radius:1.43,seed:865+i*13,crease:.04,curl:.06,taper:.48});});
  patch('tall dark printed shoulder remnant',-.80,1.02,.39,.90,.06,m.darkPrint,structure,{radius:1.38,seed:991,crease:.04,curl:.035,taper:.08});
  // A few long strips set the reference's directional reach and ragged border.
  const margins=[[-.85,1.12,.22,.99,.20],[-.42,1.13,.17,.97,.38],[.21,1.17,.21,1.06,-.44],[.64,.95,.25,.94,-.59],[-1.21,.10,.21,1.04,-.79],[-.95,-.79,.19,1.03,-.77],[.27,-1.17,.25,.94,.42],[.60,-1.02,.17,1.02,.35],[1.22,-.10,.18,.90,-.73],[2.18,.86,.20,.99,-.36],[3.00,1.14,.19,.84,.41],[-2.39,-.77,.23,.93,-.56],[-1.59,.87,.14,.88,.29]];
  margins.forEach(([lo,la,w,h,a],i)=>{const p=patch('long black-edged woven shreds '+i,lo,la,w,h,a,i%4===0?m.black:m.silverCloth,Math.cos(lo)<-.2?reverse:tail,{radius:1.34,seed:901+i,crease:.10,curl:.12,taper:.63,wrap:.10,fray:i%4===0?0:18});});
  // Small central printed fragment is partly concealed by actual silk, veins
  // and threads. Only the artwork title is used; no artist/brand attribution.
  sheet('buried oblique inscription',V(-.02,.15,1.49),V(-.05,.09,1),.58,.76,-.31,m.label,label,{seed:980,crease:.021,curl:.01,taper:.035,wrap:.02});
  // Mesh veils combine an alpha-cut woven surface and broken 3D threads.
  function veil(name,points,width,parent,seed){
    const path=curve(points),rng=random(seed),fn=(u,t)=>{const p=path.getPoint(t),d=path.getTangent(t),n=p.clone().normalize(),side=new T.Vector3().crossVectors(d,n).normalize(),span=width*(.20+.32*Math.sin(Math.PI*t)+.06*Math.sin(t*15+seed));return p.addScaledVector(side,(u*2-1)*span).addScaledVector(n,.015*Math.sin(t*22+u*8));};
    collect(grid(fn,12,24),m.gauze,parent,name+' torn transparent weave',false);
    for(let j=0;j<31;j++){
      const pts=[],start=rng()*.08,end=.82+rng()*.18;
      for(let k=0;k<17;k++)pts.push(fn((j+.3*Math.sin(k*.7+j))/31,start+(end-start)*k/16));
      collect(tube(pts,.00085+rng()*.0008,24,3),j%7===0?m.darkThread:m.thread,parent,name+' loose warp fibres',false);fiberCount++;
    }
    for(let j=0;j<19;j++){if(j%7===1)continue;const pts=[];for(let k=0;k<10;k++)pts.push(fn(k/9,(j+1+.2*Math.sin(k))/21));collect(tube(pts,.0007,14,3),m.thread,parent,name+' irregular weft',false);fiberCount++;}
  }
  const veils=[[[[-.82,1.11,.54],[-.67,.73,1.14],[-.48,.34,1.47],[-.14,.13,1.47]],.33],[[[-1.15,.13,.90],[-.91,.11,1.26],[-.58,-.17,1.51],[-.32,-.48,1.31]],.31],[[[.62,1.13,.63],[.47,.79,1.11],[.24,.47,1.48],[.12,.24,1.45]],.40],[[[-.88,-.59,1.06],[-.34,-.75,1.41],[.19,-.49,1.49],[.51,-.08,1.31]],.29],[[[.70,-.71,.98],[1.02,-.28,1.09],[1.08,.24,1.06],[.89,.56,.91]],.25],[[[1.13,.91,.13],[1.47,.42,.24],[1.52,-.11,-.18],[1.26,-.61,-.51]],.41],[[[-1.21,.76,.21],[-1.50,.17,-.07],[-1.36,-.37,-.39],[-1.05,-.79,-.62]],.35],[[[.79,.98,-.53],[.63,.57,-1.28],[.19,.16,-1.52],[-.26,-.33,-1.45]],.42],[[[-1.05,.48,-.92],[-.64,.19,-1.43],[-.16,-.29,-1.51],[.39,-.63,-1.19]],.38]];
  veils.forEach(([ps,w],i)=>veil('frayed folded veil '+i,ps,w,i>6?reverse:foil,1060+i*21));
  // Fuzzy red tow: hundreds of fine, individually curving strands with a broad
  // dense center and free wisps. This is not three parallel red wire strokes.
  function tow(name,points,width,count,parent,seed){
    const path=curve(points),rng=random(seed);
    for(let i=0;i<count;i++){
      const offset=(rng()-.5)*width,phase=rng()*TAU,depth=(rng()-.5)*width*.7,ps=[],start=i%5===0?rng()*.09:rng()*.72,end=i%5===0?.88+rng()*.12:Math.min(1,start+.14+rng()*.42);
      for(let j=0;j<17;j++){const t=start+(end-start)*j/16,p=path.getPoint(t),d=path.getTangent(t),n=p.clone().normalize(),side=new T.Vector3().crossVectors(d,n).normalize(),envelope=.40+.60*Math.sin(Math.PI*t);p.addScaledVector(side,offset*envelope+.025*Math.sin(t*31+phase)+.007*Math.sin(t*71+phase)).addScaledVector(n,depth*envelope+.028*Math.sin(t*19+phase*2));ps.push(p);}
      collect(tube(ps,.0006+rng()*.0010,30,3),i%4===0?m.fiberLight:m.fiber,parent,name,false);fiberCount++;
    }
  }
  const towPaths=[[[[-1.40,-.73,.55],[-1.02,-.41,1.04],[-.58,-.14,1.52],[.03,.12,1.62],[.64,.39,1.47],[1.07,.68,.94],[1.29,.83,.48]],.26,190],[[[-1.31,-.83,.35],[-.84,-.69,1.14],[-.24,-.50,1.47],[.45,-.28,1.53],[1.04,-.19,1.18]],.18,95],[[[.74,1.27,.48],[.82,.80,1.10],[.81,.29,1.37],[1.16,-.20,1.0],[1.31,-.59,.44]],.15,75],[[[1.19,.83,-.32],[1.44,.32,-.15],[1.35,-.28,-.55],[.98,-.62,-1.02],[.37,-.62,-1.33]],.18,95],[[[-1.05,.78,-.65],[-.88,.34,-1.17],[-.47,.04,-1.57],[.18,-.18,-1.56],[.80,-.47,-1.11]],.23,150],[[[-1.27,.55,.12],[-1.52,.06,.0],[-1.31,-.48,-.21],[-.83,-.99,-.70]],.17,85]];
  towPaths.forEach(([ps,w,c],i)=>tow('crimson tow bundle '+i,ps,w*.86,Math.round(c*1.18),i>=3?reverse:fiber,1200+i*19));
  // Frayed nests break the tidy ribbon impression. Every short fibre is
  // rooted at a contact zone and curls back into that local material mass.
  const nests=[[-.89,-.43,1.27],[-.42,-.14,1.53],[.56,.41,1.39],[1.05,.49,1.02],[.18,-.49,1.47],[-.48,.08,-1.46],[.62,-.19,-1.35],[1.39,.13,-.21]];
  nests.forEach((point,k)=>{const center=V(...point),q=frame(center,k*.63),rng=random(1420+k);for(let i=0;i<68;i++){const ps=[],angle=rng()*TAU,rx=.035+rng()*.12,ry=.025+rng()*.09,depth=(rng()-.5)*.08;for(let j=0;j<12;j++){const t=j/11,a=angle+t*(1.9+rng()*.08);ps.push(V(Math.cos(a)*rx,Math.sin(a)*ry,depth+.02*Math.sin(t*9+angle)).applyQuaternion(q).add(center));}collect(tube(ps,.00062+rng()*.00052,18,3),i%5?m.fiber:m.fiberLight,k>=5?reverse:fiber,'short curling red nests at material contacts',false);fiberCount++;}});
  // Loop-heavy red jewellery with uneven sizes and axes, closely clustered
  // like the reference glass rings. Selected links disappear into the tow.
  function chain(name,points,size,step,parent=ruby){
    const path=curve(points),count=Math.max(2,Math.floor(path.getLength()/step));chainCount++;
    collect(new T.TubeGeometry(path,count*2,.0018,3,false),m.redThread,parent,'thread through glass rings',false);
    for(let i=0;i<count;i++){
      const t=(i+.2*r())/count,p=path.getPointAt(t),d=path.getTangentAt(t),rr=size*(.67+r()*.64);let g;
      if(i%6!==1){g=new T.TorusGeometry(rr,rr*(.26+r()*.12),5,15);const axis=p.clone().normalize().lerp(d,(r()-.5)*.8).normalize();pose(g,p,axis,r()*TAU);}else{g=new T.SphereGeometry(rr,10,7);g.scale(.86,1.1,.81);g.translate(...p.toArray());}
      collect(g,i%5===0?m.garnet:i%7===2?m.rubyBright:m.ruby,parent,name,false);beadCount++;
    }
  }
  const strands=[
    [[-.72,1.68,.24],[-.58,1.17,.77],[-.46,.70,1.31],[-.10,.28,1.60],[.45,.06,1.59],[.90,-.30,1.23],[1.16,-.91,.73],[1.48,-1.29,.41]],
    [[-1.72,-.84,.24],[-1.32,-.66,.74],[-.93,-.43,1.24],[-.40,-.08,1.63],[.26,.24,1.56],[.89,.70,1.19],[1.58,1.14,.58]],
    [[-1.46,.99,.25],[-1.07,.64,.96],[-.80,.17,1.35],[-.65,-.48,1.25],[-.16,-.91,1.12],[.48,-1.11,.83],[.97,-1.63,.32]],
    [[-1.52,-.36,.21],[-1.18,-.75,.77],[-.55,-.74,1.40],[.15,-.40,1.59],[.83,-.13,1.42],[1.48,.03,.83],[1.79,.09,.36]],
    [[.20,1.61,-.11],[.80,1.20,-.19],[1.22,.79,-.34],[1.47,.27,-.01],[1.52,-.39,.11],[1.14,-.84,-.47],[.75,-1.29,-.79]],
    [[-.99,1.37,-.30],[-.72,.90,-.92],[-.36,.51,-1.41],[.02,.12,-1.59],[.61,-.25,-1.44],[.93,-.81,-1.03],[1.32,-1.29,-.43]],
    [[-1.50,-.67,-.30],[-1.20,-.51,-.83],[-.66,-.10,-1.38],[.06,.28,-1.59],[.68,.64,-1.24],[1.35,.96,-.71]],
    [[-1.48,.34,-.45],[-1.59,-.08,-.07],[-1.32,-.69,.25],[-.99,-1.24,.50]],
    [[-.87,-1.22,.73],[-.50,-.94,1.17],[-.16,-.65,1.44],[.24,-.35,1.59],[.56,-.04,1.41]]
  ];
  strands.forEach((ps,i)=>{chain('uneven glass-ring strand '+i,ps,i%3===0?.025:.0185,i%3===0?.044:.041);if(i<2||i===5){const q=ps.map((p,j)=>V(...p).add(V(.022*Math.sin(j),-.025,.028)));chain('clustered secondary ring run '+i,q,.0155,.043);}});
  // Actual rock banks are placed in a right-hand diagonal fault, with rose
  // inclusions and black shards, not isolated generic pebbles scattered evenly.
  function rock(p,size,kind,parent,seed){const g=new T.IcosahedronGeometry(size,1),pa=g.attributes.position;for(let j=0;j<pa.count;j++){const v=V().fromBufferAttribute(pa,j),n=v.clone().normalize(),f=.77+hash(n.x+seed,n.y,n.z)*.45;v.multiplyScalar(f);pa.setXYZ(j,...v.toArray());}g.computeVertexNormals();g.scale(.65+r()*.62,.58+r()*.65,.27+r()*.33);g.rotateX(r()*TAU);g.rotateY(r()*TAU);g.rotateZ(r()*TAU);g.translate(...p.toArray());collect(g,kind,parent,'irregular granular rock fault');fragmentCount++;}
  const banks=[[[.92,.90,.78],[.99,.55,1.0],[1.05,.08,1.20],[.84,-.43,1.14],[.73,-.80,.95]],[[1.40,.55,-.20],[1.49,.13,-.13],[1.28,-.45,-.60]], [[-.73,.73,-1.0],[-.63,.24,-1.27],[-.76,-.31,-1.16],[-.86,-.64,-.93]]];
  banks.forEach((ps,k)=>{const path=curve(ps);for(let i=0;i<(k===0?110:65);i++){const t=r(),p=path.getPoint(t),n=p.clone().normalize(),side=new T.Vector3().crossVectors(path.getTangent(t),n).normalize();p.addScaledVector(side,(r()-.5)*.27).addScaledVector(n,(r()-.5)*.14);rock(p,.032+r()*.079,i%6===0?m.roseStone:i%5===0?m.darkStone:m.stone,k===2?reverse:gravel,1500+i+k*200);}});
  // Red coral-like branch fragments sit in the gravel and at binding nodes.
  function branch(origin,normal,size,parent,seed){const rng=random(seed),q=frame(normal,rng()*TAU),project=p=>p.applyQuaternion(q).add(origin);const main=[V(0,-size*.5,0),V(.03,size*.08,.01),V(-.01,size*.53,.02)].map(project);collect(tube(main,.014,12,5),m.coral,parent,'small red branching inclusion');for(let j=0;j<7;j++){const y=-.22*size+j*.095*size,s=j%2?1:-1,a=V(0,y,0),b=V(s*size*(.17+rng()*.16),y+size*.10,.015),c=V(s*size*(.24+rng()*.17),y+size*.23,.025);collect(tube([a,b,c].map(project),.010-rng()*.003,10,4),m.coral,parent,'red fork embedded in seam');fragmentCount++;}}
  for(const [lo,la,sz]of [[.93,.52,.36],[.89,-.43,.30],[-.17,-.54,.27],[1.75,.11,.29],[2.77,.17,.37],[-2.49,-.44,.24]]){const p=S(lo,la,1.47);branch(p,p,sz,Math.cos(lo)<0?reverse:gravel,1621+Math.round(lo*21));}
  // Small found-material colour accents remain embedded and subordinate.
  for(const [p,mat,s]of [[[.18,-.57,1.44],m.purpleGlass,.085],[[.54,-.26,1.39],m.blueGlass,.069],[[1.05,.33,1.05],m.olive,.07],[[-.49,-1.02,.95],m.ruby,.064]]){const g=new T.CylinderGeometry(s*.61,s*.57,s*1.9,9);g.rotateZ(.6);g.translate(...p);collect(g,mat,gravel,'small glass and mineral inclusion');fragmentCount++;}
  // Flowers use many small cupped, curled, irregular petals. Dense strawflower
  // heads contrast with translucent skeletonized leaves and empty seed fans.
  function petal(length,width,curl,seed){return grid((u,t)=>{const b=u*2-1,edge=Math.pow(Math.sin(Math.PI*t*.93),.52),w=width*edge*(1+.12*Math.sin(t*31+seed)),x=b*w+.12*width*Math.sin(seed)*t,y=length*t,z=curl*t*t+.34*width*b*b+.07*width*Math.sin(b*17+t*24);return V(x,y,z);},6,10);}
  function flower(p,n,size,kind,parent,seed,tiers=5){
    const rng=random(seed),q=frame(n,rng()*TAU),colors=kind==='ochre'?[m.ochre,m.rustPetal,m.ochre]:kind==='rose'?[m.rose,m.ivory,m.petalBack]:kind==='rust'?[m.rustPetal,m.ochre,m.rose]:[m.ivory,m.petalBack,m.ivory];flowerCount++;
    for(let tier=0;tier<tiers;tier++){
      const count=22+Math.floor(rng()*5)-tier*2,rad=size*.065,len=size*(.89-tier*.10),width=size*(.103-tier*.007);
      for(let i=0;i<count;i++){if(rng()<.06)continue;const a=TAU*i/count+tier*.38+(rng()-.5)*.22,g=petal(len*(.80+rng()*.30),width*(.75+rng()*.43),size*(.045+tier*.030),seed+i*7+tier*41);g.rotateX((rng()-.5)*.29);g.rotateY((rng()-.5)*.24);g.rotateZ(-a);g.translate(Math.sin(a)*rad,Math.cos(a)*rad,size*tier*.039);g.applyQuaternion(q);g.translate(...p.toArray());collect(g,colors[Math.floor(rng()*3)],parent,'dense curled dry petals');petalCount++;}
    }
    for(let i=0;i<47;i++){const a=rng()*TAU,d=Math.sqrt(rng())*size*.18,z=size*(.19-.35*d),point=V(Math.cos(a)*d,Math.sin(a)*d,z).applyQuaternion(q).add(p),g=new T.IcosahedronGeometry(size*(.014+rng()*.019),0);g.scale(.7,1.4,.75);g.translate(...point.toArray());collect(g,m.seed,parent,'tiny dry seed heart');}
    const start=p.clone().multiplyScalar(.83).add(V(-.05,-.12,0));collect(tube([start,p.clone().lerp(start,.40).add(V(.025,0,.02)),p],.0048,13,4),m.stem,parent,'stems buried beneath cloth');
  }
  const blooms=[[-.51,.84,.19,'ochre',1.45],[-.80,.06,.16,'ochre',1.46],[-.52,-.37,.128,'ochre',1.52],[-.20,-.72,.218,'ivory',1.49],[-.46,-.83,.184,'rust',1.46],[.01,-.96,.181,'rose',1.43],[.10,-.61,.13,'ivory',1.47],[-.84,-.58,.092,'rust',1.49],
    [1.48,.55,.169,'ochre',1.46],[1.60,-.43,.189,'ivory',1.45],[1.78,-.62,.124,'rose',1.44],[-1.48,.16,.165,'rust',1.46],[-1.56,-.58,.148,'ochre',1.45],
    [2.57,.69,.190,'ochre',1.46],[2.91,.02,.168,'ivory',1.47],[3.16,-.68,.205,'ivory',1.46],[-2.91,-.86,.151,'rose',1.45],[-2.64,-.45,.171,'rust',1.47],[2.33,-.33,.136,'ochre',1.47],[1.27,-.18,.101,'rose',1.50],[-1.82,.40,.11,'ivory',1.49]];
  blooms.forEach(([lo,la,size,kind,radius],i)=>{const p=S(lo,la,radius),n=Math.cos(lo)>.42?V(Math.sin(lo)*.25,(i%3-1)*.12,1):Math.cos(lo)<-.5?V(Math.sin(lo)*.22,.08,-1):p.clone().normalize();flower(p,n,size,kind,Math.cos(lo)<-.2?reverse:flowers,1800+i*31,i%4===0?6:5);});
  // Broad dried petal skeletons / seed fans, clearly present in the reference.
  function skeleton(p,n,length,width,angle,parent,seed){
    const rng=random(seed),q=frame(n,angle),local=(x,y,z=0)=>V(x,y,z).applyQuaternion(q).add(p);
    collect(tube([local(0,-.08),local(.015,length*.38,.024),local(0,length,.07)],.0018,24,4),m.stem,parent,'skeletonized leaf midrib',false);
    const film=grid((u,t)=>{const s=u*2-1;return V(s*width*Math.sin(t*Math.PI*.91),t*length,.10*s*s*width+.07*t*t);},12,19);film.applyQuaternion(q);film.translate(...p.toArray());collect(film,m.leafFilm,parent,'faint dry membrane between leaf veins',false);
    for(let side of [-1,1])for(let i=0;i<15;i++){
      const t=.08+i*.049,span=width*Math.pow(Math.sin(t*Math.PI*.91),.62),ps=[local(0,t*length,.025*t),local(side*span*.55,(t+.12)*length,.04),local(side*span,(t+.20)*length,.06+.02*rng())];collect(tube(ps,.0010+rng()*.0006,16,3),i%5?m.stem:m.thread,parent,'branching translucent leaf veins',false);fiberCount++;
      if(i===7){const g=petal(length*.22,width*.13,.02,seed+i);g.rotateZ(side*.65);pose(g,ps[1],n,angle);collect(g,m.petalBack,parent,'partial tissue retained on dry vein',false);}
    }
    for(let j=0;j<9;j++){const s=j/8*2-1,ps=[p,local(s*width*.6,length*.6,.02),local(s*width,length,.05)];collect(tube(ps,.00085,20,3),m.darkThread,parent,'fine leaf membrane tracery',false);fiberCount++;}
  }
  for(const [lo,la,len,w,a]of [[-.61,.25,.58,.21,-.63],[-.16,.56,.45,.22,-1.18],[.43,-.57,.61,.15,-.33],[-.93,.55,.36,.15,.35],[1.64,.15,.50,.20,-.58],[2.68,.31,.51,.19,.54],[-2.57,-.18,.49,.16,-.48]]){const p=S(lo,la,1.53);skeleton(p,p,.95*len,w,a,Math.cos(lo)<0?reverse:flowers,2000+Math.round(lo*13));}
  // Thin grass twists hang among the lower petals rather than radial leaves.
  for(const [lo,la]of [[.37,-.57],[-.74,.26],[1.67,-.42],[2.89,-.32]]){
    const p=S(lo,la,1.5),q=frame(p,.4),par=Math.cos(lo)<0?reverse:flowers;
    for(let i=0;i<11;i++){const length=.20+r()*.33,g=grid((u,t)=>{const a=t*5.4+i,rad=.035+.018*Math.sin(t*8+i);return V(Math.sin(a)*rad+(u-.5)*.015,-length*t,Math.cos(a)*rad+.08*t*t);},3,24);g.applyQuaternion(q);g.translate(...p.toArray());collect(g,i%4?m.oldLeaf:m.petalBack,par,'twisted dried grass remnants');}
  }
  flush();
  root.userData={title:'在坠落时',slug:'falling',sceneVersion:'0.29.0',artRevision:14,solidCore:true,bodyRadius:1.12,bodyAxes:[1,1,1],composition:'reference-directed torn silver textiles, diagonal crimson tow, dense glass rings, dry flowers, rock fault and a recessed broken red ground',patchCount,beadCount,petalCount,flowerCount,stitchCount,fragmentCount,chainCount,fiberCount,knotCount:sites.length,structureGroups:groups.length,frontFlowerGroups:4,detailTargets:{threads:[-.29,.11,1.46],flowers:[-.28,-.81,1.17],fault:[.98,.15,1.12]},referenceUse:'The supplied image informs original 3D material relationships and composition. No source image pixels, artist names, external fonts, AI image generation or image-plane replacement.'};
  let meshCount=0,triangleCount=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});Object.assign(root.userData,{meshCount,triangleCount,exportPrimitiveCount:meshCount});let spread=0;
  return{root,groups,ready:Promise.resolve(),setSeparated(value){spread=value;groups.forEach(g=>g.position.fromArray(g.userData.offset).multiplyScalar(value));},setMoment(t){tail.rotation.z=Math.sin(t*.28)*.006;tail.position.y=tail.userData.offset[1]*spread-Math.sin(t*.37)*.008;},dispose(){owned.forEach(g=>g.dispose());disposeMaterials();}};
}
