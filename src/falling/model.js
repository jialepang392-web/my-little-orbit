import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials,random} from './materials.js?v=0270';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),TAU=Math.PI*2;
const S=(lon,lat,r=1.3)=>V(r*Math.cos(lat)*Math.sin(lon),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(lon));
const curve=pts=>new T.CatmullRomCurve3(pts.map(p=>p.isVector3?p:V(...p)));
const tube=(pts,r=.003,n=28,s=4)=>new T.TubeGeometry(curve(pts),n,r,s,false);
function grid(fn,nu=24,nv=32,thickness=0,radial=true){
  const xyz=[],uv=[],face=[],back=[],edge=[],count=(nu+1)*(nv+1);
  for(let side=0;side<(thickness?2:1);side++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const p=fn(i/nu,j/nv);if(side){if(radial)p.addScaledVector(p.clone().normalize(),-thickness);else p.z-=thickness;}xyz.push(...p.toArray());uv.push(i/nu,j/nv);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;face.push(a,b,d,a,d,c);if(thickness)back.push(a+count,d+count,b+count,a+count,c+count,d+count);}
  if(thickness){const rim=[];for(let i=0;i<=nu;i++)rim.push(i);for(let j=1;j<=nv;j++)rim.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)rim.push(nv*(nu+1)+i);for(let j=nv-1;j>0;j--)rim.push(j*(nu+1));for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];edge.push(a,a+count,b+count,a,b+count,b);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([...face,...back,...edge]);g.computeVertexNormals();if(thickness){g.addGroup(0,face.length,0);g.addGroup(face.length,back.length+edge.length,1);}return g;
}
function pose(g,p,n,roll=0){const q=new T.Quaternion().setFromUnitVectors(V(0,0,1),n.clone().normalize()).multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),roll));g.applyQuaternion(q);g.translate(...p.toArray());return g;}
function petal(length,width,lift,seed){const r=random(seed),lean=(r()-.5)*.26,curl=.14+r()*.25;return grid((a,t)=>{const u=a*2-1,w=width*Math.pow(Math.sin(t*Math.PI*.78),.64)*(1+u*lean),tip=.85+.15*Math.sqrt(Math.max(0,1-u*u));return V(u*w+lean*width*t*t,t*length*tip,lift*Math.sin(t*Math.PI*.67)+u*u*width*curl*t+Math.pow(t,6)*width*.18*Math.sin(u*4+seed)+.0014*Math.sin(t*17+u*5));},12,20);}

