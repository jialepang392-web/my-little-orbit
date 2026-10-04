import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials,random} from './materials.js?v=0310';
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
function tube(ps,r=.002,n=24,s=3){return new T.TubeGeometry(curve(ps),r<.0012?Math.min(n,10):r<.0017?Math.min(n,14):n,r,s,false);}
const hash=(x,y,z)=>{const q=Math.sin(x*13.17+y*51.83+z*27.11)*43847.2;return q-Math.floor(q);};

export function makeFalling(){
  const root=new T.Group();root.name='在坠落时 / Woven through the fall';const{m,dispose:disposeMaterials}=makeMaterials(),r=random(290930),groups=[],owned=new Set(),buckets=new Map();
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
    const rng=random(seed),cutsL=Array.from({length:9},()=>.87+rng()*.18),cutsR=Array.from({length:9},()=>.84+rng()*.23),q=frame(n,a),origin=p.isVector3?p.clone():V(...p);
    const sample=(xs,t)=>{const i=Math.min(7,Math.floor(t*8)),f=t*8-i;return T.MathUtils.lerp(xs[i],xs[i+1],f*f*(3-2*f));};
    const f=(u,t)=>{const b=u*2-1,v=t*2-1,edge=sample(b<0?cutsL:cutsR,t),end=1-taper*(Math.max(0,v)*.9+Math.max(0,-v)*.4),xx=b*w*.5*edge*end+.009*w*Math.sin(t*137+seed)*Math.pow(Math.abs(b),7),yy=v*h*.5+(u-.5)*h*.12+(Math.sin(u*81+seed)+.4*Math.sin(u*171))*h*.012*Math.pow(Math.abs(v),10);
      const z=crease*(.56*Math.sqrt((b+.22*v)**2+.04)-.20+.36*Math.sqrt((v-b*.63+.15)**2+.025))+.005*Math.sin(t*21+u*9+seed)+.002*Math.sin(t*53-u*23)+curl*Math.pow(Math.max(0,v),3)-wrap*(xx*xx+yy*yy);return V(xx,yy,z);};
    const g=grid(f,10,24,thickness);g.applyQuaternion(q);g.translate(...origin.toArray());collect(g,mat,parent,name);patchCount++;
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
  for(const [i,lo,la,w,h,a]of [[0,-.64,.80,.86,.70,-.22],[1,.57,.64,.73,.75,.43],[2,-.77,-.56,.80,.72,.22],[3,.36,-.96,.91,.54,-.20],[4,1.72,.51,.75,.70,.50],[5,2.69,.66,.88,.68,-.43],[6,3.11,-.69,.91,.67,.30], [7,-1.72,-.45,.77,.85,-.46]])patch('broken red backing '+i,lo,la,w*.86,h*.90,a,m.redCloth,core,{radius:1.25,seed:30+i,crease:.04,curl:.045,taper:.12});
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
    for(let j=0;j<4;j++)patch('folded remnant in cloth knot '+i+'-'+j,lo+(r()-.5)*.26,la+(r()-.5)*.38,.070+r()*.10,.25+r()*.32,a+(r()-.5)*1.6,j%3?m.silverDark:m.black,clothParent,{radius:1.37+r()*.06,seed:400+i*11+j,crease:.050,curl:.075,taper:.32});
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
  // The old broad flat plaque made the entire sculpture read as a disc.
  // Lettering is now a small bent remnant, held in a deep material recess.
  sheet('bent inscription inside the seam',V(-.02,.19,1.70),V(-.12,.06,1),.31,.48,-.40,m.darkPrint,label,{seed:980,crease:.09,curl:.10,taper:.23,wrap:.44});
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
      for(let j=0;j<17;j++){const t=start+(end-start)*j/16,p=path.getPoint(t),d=path.getTangent(t),n=p.clone().normalize(),side=new T.Vector3().crossVectors(d,n).normalize(),envelope=.35+.65*Math.sin(Math.PI*t);p.addScaledVector(side,offset*envelope+.048*Math.sin(t*24+phase)+.017*Math.sin(t*63+phase)).addScaledVector(n,depth*envelope+.042*Math.sin(t*17+phase*2));ps.push(p);}
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
      if(i%7!==1){g=new T.TorusGeometry(rr,rr*(.30+r()*.20),6,16);const stretch=.78+r()*.47;g.scale(stretch,1/stretch,.79+r()*.34);g.rotateX((r()-.5)*.8);const axis=p.clone().normalize().lerp(d,(r()-.5)*1.15).normalize();pose(g,p,axis,r()*TAU);}else{g=new T.SphereGeometry(rr,10,7);g.scale(.86,1.1,.81);g.translate(...p.toArray());}
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
  strands.forEach((ps,i)=>{
    // Pull straight antennae back into hooked hanging ends. Interior arcs
    // alternate deep and shallow attachments instead of one frontal net.
    const points=ps.map((p,j)=>{const v=V(...p);if(j===0||j===ps.length-1){v.multiplyScalar(i<2?1.04:.92);v.y-=j===ps.length-1?.15:.04;v.z+=Math.sign(v.z)*.06;}else if(Math.abs(v.z)>.8){v.z+=Math.sign(v.z)*(.065+.13*Math.sin(j*1.7+i));v.x+=.07*Math.sin(j+i*.8);}return v;});
    chain('uneven glass-ring strand '+i,points,i%3===0?.024:.0185,i%3===0?.044:.041);
    if(i<2||i===5){const q=points.map((p,j)=>p.clone().add(V(.022*Math.sin(j),-.025,.028)));chain('clustered secondary ring run '+i,q,.0155,.043);}
  });
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
  function petal(length,width,curl,seed){return grid((u,s)=>{const t=(1-Math.cos(Math.PI*s))*.5,b=u*2-1,edge=Math.sin(Math.PI*s),w=width*edge*(1+.045*Math.sin(t*21+seed)),x=b*w+.14*width*Math.sin(seed)*t,y=length*t,z=curl*Math.sin(t*Math.PI*.76)+.36*width*b*b*edge+.04*width*Math.sin(b*10+t*15)*edge;return V(x,y,z);},6,13);}
  function flower(p,n,size,kind,parent,seed,tiers=5){
    const rng=random(seed),q=frame(n,rng()*TAU),colors=kind==='ochre'?[m.ochre,m.rustPetal,m.ochre]:kind==='rose'?[m.rose,m.ivory,m.petalBack]:kind==='rust'?[m.rustPetal,m.ochre,m.rose]:[m.ivory,m.petalBack,m.ivory];flowerCount++;
    for(let tier=0;tier<tiers;tier++){
      const count=19+Math.floor(rng()*5)-tier,rad=size*.048,len=size*(.90-tier*.107),width=size*(.161-tier*.012);
      for(let i=0;i<count;i++){if(rng()<.07)continue;const a=TAU*i/count+tier*.57+(rng()-.5)*.25,g=petal(len*(.85+rng()*.25),width*(.78+rng()*.45),size*(.10+tier*.022),seed+i*7+tier*41);g.rotateX((rng()-.5)*.33);g.rotateY((rng()-.5)*.21);g.rotateZ(-a);g.translate(Math.sin(a)*rad,Math.cos(a)*rad,size*tier*.025);g.applyQuaternion(q);g.translate(...p.toArray());collect(g,colors[Math.floor(rng()*3)],parent,'rounded cupped strawflower petals');petalCount++;}
    }
    for(let i=0;i<47;i++){const a=rng()*TAU,d=Math.sqrt(rng())*size*.18,z=size*(.19-.35*d),point=V(Math.cos(a)*d,Math.sin(a)*d,z).applyQuaternion(q).add(p),g=new T.IcosahedronGeometry(size*(.014+rng()*.019),0);g.scale(.7,1.4,.75);g.translate(...point.toArray());collect(g,m.seed,parent,'tiny dry seed heart');}
    const start=p.clone().multiplyScalar(.83).add(V(-.05,-.12,0));collect(tube([start,p.clone().lerp(start,.40).add(V(.025,0,.02)),p],.0048,13,4),m.stem,parent,'stems buried beneath cloth');
  }
  const blooms=[[-.51,.84,.19,'ochre',1.55],[-.80,.06,.16,'ochre',1.53],[-.52,-.37,.128,'ochre',1.58],[-.20,-.65,.270,'ivory',1.71],[-.43,-.74,.190,'rust',1.67],[.03,-.83,.205,'rose',1.69],[.11,-.57,.142,'ivory',1.72],[-.84,-.58,.092,'rust',1.49],
    [1.48,.55,.169,'ochre',1.46],[1.60,-.43,.189,'ivory',1.45],[1.78,-.62,.124,'rose',1.44],[-1.48,.16,.165,'rust',1.46],[-1.56,-.58,.148,'ochre',1.45],
    [2.57,.69,.190,'ochre',1.46],[2.91,.02,.168,'ivory',1.47],[3.16,-.68,.205,'ivory',1.46],[-2.91,-.86,.151,'rose',1.45],[-2.64,-.45,.171,'rust',1.47],[2.33,-.33,.136,'ochre',1.47],[1.27,-.18,.101,'rose',1.50],[-1.82,.40,.11,'ivory',1.49]];
  blooms.forEach(([lo,la,size,kind,radius],i)=>{const nearFlowerPositions={3:[-.23,-.72,1.65],4:[-.53,-.88,1.44],5:[.04,-.94,1.43],6:[.06,-.61,1.66]},p=nearFlowerPositions[i]?V(...nearFlowerPositions[i]):S(lo,la,radius),n=Math.cos(lo)>.42?V(Math.sin(lo)*.25,(i%3-1)*.12,1):Math.cos(lo)<-.5?V(Math.sin(lo)*.22,.08,-1):p.clone().normalize();flower(p,n,size,kind,Math.cos(lo)<-.2?reverse:flowers,1800+i*31,i%4===0?6:5);});
  // Broad dried petal skeletons / seed fans, clearly present in the reference.
  function skeleton(p,n,length,width,angle,parent,seed){
    const rng=random(seed),q=frame(n,angle),local=(x,y,z=0)=>V(x,y,z).applyQuaternion(q).add(p);
    collect(tube([local(0,-.08),local(.015,length*.38,.024),local(0,length,.07)],.0018,24,4),m.stem,parent,'skeletonized leaf midrib',false);
    const film=grid((u,t)=>{const s=u*2-1;return V(s*width*Math.sin(t*Math.PI*.91),t*length,.10*s*s*width+.07*t*t);},12,19);film.applyQuaternion(q);film.translate(...p.toArray());collect(film,m.leafFilm,parent,'faint dry membrane between leaf veins',false);
    for(let side of [-1,1])for(let i=0;i<15;i++){
      const t=.08+i*.049+(rng()-.5)*.025,span=width*Math.pow(Math.sin(t*Math.PI*.91),.62)*(.83+rng()*.25),ps=[local(0,t*length,.025*t),local(side*span*.55,(t+.12)*length,.04),local(side*span,(t+.20)*length,.06+.02*rng())];collect(tube(ps,.0010+rng()*.0006,16,3),i%5?m.stem:m.thread,parent,'branching translucent leaf veins',false);fiberCount++;
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
  // Sculptural packets: folded cavities, return lips, mineral ribs and
  // rooted flowers occupy genuinely different depths over the whole mass.
  // No nonuniform root scaling, billboard or camera-facing shell is used.
  const volumes=[
    [-.42,.42,.72,-.57,1.40], [.21,.47,.70,.59,1.42], [.68,.18,.61,-.42,1.41],
    [-.37,-.06,.64,.43,1.48], [.17,-.19,.75,-.66,1.47], [-.55,-.50,.64,.51,1.43],
    [.26,-.64,.64,-.28,1.43], [-1.03,.03,.55,.73,1.39], [.04,.94,.52,-.61,1.40],
    [1.28,.49,.63,.66,1.40], [1.63,.03,.77,-.49,1.43], [1.39,-.48,.71,.38,1.41],
    [-1.41,.40,.67,-.65,1.42], [-1.70,-.12,.73,.49,1.42], [-1.39,-.63,.57,-.39,1.41],
    [2.19,.46,.67,-.60,1.43], [2.66,.23,.75,.51,1.46], [3.18,.54,.65,-.43,1.43],
    [-2.61,.06,.73,.69,1.43], [3.06,-.31,.77,-.52,1.47], [2.48,-.64,.62,.36,1.43],[-2.64,-.56,.69,-.56,1.43],
    [.25,1.25,.49,.21,1.46], [2.68,1.24,.49,-.40,1.46], [-1.61,1.18,.43,.73,1.45],
    [-.23,-1.25,.52,-.39,1.48], [2.57,-1.24,.50,.44,1.46]
  ];
  function foldedVolume(lo,la,size,angle,radius,index){
    const origin=S(lo,la,radius),q=frame(origin,angle),rear=Math.cos(lo)<-.23,par=rear?reverse:textile,rng=random(300100+index*53);
    const project=p=>p.applyQuaternion(q).add(origin),baseZ=.0;
    // Curved C-shaped interleaves bend from a buried foot to an outward lip
    // and return towards the mass; the intermediate bulge casts real shadows.
    for(let k=0;k<5;k++){
      const h=size*(.78+rng()*.42),w=size*(.32+rng()*.20),shift=(k-2)*size*.085,peak=size*(.26+rng()*.12),turn=(k-2)*.37+(rng()-.5)*.42;
      const foldKnots=[-.025,.12+rng()*.10,.39,.54,.30+rng()*.10,.09,-.035];
      const ridge=t=>{const a=Math.min(5,Math.floor(t*6)),f=t*6-a;return T.MathUtils.lerp(foldKnots[a],foldKnots[a+1],f*f*(3-2*f));};
      const fn=(u,t)=>{const b=u*2-1,v=t*2-1,cut=.89-.16*Math.max(0,v)+.043*Math.sin(t*19+index+k)+.015*Math.sin(t*61+k),xx=b*w*.5*cut+shift+.055*size*Math.sin(t*7+k),yy=(t-.50)*h+.008*size*Math.sin(u*45+index)*Math.pow(Math.abs(v),7);
        const z=baseZ+peak*ridge(t)*(1.25-.44*b*b)+.047*size*Math.sqrt((b-v*.61+.15)**2+.04)+.015*size*Math.sin(t*13+u*9+index)-.028*size*b*b+.009*size*Math.sin(t*39+u*21+k);
        const x=xx*Math.cos(turn)-yy*Math.sin(turn),y=xx*Math.sin(turn)+yy*Math.cos(turn);return V(x,y,z);};
      const mat=k===0?m.black:k===3?m.silverDark:index%5===2&&k===4?m.dustRose:m.silverCloth,g=grid(fn,10,24,.003);g.applyQuaternion(q);g.translate(...origin.toArray());collect(g,mat,par,'soft raised ragged pleats around a material socket');patchCount++;
      const world=(u,t)=>project(fn(u,t));
      const edge=[];for(let j=0;j<=25;j++)edge.push(world(.99,j/25));collect(tube(edge,.0015,29,3),k===1?m.edgeSilver:m.darkThread,par,'thin frayed edges on raised pleats',false);
      for(let j=0;j<11;j++){const t=.12+rng()*.72,p=world(k%2,t),end=p.clone().add(V((rng()-.5)*.038,.016+rng()*.032,(rng()-.5)*.028).applyQuaternion(q));collect(tube([p,p.clone().lerp(end,.5).add(V(.002,0,.007)),end],.00085,7,3),m.thread,par,'loose fibres on raised folded lips',false);fiberCount++;}
      if(k===1||k===4)for(let j=0;j<4;j++){const a=world(.17,.20+j*.13),b=world(.81,.20+j*.13);collect(tube([a,a.clone().lerp(b,.5).addScaledVector(origin.clone().normalize(),.018),b],.0018,8,3),j%2?m.redThread:m.thread,par,'binding stitches across return folds',false);stitchCount++;}
    }
    // Ragged graphite / silver-rose interleaves bridge the packet to its
    // neighbours at a different depth and orientation, not parallel plates.
    for(let k=0;k<4;k++){
      const p=project(V((k-1.5)*size*.12,(k%2?-.2:.15)*size,.14*size)),n=origin.clone().normalize().add(V(.27*Math.sin(k+index),-.15,.07)).normalize();
      sheet('short folded interleaf in relief packet',p,n,size*(.18+rng()*.10),size*(.40+rng()*.17),angle+(k-1.5)*.81,k===1?m.dustRose:k===2?m.ash:k===3?m.silver:m.black,par,{seed:301100+index*17+k,crease:.045,curl:.065,taper:.29,fray:8});
    }
    // Small chipped mass interrupts the large textile planes. Facets have
    // thick bodies and shadows; pink mineral joins black mica and silver.
    for(let k=0;k<8;k++){
      const p=project(V((rng()-.5)*size*.25,(rng()-.5)*size*.52,size*(.18+rng()*.12)));
      rock(p,size*(.055+rng()*.069),k%4===0?m.roseStone:k%3===0?m.darkStone:m.stone,rear?reverse:gravel,302000+index*13+k);
    }
    // Not all packets contain the same ornament: partial flowers, a folded
    // membrane, wire hitch and embedded metallic pin vary by material node.
    if(index%3===0||index===4){const p=project(V(-size*.18,-size*.20,size*.36)),n=origin.clone().normalize().add(V(.12,-.16,.11)).normalize();flower(p,n,size*(index===4?.21:.17),index%2?'rose':index===4?'ivory':'ochre',rear?reverse:flowers,303000+index*31,4);}
    if(index%4===1){const p=project(V(-size*.08,size*.01,size*.39));skeleton(p,origin.clone().normalize(),size*.48,size*.16,angle+.64,rear?reverse:flowers,303900+index);}
    if(index%2===0){const ps=[project(V(-size*.31,size*.25,0)),project(V(-size*.05,size*.18,size*.45)),project(V(size*.22,-size*.17,size*.32)),project(V(size*.36,-size*.36,-size*.03))];chain('glass rings sinking behind raised folds',ps,.014+size*.006,.043,rear?reverse:ruby);tow('short tangled crimson ligature',ps,size*.11,23,rear?reverse:fiber,304000+index);}
    const wire=[];for(let k=0;k<15;k++){const t=k/14,az=t*TAU*1.08;wire.push(project(V(size*(.13+Math.cos(az)*.063),size*(-.05+Math.sin(az)*.12),size*(.32+.075*Math.sin(az+.4)))));}collect(tube(wire,.0018,25,3),index%3?m.thread:m.redThread,par,'asymmetric seam hitch',false);
  }
  volumes.forEach(([lo,la,size,angle,radius],i)=>foldedVolume(lo,la,size*(Math.abs(Math.cos(lo))<.45?.87:1),angle,radius,i));
  // Small splintered quills, seed husks and torn leaf films articulate the
  // central depth transitions without opening the overall aggregate.
  for(const [lo,la,sz]of [[-.63,.50,.27],[.47,.40,.25],[-.33,-.26,.23],[.67,-.44,.26],[1.66,.11,.24],[2.77,-.25,.28],[-2.57,.33,.23]]){
    const p=S(lo,la,1.62),q=frame(p,lo*.8),par=Math.cos(lo)<-.2?reverse:flowers;
    for(let i=0;i<6;i++){
      const len=sz*(.65+r()*.55),base=p.clone().add(V((i-3)*.027,-.04,0).applyQuaternion(q)),tip=base.clone().add(V((i-2)*.042,len,.03).applyQuaternion(q));collect(tube([base,base.clone().lerp(tip,.55).addScaledVector(p.clone().normalize(),.05),tip],.0016,17,3),m.stem,par,'embedded bristled seed spines',false);
      for(let j=0;j<4;j++){const t=.34+j*.15,pos=base.clone().lerp(tip,t),g=new T.IcosahedronGeometry(.013+r()*.008,0);g.scale(.75,1.7,.64);g.translate(...pos.toArray());collect(g,j%2?m.oldLeaf:m.seed,par,'uneven dried husks along the quills',false);fragmentCount++;}
    }
  }
  // Convex nested folios close the broad, apparently empty central fields.
  // They are local irregular masses made of overlapping curved fragments,
  // not a uniformly scaled sphere or a paper disc on the front.
  const folios=[[.02,.11,.57,.43],[.66,-.37,.43,.33],[-.57,.38,.44,.32],[1.54,.02,.57,.39],[-1.55,-.05,.56,.38],[3.05,.09,.56,.42],[-2.54,-.35,.43,.33]];
  folios.forEach(([lo,la,size,depth],index)=>{
    const center=S(lo,la,1.28),q=frame(center,index*.61),par=Math.cos(lo)<-.23?reverse:textile,rng=random(308010+index*131);
    const project=p=>p.applyQuaternion(q).add(center);
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){
      const x0=-.98+col*.64+(rng()-.5)*.21,y0=-.69+row*.67+(rng()-.5)*.20,ww=.69+rng()*.22,hh=.83+rng()*.25,rad=1+(rng()-.5)*.14,skew=(rng()-.5)*1.65;
      const fn=(u,t)=>{const b=u*2-1,v=t*2-1,xx=b*ww*.5,yy=v*hh*.5,lon=x0+xx*Math.cos(skew)-yy*Math.sin(skew)+.021*Math.sin(t*25+index)*Math.pow(Math.abs(b),6),lat=y0+xx*Math.sin(skew)+yy*Math.cos(skew)+.019*Math.sin(u*23+col)*Math.pow(Math.abs(v),6),wrinkle=.043*Math.sqrt((b+v*.53)**2+.04)+.016*Math.sin(t*13+u*9+col)+.008*Math.sin(t*35-u*21+index),rr=rad+wrinkle+.10*Math.pow(Math.max(0,b),4)+.04*Math.pow(Math.abs(v),7);return project(V(size*rr*Math.cos(lat)*Math.sin(lon),size*rr*Math.sin(lat),depth*rr*Math.cos(lat)*Math.cos(lon)));};
      const mat=(row+col+index)%7===0?m.black:(row*3+col+index)%5===0?m.ash:col%3?m.silverDark:m.silverCloth;
      collect(grid(fn,10,17),mat,par,'crumpled skewed fragments with deep independent cut edges');patchCount++;
      if(col%2){const ps=[];for(let j=0;j<14;j++)ps.push(fn(1,j/13));collect(tube(ps,.0016,19,3),m.darkThread,par,'broken folds on the convex folio',false);}
      for(let k=0;k<15;k++){const p=fn(k%2,rng()),n=center.clone().normalize(),end=p.clone().add(V((rng()-.5)*.08,(rng()-.5)*.07,(rng()-.5)*.05));collect(tube([p,p.clone().lerp(end,.5).addScaledVector(n,.014),end],.0007,8,3),m.thread,par,'lifted fibres on inner curved scraps',false);fiberCount++;}
    }
    const ps=[project(V(-size*.83,size*.42,depth*.38)),project(V(-size*.34,size*.16,depth*1.03)),project(V(size*.16,-size*.06,depth*1.12)),project(V(size*.73,-size*.44,depth*.75)),project(V(size*.91,-size*.64,depth*.10))];
    chain('ruby bindings pass over convex volume then reenter seam',ps,.017,.046,Math.cos(lo)<-.23?reverse:ruby);
    tow('crimson felt around convex folio',ps,size*.13,34,Math.cos(lo)<-.23?reverse:fiber,309000+index*17);
    const torn=[project(V(-size*.61,size*.62,depth*.22)),project(V(-size*.37,size*.24,depth*.99)),project(V(-size*.01,-size*.26,depth*1.10)),project(V(size*.38,-size*.72,depth*.47))];veil('mesh clasp hugging rounded folio',torn,size*.24,par,309500+index*31);
    if(index<3||index===5){const p=project(V(size*.29,-size*.21,depth*.94));flower(p,center.clone().normalize().add(V(.1,.1,.2)).normalize(),index===0?.118:.09,index===0?'ivory':index===5?'rose':'rust',Math.cos(lo)<-.23?reverse:flowers,309900+index*37,4);}
  });
  // Unequal small fold crossings break up the main mass; the near material
  // actually covers the distant layer and interrupts its silhouette.
  for(const [p,n,w,h,a,mat]of [[[-.24,.37,1.72],[-.2,.2,1],.13,.61,-.71,m.black],[[.16,.13,1.68],[.15,.1,1],.16,.47,.41,m.silverCloth],[[-.19,-.15,1.70],[-.1,-.1,1],.12,.40,-.48,m.silver],[[.42,-.29,1.64],[.3,-.15,1],.11,.46,.61,m.dustRose]])sheet('cross-layer remnant at the foreground crest',V(...p),V(...n),w,h,a,mat,textile,{seed:311000+Math.round(p[0]*100),crease:.065,curl:.065,taper:.5,fray:14});
  skeleton(V(-.55,-.07,1.75),V(-.22,.1,1),.68,.27,-.51,flowers,312501);
  skeleton(V(.42,-.40,1.65),V(.2,-.1,1),.51,.21,.39,flowers,312511);
  // Broad, papery, partly skeletonized calyces are the quiet upper counterpart
  // to the lower strawflower cluster. Their branching ribs support real skins.
  function calyx(origin,normal,size,angle,parent,seed){
    const rng=random(seed),orientation=frame(normal,angle),project=p=>p.applyQuaternion(orientation).add(origin);
    for(let k=0;k<6;k++){
      const az=TAU*k/6+(rng()-.5)*.58,len=size*(.56+rng()*.47),width=size*(.13+rng()*.15),curl=size*(-.04+rng()*.51),lean=(rng()-.5)*size*.26;
      const local=(u,t)=>{const b=u*2-1,edge=Math.pow(Math.max(0,Math.sin(t*Math.PI)),.42),bite=1-.43*Math.exp(-(((t-(.42+k*.053))/.09)**2))*Math.pow(Math.max(0,k%2?b:-b),4),x=b*width*edge*(1+.16*Math.sin(t*14+k))*bite+lean*t*t,y=len*t+size*.023*Math.sin(u*16+k)*t*t,z=curl*t*t+size*.14*b*b*Math.sin(t*Math.PI)+size*.035*Math.sin(t*9+u*6+k);return V(x,y,z).applyAxisAngle(V(0,0,1),az);};
      const skin=grid(local,9,18);skin.applyQuaternion(orientation);skin.translate(...origin.toArray());collect(skin,m.dryMembrane,parent,'rose-grey translucent dried calyx membrane',false);patchCount++;
      const world=(u,t)=>project(local(u,t));
      const mid=[];for(let j=0;j<=12;j++)mid.push(world(.5,j/12));collect(tube(mid,.0018,16,3),m.stem,parent,'central rib of dried flower',false);
      for(let side of [0,1])for(let j=0;j<9;j++){
        const t=.12+j*.082+(rng()-.5)*.02,a=world(.5,t),b=world(side?.78:.22,t+.075),c=world(side,Math.min(.98,t+.14));
        collect(tube([a,b,c],.0008,9,3),m.stem,parent,'branching rib on dry calyx',false);fiberCount++;
        if(j%2===0){const d=world(side?.91:.09,Math.min(.98,t+.20));collect(tube([b,b.clone().lerp(d,.55),d],.0006,6,3),m.darkThread,parent,'minor rib network',false);fiberCount++;}
      }
      for(let side of [0,1]){const ps=[];for(let j=1;j<17;j++)ps.push(world(side,j/17));collect(tube(ps,.00085,18,3),m.stem,parent,'curled calyx edge',false);fiberCount++;}
    }
    const center=new T.IcosahedronGeometry(size*.065,1);center.scale(1,.8,.6);center.translate(...origin.toArray());collect(center,m.seed,parent,'dry calyx heart');
    const foot=origin.clone().multiplyScalar(.84).add(V(.03,-.08,0));collect(tube([foot,foot.clone().lerp(origin,.6).add(V(.02,0,.025)),origin],.004,13,4),m.stem,parent,'calyx stem disappearing into material seam');
  }
  calyx(V(-.52,.50,1.67),V(-.25,.25,1),.34,-.53,flowers,313101);
  calyx(V(-.61,-.08,1.70),V(-.25,.03,1),.29,.61,flowers,313111);
  calyx(V(.26,.70,1.57),V(.2,.2,1),.30,-.17,flowers,313121);
  calyx(S(1.51,.24,1.70),S(1.51,.24,1),.25,.53,flowers,313131);
  calyx(S(2.95,.30,1.71),S(2.95,.30,1),.30,-.29,reverse,313141);
  // Red backing and long cloth tongues reappear at the torn outer seams.
  // Each tongue has a buried root, a returning fold and individually frayed edges.
  for(const [p,n,w,h,a]of [[[-.63,1.15,.64],[-.3,.7,.7],.58,.46,.42],[[.48,-1.27,.62],[.2,-.7,.7],.69,.34,-.43],[[1.22,-.41,.44],[.8,-.2,.5],.35,.62,.42]])sheet('red cloth visible between torn peripheral layers',V(...p),V(...n),w,h,a,m.redCloth,core,{seed:314000+Math.round(p[0]*100),crease:.07,curl:.10,taper:.20,wrap:.19,fray:5});
  for(const [p,n,w,h,a]of [[[-.62,1.30,.69],[-.3,.4,1],.16,.79,.48],[[.58,-1.27,.71],[.2,-.5,1],.22,.98,.38],[[-1.13,-.80,.75],[-.7,-.4,1],.20,.94,-1.05],[[1.22,.48,.40],[.8,.3,.7],.14,.81,-.78]])sheet('long torn silver textile tongue',V(...p),V(...n),w,h,a,m.silverCloth,tail,{seed:314900+Math.round(p[0]*100),crease:.045,curl:.14,taper:.32,wrap:.09,fray:32});
  // Pale seed umbels suggest the lyric's brief flare while remaining botanical.
  for(const [p,n,sz]of [[[-.12,.62,1.80],[0,.1,1],.115],[[.17,.29,1.85],[0,.1,1],.086],[[.59,-.55,1.42],[.3,-.2,1],.087]]){
    const center=V(...p),q=frame(V(...n),r()*TAU);
    for(let k=0;k<25;k++){const a=TAU*k/25,rr=sz*(.70+r()*.3),end=V(Math.sin(a)*rr,Math.cos(a)*rr,.025+r()*.025).applyQuaternion(q).add(center);collect(tube([center,center.clone().lerp(end,.6).add(V(0,.008,.009)),end],.0013,7,3),m.paleSeed,flowers,'fine pale seed flare',false);const g=new T.SphereGeometry(.0036,5,3);g.translate(...end.toArray());collect(g,m.ivory,flowers,'tiny pale seed tips',false);fiberCount++;}
  }
  flush();
  // Measure real occupied depth, not the camera or an inflated empty bounding box.
  const dimensions=new T.Box3().setFromObject(root).getSize(V()).toArray();
  root.userData={title:'在坠落时',slug:'falling',sceneVersion:'0.31.0',artRevision:16,solidCore:true,bodyRadius:1.12,bodyAxes:[1,1,1],volumetricNodes:volumes.length+folios.length,convexFolioMasses:folios.length,dimensions,rootScale:[1,1,1],composition:'layered frayed textile folds, irregular ruby glass ligatures, translucent dried leaves and cupped strawflowers; gathered weak-sphere volume with independent side and back interleaves',patchCount,beadCount,petalCount,flowerCount,stitchCount,fragmentCount,chainCount,fiberCount,knotCount:sites.length,structureGroups:groups.length,frontFlowerGroups:6,detailTargets:{threads:[-.17,.17,1.70],flowers:[-.21,-.73,1.58],fault:[.87,.13,1.39]},referenceUse:'The supplied image and lyrics inform original 3D material relationships, composition and the persistence of a red thread through damaged matter. No source image pixels, artist names, external fonts, AI image generation or image-plane replacement.'};
  let meshCount=0,triangleCount=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});Object.assign(root.userData,{meshCount,triangleCount,exportPrimitiveCount:meshCount});let spread=0;
  return{root,groups,ready:Promise.resolve(),setSeparated(value){spread=value;groups.forEach(g=>g.position.fromArray(g.userData.offset).multiplyScalar(value));},setMoment(t){tail.rotation.z=Math.sin(t*.28)*.006;tail.position.y=tail.userData.offset[1]*spread-Math.sin(t*.37)*.008;},dispose(){owned.forEach(g=>g.dispose());disposeMaterials();}};
}