export function makeFalling(){
  const root=new T.Group();root.name='在坠落时 / A held fall';const{m,dispose:disposeMaterials}=makeMaterials(),r=random(273011),owned=new Set(),groups=[];
  function group(name,offset){const g=new T.Group();g.name=name;g.userData.offset=offset;root.add(g);groups.push(g);return g;}
  function add(name,g,mat,parent,shadow=true){owned.add(g);const o=new T.Mesh(g,mat);o.name=name;o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
  function batch(name,gs,mat,parent,shadow=false){if(!gs.length)return;const g=mergeGeometries(gs,false);gs.forEach(p=>p.dispose());return add(name,g,mat,parent,shadow);}
  const core=group('01 / 酒红实体',[0,0,0]),cloth=group('02 / 被收拢的织物',[0,-.035,.018]),black=group('03 / 黑纸的肩与转折',[-.05,.04,.075]),silver=group('04 / 两处银箔断口',[.06,.02,.085]),gauze=group('05 / 层间银网',[.02,.03,.13]),botanic=group('06 / 两处干花',[-.035,-.03,.11]),ruby=group('07 / 两道红珠',[.025,-.04,.10]),back=group('08 / 背面的折页',[-.025,.03,-.11]),inscription=group('09 / 收起的铭痕',[0,.02,.09]),tail=group('10 / 一角悬垂',[.03,-.07,.025]);
  const ball=new T.SphereGeometry(1.275,112,80),position=ball.attributes.position;
  for(let i=0;i<position.count;i++){const p=V().fromBufferAttribute(position,i),n=p.clone().normalize(),d=.012*Math.sin(n.x*9+n.z*6)*Math.sin(n.y*11-n.z*4)+.003*Math.sin(n.x*27+n.y*19);p.multiplyScalar(1+d/1.275);position.setXYZ(i,...p.toArray());}ball.computeVertexNormals();add('closed equal-axis wine body',ball,m.core,core);

  // Irregular folded pelts occupy unequal regions. These are curved material
  // surfaces with backs and raised free edges, not uniform globe tiles.
  function patch(name,lon,lat,w,h,angle,mat,parent,{radius=1.30,crease=.055,edgeLift=.05,seed=1,thickness=.010}={}){
    const ca=Math.cos(angle),sa=Math.sin(angle),phase=seed*.73;
    const surface=(a,b)=>{
      const u=a*2-1,v=b*2-1,shape=.86+.075*Math.sin(b*5+phase)+.035*Math.sin(b*13+phase);
      const xx=u*w*.5*shape+.008*Math.sin(b*37+phase)*Math.pow(Math.abs(u),8),yy=v*h*.5+.009*Math.sin(a*39+phase)*Math.pow(Math.abs(v),8);
      const x=xx*ca-yy*sa,y=xx*sa+yy*ca;
      const folds=crease*(.68*Math.abs(u+.19)-.17+.32*Math.abs(v-u*.43-.07))+.0045*Math.sin(b*16+a*7+phase)+.0025*Math.sin(b*43-a*15+phase);
      const free=edgeLift*(Math.pow(Math.max(0,u),5)*(.34+.66*Math.sin(b*Math.PI))+.24*Math.pow(Math.max(0,v),7));
      return S(lon+x/radius,lat+y/radius,radius+folds+free);
    };
    add(name,grid(surface,34,38,thickness),[mat,mat===m.silver?m.silverBack:mat===m.black||mat===m.graphite||mat===m.print?m.linen:mat],parent);return surface;
  }
  // A contiguous body stays visible between the two denser diagonal groups.
  patch('wine drape, left lower',-.52,-.27,1.05,1.15,-.25,m.silk,cloth,{radius:1.291,crease:.035,edgeLift:.028,seed:4});
  patch('wine seam, right upper',.36,.48,.84,.98,.38,m.darkSilk,cloth,{radius:1.292,crease:.037,edgeLift:.025,seed:7});
  patch('wine reverse gathered fold',2.69,-.28,1.05,1.12,-.30,m.silk,cloth,{radius:1.293,crease:.035,edgeLift:.028,seed:11});
  patch('broad black shoulder',-.58,.73,.89,.91,-.47,m.black,black,{radius:1.335,crease:.050,edgeLift:.075,seed:19});
  patch('upper carbon overlap',.12,.89,.54,.77,.45,m.graphite,black,{radius:1.321,crease:.055,edgeLift:.087,seed:22});
  patch('right black turning face',.92,.13,.80,1.13,-.21,m.black,black,{radius:1.323,crease:.067,edgeLift:.110,seed:29});
  patch('right shoulder gripping paper',.79,.55,.64,.69,.51,m.graphite,black,{radius:1.378,crease:.055,edgeLift:.075,seed:34});
  patch('left lower folded carbon',-.91,-.40,.64,.84,-.47,m.black,black,{radius:1.335,crease:.068,edgeLift:.089,seed:41});
  patch('lower half, turned black paper',-.25,-.90,.91,.58,.34,m.black,black,{radius:1.320,crease:.047,edgeLift:.070,seed:47});
  patch('side cloth compressed beneath the graphite',1.63,.16,1.22,1.28,-.31,m.linen,cloth,{radius:1.311,crease:.032,edgeLift:.051,seed:45});
  patch('rear right turn, tying front to back',1.62,.04,1.05,1.21,.43,m.graphite,black,{radius:1.351,crease:.050,edgeLift:.071,seed:49});
  patch('side upper black fold joins the shoulder',1.42,.71,.82,.70,.41,m.black,black,{radius:1.34,crease:.048,edgeLift:.062,seed:48});
  patch('side silver fold into the reverse',1.97,.08,.34,.91,.47,m.silver,silver,{radius:1.355,crease:.044,edgeLift:.068,seed:50,thickness:.004});
  patch('lettered offcut caught in the side fold',1.68,.14,.52,.62,-.36,m.print,black,{radius:1.406,crease:.039,edgeLift:.047,seed:53});

  // The center is a compact, offset material fold. No oversized emblem or
  // text plaque masks the spherical mass; lettering sits in a narrow scrap.
  patch('carbon page through the seam',-.12,.29,.79,.64,-.48,m.graphite,black,{radius:1.344,crease:.049,edgeLift:.064,seed:51});
  const upperMetal=patch('upper worked silver, rooted beneath carbon',.30,.50,.51,.91,.46,m.silver,silver,{radius:1.346,crease:.041,edgeLift:.080,seed:58,thickness:.004});
  patch('upper paper backing exposed at one edge',.32,.50,.56,.88,.44,m.linen,silver,{radius:1.322,crease:.040,edgeLift:.069,seed:58,thickness:.008});
  patch('slanted charcoal leaf gripping silver',.18,.30,.50,.48,-.64,m.black,black,{radius:1.439,crease:.030,edgeLift:.031,seed:60});
  const lowerMetal=patch('lower silver fold caught in cloth',-.65,-.56,.75,.49,.36,m.silver,silver,{radius:1.359,crease:.048,edgeLift:.071,seed:67,thickness:.004});
  patch('small cloth margin beneath lower foil',-.70,-.57,.81,.52,.34,m.linen,cloth,{radius:1.330,crease:.04,edgeLift:.068,seed:67});
  patch('lower dark tuck over foil',-.96,-.62,.37,.56,-.12,m.black,black,{radius:1.406,crease:.029,edgeLift:.039,seed:71});
  patch('short silver return on far flank',1.20,-.14,.20,.63,-.14,m.silver,silver,{radius:1.353,crease:.037,edgeLift:.056,seed:78,thickness:.004});
  patch('small inscribed sliver',-.26,.12,.34,.16,-.41,m.label,inscription,{radius:1.429,crease:.010,edgeLift:.009,seed:83,thickness:.006});

  function loosePage(name,p,n,w,h,roll,mat,parent,seed,lift=.06){
    const g=grid((a,t)=>{const u=a*2-1,width=w*(.43+.045*Math.sin(t*8+seed)),x=u*width+.006*Math.sin(t*31+seed)*Math.pow(Math.abs(u),6),y=(t-.5)*h+.008*Math.sin(a*29+seed)*Math.pow(Math.abs(t*2-1),7),z=.08*Math.abs(u-.12)+lift*t*t+.022*Math.abs(t*2-u*.5-.42);return V(x,y,z);},24,34,.007,false);
    return add(name,pose(g,V(...p),V(...n),roll),[mat,mat===m.silver?m.silverBack:m.linen],parent);
  }
  loosePage('one torn printed corner',[-.65,1.13,.40],[-.2,.12,1],.40,.56,.33,m.print,black,90,.09);
  loosePage('small turned silver crown edge',[-.41,1.19,.46],[.1,.2,1],.22,.40,-.26,m.silver,silver,95,.085);
  loosePage('hanging lower graphite corner',[-.59,-1.18,.49],[-.25,-.2,1],.31,.45,-.42,m.black,tail,103,.048);
  loosePage('the underside of that corner',[-.58,-1.18,.47],[-.25,-.2,1],.35,.43,-.41,m.linen,tail,103,.036);

  function net(name,points,width,parent,seed){
    const path=curve(points),lines=[],rng=random(seed);
    const f=(u,t)=>{const p=path.getPoint(t),d=path.getTangent(t),n=p.clone().normalize(),side=new T.Vector3().crossVectors(d,n).normalize(),span=width*(.19+.29*Math.sin(Math.PI*t)+.045*Math.sin(t*15+seed));return p.addScaledVector(side,u*span).addScaledVector(n,.026*Math.sin(t*Math.PI)+.009*Math.sin(t*15+u*8));};
    for(let i=0;i<19;i++){const pts=[],start=rng()*.023,end=.99-rng()*.10;for(let j=0;j<28;j++)pts.push(f(i/18*2-1,start+(end-start)*j/27));lines.push(tube(pts,.0015+rng()*.00065,32,3));}
    for(let j=1;j<30;j++){if(j%10===3)continue;const pts=[];for(let i=0;i<12;i++)pts.push(f((i/11*2-1)*(j%11===4?.74:1),(j+.19*Math.sin(i*2+seed))/35));lines.push(tube(pts,.0015,14,3));}
    batch(name,lines,m.thread,parent);
  }
  net('folded silver mesh at central grip',[[-.76,.45,1.08],[-.55,.26,1.29],[-.40,-.04,1.37],[-.23,-.28,1.29]],.26,gauze,116);
  net('compressed lower veil',[[-.98,-.23,.91],[-.91,-.53,1.13],[-.57,-.75,1.21],[-.21,-.81,1.20]],.28,gauze,118);
  net('side weave links both halves',[[1.19,.54,.41],[1.41,.21,.07],[1.39,-.10,-.16],[1.13,-.46,-.57]],.31,gauze,119);
  const stitches=[],rims=[];
  for(const [surface,count]of [[upperMetal,8],[lowerMetal,6]]){
    for(let i=0;i<count;i++){const t=.20+i*.07,p=surface(.93,t),q=surface(.80,t+.025);stitches.push(tube([p,p.clone().lerp(q,.5).multiplyScalar(1.009),q],.0025,8,3));}
    const pts=[];for(let j=5;j<=35;j++)pts.push(surface(.98,j/40));rims.push(tube(pts,.0016,35,3));
  }
  batch('visible fastening at material contact',stitches,m.thread,silver);batch('two very thin metallic cut edges',rims,m.thread,silver);

  let beadCount=0;
  function chain(name,points,size,step,parent=ruby){
    const path=curve(points),count=Math.floor(path.getLength()/step),ring=[],light=[],dark=[];add(name+' fine core thread',new T.TubeGeometry(path,count*3,.0025,4,false),m.redThread,parent,false);
    for(let i=0;i<=count;i++){const t=i/count,p=path.getPointAt(t),d=path.getTangentAt(t);let n=p.clone().normalize();n.addScaledVector(d,-n.dot(d));if(n.length()<.1)n=V(0,0,1);n.normalize();const x=new T.Vector3().crossVectors(d,n).normalize();n.crossVectors(x,d).normalize();const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,d,n)),rr=size*(.83+r()*.22);let g;
      if(i%5===0||i%7===3){g=new T.SphereGeometry(rr*.88,14,10);g.scale(.93,1.12,.83);g.applyQuaternion(q);g.translate(...p.toArray());(i%7===3?dark:light).push(g);}else{g=new T.TorusGeometry(rr,rr*.22,7,20);g.scale(.91,1.08,1);g.rotateY(i%2?.39:-.31);g.applyQuaternion(q);g.translate(...p.toArray());ring.push(g);}beadCount++;}
    batch(name+' glass loops',ring,m.ruby,parent);batch(name+' wine beads',light,m.ruby,parent);batch(name+' darker seeds',dark,m.garnet,parent);
  }
  chain('main falling strand',[[-.68,1.39,.42],[-.64,.98,1.01],[-.45,.57,1.40],[-.27,.33,1.59],[.02,.10,1.64],[.38,-.17,1.54],[.80,-.58,1.18],[1.03,-1.07,.75],[.97,-1.49,.49],[.73,-1.77,.31]],.025,.061);
  chain('quieter strand turning to the back',[[-1.18,-.20,.69],[-1.33,-.48,.43],[-1.26,-.74,-.10],[-1.02,-.85,-.57],[-.59,-.76,-1.01],[-.17,-.48,-1.31],[.12,-.32,-1.39]],.0185,.069);
  const drop=new T.LatheGeometry([new T.Vector2(0,-.07),new T.Vector2(.016,-.064),new T.Vector2(.027,-.041),new T.Vector2(.023,-.011),new T.Vector2(.012,.024),new T.Vector2(.006,.050)],24);drop.translate(.73,-1.83,.31);add('single weighted garnet end',drop,m.ruby,ruby);
  const pins=[];for(const p of [[-.68,1.39,.42],[-1.18,-.20,.69],[.12,-.32,-1.39]]){const g=new T.TorusGeometry(.025,.0036,6,18);pose(g,V(...p),V(...p));pins.push(g);}batch('three fastening eyes',pins,m.thread,ruby);

  let petalCount=0;
  function flower(name,p,n,size,kind,seed,parent=botanic){
    const rng=random(seed),origin=V(...p),normal=V(...n).normalize(),q=new T.Quaternion().setFromUnitVectors(V(0,0,1),normal),parts=[[],[],[]],seeds=[];
    const mats=kind==='ivory'?[m.petal,m.petal,m.petalShadow]:kind==='rose'?[m.rose,m.petalShadow,m.rose]:[m.ochre,m.ochre,m.ochreShadow],counts=[17,15,12,9];
    for(let tier=0;tier<4;tier++)for(let i=0;i<counts[tier];i++){
      const a=TAU*i/counts[tier]+tier*.46+(rng()-.5)*.22,rad=size*(.12+tier*.006),length=size*(.94-tier*.155)*(.84+rng()*.29),width=size*(.19-tier*.023)*(.85+rng()*.33),g=petal(length,width,size*(.09+tier*.042),seed+i*13+tier*97);
      g.rotateX((rng()-.5)*.41);g.rotateY((rng()-.5)*.17);g.rotateZ(-a);g.translate(Math.sin(a)*rad,Math.cos(a)*rad,size*tier*.029+(rng()-.5)*size*.036);g.applyQuaternion(q);g.translate(...origin.toArray());parts[Math.floor(rng()*3)].push(g);petalCount++;
    }
    parts.forEach((gs,i)=>batch(name+' curled petals '+i,gs,mats[i],parent,true));
    for(let i=0;i<80;i++){const a=rng()*TAU,rad=Math.sqrt(rng())*size*.185,p=V(Math.cos(a)*rad,Math.sin(a)*rad,size*(.10+Math.sqrt(Math.max(0,1-rad/(size*.20)))*.083)).applyQuaternion(q).add(origin),g=new T.IcosahedronGeometry(size*(.020+rng()*.011),1);g.scale(.8,1,.72);g.translate(...p.toArray());seeds.push(g);}batch(name+' dry seed heart',seeds,m.seed,parent);
    add(name+' buried stem',tube([origin.clone().addScaledVector(normal,-.22),origin.clone().add(V(-.03,-.07,-.03)),origin],.007,16,4),m.stem,parent);
  }
  flower('small ochre tucked at shoulder',[-.70,.71,1.12],[-.24,.28,1],.170,'ochre',153);
  flower('main ivory in the lower fold',[.19,-.87,1.15],[.12,-.38,1],.278,'ivory',167);
  flower('half hidden rose beside ivory',[-.11,-.98,1.02],[-.29,-.22,1],.113,'rose',175);
  function leaf(name,p,n,len,width,roll,parent,seed){const g=petal(len,width,len*.13,seed);pose(g,V(...p),V(...n),roll);add(name,g,m.petalShadow,parent,false);const q=new T.Quaternion().setFromUnitVectors(V(0,0,1),V(...n).normalize()).multiply(new T.Quaternion().setFromAxisAngle(V(0,0,1),roll)),lines=[];for(let i=0;i<6;i++){const t=.24+i*.10;for(const s of [-1,1]){const a=V(0,t*len,.02).applyQuaternion(q).add(V(...p)),b=V(s*width*.8,(t+.1)*len,.032).applyQuaternion(q).add(V(...p));lines.push(tube([a,b],.0012,7,3));}}batch(name+' veins',lines,m.stem,parent);}
  leaf('one dry remnant at the upper seam',[-.52,.49,1.24],[-.1,.1,1],.25,.042,-.56,botanic,181);
  leaf('turned petal at the lower seam',[.38,-.75,1.09],[.3,-.3,1],.30,.046,.89,botanic,186);
  const twigs=[];for(const [aa,bb]of [[[-.75,.66,1.13],[-.88,1.04,.82]],[[.22,-.86,1.12],[.65,-.68,1.05]]]){const a=V(...aa),b=V(...bb);twigs.push(tube([a,a.clone().lerp(b,.5).add(V(.04,.01,.01)),b],.0035,19,4));for(let i=0;i<6;i++){const p=a.clone().lerp(b,.29+i*.1);twigs.push(tube([p,p.clone().add(V((i%2?-1:1)*.035,.055,.015))],.0013,7,3));}}batch('two restrained dried stems',twigs,m.stem,botanic);

  patch('reverse cloth compression',-2.91,.56,.73,.91,.38,m.darkSilk,cloth,{radius:1.299,crease:.050,edgeLift:.035,seed:191});
  patch('reverse cloth across lower seam',2.73,-.60,.91,.66,-.37,m.darkSilk,cloth,{radius:1.302,crease:.044,edgeLift:.033,seed:194});
  // The reverse is constructed with its own overlap and one quiet flower,
  // continuing the same carbon/cloth/silver contact around the actual volume.
  patch('rear upper charcoal shoulder',2.37,.60,1.04,1.00,-.41,m.black,back,{radius:1.33,crease:.050,edgeLift:.077,seed:201});
  patch('rear left folded graphite',-2.49,.09,.85,1.0,.34,m.graphite,back,{radius:1.325,crease:.057,edgeLift:.084,seed:207});
  patch('rear lower black return',2.83,-.70,1.08,.74,.25,m.black,back,{radius:1.326,crease:.050,edgeLift:.075,seed:214});
  patch('back silver hinge',2.95,.24,.56,.84,.47,m.silver,back,{radius:1.34,crease:.052,edgeLift:.095,seed:220,thickness:.004});
  patch('linen below the hinge',2.97,.24,.63,.88,.44,m.linen,back,{radius:1.313,crease:.045,edgeLift:.095,seed:220});
  patch('back dark paper gripping the hinge',3.13,.11,.64,.62,-.42,m.black,back,{radius:1.397,crease:.045,edgeLift:.091,seed:226});
  patch('lettered reverse page meeting the hinge',3.33,.03,.45,.78,.48,m.print,back,{radius:1.374,crease:.036,edgeLift:.071,seed:228});
  loosePage('rear turned carbon leaf',[-.50,-.41,-1.10],[-.3,-.1,-1],.35,.51,.32,m.black,back,229,.064);
  net('rear woven contact',[[.54,.64,-1.18],[.13,.39,-1.40],[-.09,.04,-1.49],[-.42,-.42,-1.31]],.32,back,230);
  flower('quiet rear faded ivory',[.39,.60,-1.13],[.21,.3,-1],.186,'ivory',239,back);
  leaf('rear dried leaf',[.50,.46,-1.14],[.1,.2,-1],.26,.048,.77,back,246);
  const backStitch=[];for(let i=0;i<7;i++){const t=i/6,p=V(.01-t*.24,.20-t*.4,-1.44);backStitch.push(tube([p.clone().add(V(-.029,.005,0)),p.clone().add(V(0,.012,-.018)),p.clone().add(V(.027,-.01,0))],.0025,8,3));}batch('seven stitches holding the reverse',backStitch,m.thread,back);
  const stone=[],rose=[];for(let i=0;i<9;i++){const t=i/8,p=S(1.07+(r()-.5)*.17,.14-t*.35,1.354),g=new T.IcosahedronGeometry(.032+r()*.018,1);g.scale(1,.48,.22);g.rotateZ(r()*3);g.translate(...p.toArray());(i%5?stone:rose).push(g);}batch('mineral seam partly hidden by carbon',stone,m.stone,silver,true);batch('two quiet rose fragments',rose,m.roseStone,silver,true);
  const fine=[];for(const [a,b]of [[[.72,-.76,1.0],[.84,-1.03,.83]],[[-.58,1.1,.64],[-.77,1.43,.48]]])fine.push(tube([a,V(...a).lerp(V(...b),.5).add(V(.04,.012,.0)),b],.0018,20,3));batch('two fine free ends',fine,m.blackThread,inscription);

  root.userData={title:'在坠落时',slug:'falling',sceneVersion:'0.27.0',artRevision:12,solidCore:true,bodyRadius:1.275,bodyAxes:[1,1,1],beadCount,petalCount,structureGroups:groups.length,frontFlowerGroups:2,chainComposition:'one falling front strand and one quieter strand returning around the flank to the back',detailTargets:{threads:[-.10,.34,1.33],flowers:[.12,-.86,1.11],fault:[.79,.17,1.02]},referenceUse:'Original folded carbon, cloth, foil, ruby and dry-flower assemblage based on the user reference, refined through actual three-dimensional front/side/back views. No reference pixels or generated replacement artwork.'};
  let meshCount=0,triangleCount=0,exportPrimitiveCount=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;exportPrimitiveCount+=Array.isArray(o.material)?o.geometry.groups.length:1;}});Object.assign(root.userData,{meshCount,triangleCount,exportPrimitiveCount});let spread=0;
  return {root,groups,ready:Promise.resolve(),setSeparated(value){spread=value;groups.forEach(g=>g.position.fromArray(g.userData.offset).multiplyScalar(value));},setMoment(t){tail.rotation.z=Math.sin(t*.3)*.012;tail.position.y=tail.userData.offset[1]*spread-Math.sin(t*.42)*.011;},dispose(){owned.forEach(g=>g.dispose());disposeMaterials();}};
}
