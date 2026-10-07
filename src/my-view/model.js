import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials} from './materials.js?v=0340';

const TAU=Math.PI*2,V=p=>new T.Vector3(...p);
function surface(f,nu=24,nv=22){const p=[],uv=[],ix=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...f(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;ix.push(a,a+1,b,b,a+1,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
function tube(points,r=.006,n=32,sides=5){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),n,r,sides,false);}
function reverse(geo,thickness){const g=geo.clone(),p=g.attributes.position,n=g.attributes.normal,ix=g.index;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)-n.getX(i)*thickness,p.getY(i)-n.getY(i)*thickness,p.getZ(i)-n.getZ(i)*thickness);for(let i=0;i<ix.count;i+=3){const a=ix.getX(i);ix.setX(i,ix.getX(i+2));ix.setX(i+2,a);}g.computeVertexNormals();return g;}
export function makeMyView(){
  const root=new T.Group(),groups=[],m=makeMaterials(),pending=new Map();root.name='以我之见 / The Way I See';
  let state=340701,patchCount=0,stoneCount=0,fiberCount=0,petalCount=0,flowerCount=0;
  const rnd=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296),range=(a,b)=>a+(b-a)*rnd();
  const center=V([0,-.06,0]);
  function layer(name,offset){const g=new T.Group();g.name=name;g.userData.separation=offset;g.userData.restPosition=[0,0,0];root.add(g);groups.push(g);return g;}
  function add(g,geo,mat){if(!geo.index)geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i));const key=g.id+':'+mat.id;if(!pending.has(key))pending.set(key,{g,mat,geos:[]});pending.get(key).geos.push(geo);}
  function solid(g,geo,mat,name){const mesh=new T.Mesh(geo,mat);mesh.name=name;mesh.castShadow=mesh.receiveShadow=!mat.transparent;if(mat.transparent)mesh.renderOrder=3;g.add(mesh);return mesh;}
  function pose(n,radius,angle=0){const normal=V(n).normalize(),q=new T.Quaternion().setFromUnitVectors(V([0,0,1]),normal).multiply(new T.Quaternion().setFromAxisAngle(V([0,0,1]),angle));return new T.Matrix4().compose(normal.multiplyScalar(radius).add(center),q,V([1,1,1]));}
  const stone=layer('01 / broken mineral shoulder and river strata',[.012,-.035,-.035]);
  const coreGeo=new T.IcosahedronGeometry(1.075,5),cp=coreGeo.attributes.position;
  for(let i=0;i<cp.count;i++){const v=new T.Vector3().fromBufferAttribute(cp,i),n=v.clone().normalize(),r=1.075+.027*Math.sin(n.x*19+n.y*7)*Math.cos(n.z*17)+.011*Math.sin(n.y*61+n.z*23);v.setLength(r).add(center);cp.setXYZ(i,v.x,v.y,v.z);}coreGeo.computeVertexNormals();
  const core=solid(stone,coreGeo,m.slate,'rough equal-axis closed mineral heart');core.userData={solidCore:true,radius:1.075,axes:[1,1,1],center:center.toArray()};
  const papers=layer('02 / torn rice paper and inked mountain folds',[.03,.02,.035]);
  const textiles=layer('03 / silver-grey open gauze and folded cloth',[-.035,.005,.06]);
  const calligraphy=layer('04 / broken brush gestures and a quiet written leaf',[.005,.025,.085]);
  const colour=layer('05 / cobalt violet jade and faded vermilion slips',[-.025,.012,.065]);
  const fibers=layer('06 / mineral fibres, dry stems and loose sewing',[.018,.005,.06]);
  const cords=layer('07 / continuous red silk paths, wrapped through the seams',[.025,-.015,.10]);
  const flowers=layer('08 / wind-worn blossoms and moss gathered in cracks',[-.015,-.015,.08]);
  const haze=layer('09 / porous translucent paper mist',[.025,.04,.13]);
  function patch(g,matrix,w,h,material,id,{curl=.13,fold=.08,thickness=.007,taper=1,res=24}={}){
    const f=(u,v)=>{const s=u-.5,t=v-.5,tear=.005*Math.sin(v*49+id)+.003*Math.sin(v*107+id*.4),edge=.006*Math.sin(u*57-id)+.003*Math.sin(u*119+id),x=s*w*(taper+(1-taper)*v)+tear*(u**10+(1-u)**10),y=t*h+edge*(v**10+(1-v)**10),sag=-(x*x+y*y)/3.15;
      const ridge=fold*(Math.abs(u-.32+.12*Math.sin(id))*2.5+Math.abs(v-.66)*.6)+fold*.08*Math.sin(u*13-v*6+id),free=curl*Math.pow(u,7)*(.6+.4*Math.sin(v*4+id)**2)+.012*Math.pow(1-v,10)*Math.sin(u*6+id);return [x,y,sag+ridge+free];};
    const geo=surface(f,res,Math.max(18,res-2)),back=reverse(geo,thickness);geo.applyMatrix4(matrix);back.applyMatrix4(matrix);add(g,geo,material);add(g,back,material===m.ink?m.charcoal:material===m.red?m.wine:m.greyPaper);patchCount++;
    if(id%3===0){for(const side of [0,1])for(let j=0;j<18;j++){const t=(j+.4)/18,p=V(f(side,t)).applyMatrix4(matrix),q=V(f(side?.97:.03,t)).applyMatrix4(matrix),dir=p.clone().sub(q).normalize(),end=p.clone().addScaledVector(dir,.015+.035*rnd()).add(V([range(-.009,.009),-.017,.012]));add(fibers,tube([p.toArray(),p.clone().lerp(end,.5).add(V([0,.012,.006])).toArray(),end.toArray()],.0009,4,3),m.thread);fiberCount++;}}
    return {point:(u,v)=>V(f(u,v)).applyMatrix4(matrix),matrix};
  }
  // The body is assembled in all directions; the front is denser, the reverse quieter.
  for(let i=0;i<48;i++){
    const y=1-2*(i+.5)/48,a=i*2.399963,n=[Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a)],r=1.13+range(-.035,.06),matrix=pose(n,r,range(-1.5,1.5));
    const stoneGeo=new T.IcosahedronGeometry(1,i%3===0?2:1),p=stoneGeo.attributes.position;const sx=range(.18,.33),sy=range(.16,.28),sz=range(.035,.065);
    for(let j=0;j<p.count;j++){let x=p.getX(j),y=p.getY(j),z=p.getZ(j);const rough=1+.1*Math.sin(x*17+y*23+i)*Math.sin(z*29+i);p.setXYZ(j,x*sx*rough,y*sy*rough,z*sz*rough);}stoneGeo.computeVertexNormals();stoneGeo.applyMatrix4(matrix);add(stone,stoneGeo,[m.stone,m.chalk,m.slate,m.charcoal][i%4]);stoneCount++;
    const w=range(.36,.57),h=range(.46,.73);patch(papers,pose(n,r+.15,range(-1.6,1.6)),w,h,i%4===0?m.inkPaper:i%5===0?m.paper:i%2===0?m.greyPaper:m.greyLinen,i,{curl:range(.025,.075),fold:range(.015,.038),taper:.81+range(0,.19)});
    if(i%2===0)patch(textiles,pose(n,r+.21,range(-2,2)),w*.85,h*.80,i%4===0?m.linen:m.greyLinen,100+i,{fold:.045,curl:.09,thickness:.003});
  }
  // Larger diagonal strata are thin broken laminations, rather than detached rubble.
  const shelves=[{n:[-.80,-.45,.62],a:.83,w:1.19,h:.27},{n:[.65,-.60,.62],a:-.42,w:.99,h:.29},{n:[-.50,.78,.40],a:-.44,w:.81,h:.34},{n:[.54,.80,.37],a:.18,w:.62,h:.48},{n:[-.54,-.49,-.72],a:.59,w:.83,h:.27},{n:[.64,.17,-.77],a:-.42,w:.87,h:.32}];
  shelves.forEach((s,i)=>{for(let j=0;j<5;j++){const mat=j===0?m.charcoal:j%2?m.chalk:m.stone;patch(stone,pose(s.n,1.43+j*.027,s.a+.018*j),s.w*(1-.07*j),s.h*(1-.04*j),mat,210+i*7+j,{fold:.025,curl:.075,thickness:.018,taper:.87});}});
  // A few large pale folds carry the long sweep; their free tips break the rim.
  [[[-.71,.40,.85],1.39,.47,.78,-.38,m.inkPaper],[[.45,.73,.70],1.39,.53,.74,.24,m.linen],[[.68,-.18,.80],1.39,.59,.71,-.23,m.greyPaper],[[-.30,-.68,.79],1.41,.45,.72,.63,m.inkPaper],[[.18,.25,-1],1.39,.52,.87,-.22,m.inkPaper]].forEach(([n,r,w,h,a,mat],i)=>patch(papers,pose(n,r,a),w,h,mat,300+i,{curl:.115,fold:.045}));
  patch(calligraphy,pose([-.08,.19,1],1.46,-.18),.53,.68,m.title,311,{curl:.027,fold:.018,thickness:.004,res:36});
  // Original ink gestures, independent tapered surfaces with splintered brush tips.
  function brush(points,width,id){const path=new T.CatmullRomCurve3(points.map(V)),f=(u,v)=>{const p=path.getPoint(v),t=path.getTangent(v),axis=V([0,0,1]).cross(t).normalize(),s=u-.5,envelope=Math.pow(Math.sin(Math.PI*v),.43)*(.78+.22*Math.sin(v*13+id));return p.addScaledVector(axis,s*width*envelope*(1+.075*Math.sin(v*67+id))).add(V([0,0,.018*Math.sin(u*9+v*6)])).toArray();};const geo=surface(f,12,42),back=reverse(geo,.004);add(calligraphy,geo,m.ink);add(calligraphy,back,m.charcoal);}
  brush([[-.98,.55,.68],[-.90,.83,.70],[-.65,1.04,.67],[-.42,1.16,.61]],.09,1);
  brush([[.60,.94,.58],[.73,.71,.90],[.71,.42,1.19],[.60,.13,1.33]],.065,2);
  brush([[.42,.13,1.38],[.65,.24,1.28],[.91,.44,1.01]],.065,3);
  brush([[-.95,-.22,.99],[-.81,-.35,1.15],[-.53,-.43,1.37]],.08,4);
  brush([[.05,-.76,-1.20],[.52,-.60,-1.09],[.95,-.22,-.78]],.065,5);
  const accents=[[-.68,.75,.61,.28,.49,-.31,m.cobalt],[-.52,.93,.57,.22,.35,.42,m.violet],[-.36,1.07,.37,.30,.20,-.40,m.pink],[.67,.69,.57,.22,.25,-.46,m.jade],[-.85,.22,.73,.19,.33,.34,m.ochre],[.44,-.78,.54,.37,.19,.44,m.jade],[-.43,-.82,.48,.25,.22,-.25,m.violet],[.28,.55,-.85,.27,.37,-.17,m.cobalt]];
  accents.forEach((a,i)=>{for(let j=0;j<3;j++)patch(colour,pose(a.slice(0,3),1.51+j*.026,a[5]+j*.18),a[3]*(1-j*.15),a[4]*(1-j*.13),j===1?m.paper:a[6],340+i*3+j,{curl:.075,fold:.04,thickness:.004,taper:.8});});
  // Small angled folios overlap at selected seams, with breathing room between clusters.
  [[-.64,.66,.75],[.61,.12,.85],[-.63,-.48,.78],[.28,-.69,.82],[-.35,.34,-.97],[.56,-.47,-.79],[1,.12,.03],[-1,.12,-.2]].forEach((n,id)=>{
    for(let j=0;j<9;j++){const drift=[n[0]+range(-.17,.17),n[1]+range(-.15,.15),n[2]],mat=[m.inkPaper,m.greyLinen,m.paper,m.stone,m.linen][(j+id)%5];patch(papers,pose(drift,1.41+j*.009,range(-1.6,1.6)),range(.15,.27),range(.23,.46),mat,400+id*9+j,{curl:.03,fold:.018,thickness:.004,res:20});}
  });
  // Fine dry filaments follow curved tangents, collecting at different depths.
  [[-.75,-.27,.8],[.66,.30,.8],[-.14,-.84,.76],[-.55,.38,-.85],[.72,-.25,-.78]].forEach((direction,id)=>{
    const n=V(direction).normalize(),up=V([.1,1,.08]).addScaledVector(n,-V([.1,1,.08]).dot(n)).normalize(),right=up.clone().cross(n),c=n.clone().multiplyScalar(1.43).add(center);
    for(let j=0;j<145;j++){const ps=[],v=(j/144-.5)*.78;for(let k=0;k<=12;k++){const t=k/12,u=(t-.5)*(.73+.19*Math.sin(j*1.3)**2),s=v+.1*Math.sin(t*4+j*.63);ps.push(c.clone().addScaledVector(right,u).addScaledVector(up,s).addScaledVector(n,-(u*u+s*s)/2.8+.027*Math.sin(t*9+j*.3)).toArray());}add(fibers,tube(ps,j%19===0?.0025:.00095,13,3),j%7?m.thread:m.dry);fiberCount++;}
    for(let j=0;j<22;j++){const p=c.clone().addScaledVector(up,range(-.3,.3)).addScaledVector(right,range(-.3,.3)),q=p.clone().addScaledVector(up,.19+range(0,.24)).addScaledVector(right,range(-.1,.1));add(fibers,tube([p.toArray(),p.clone().lerp(q,.6).addScaledVector(n,.03).toArray(),q.toArray()],.0024,10,4),m.dry);fiberCount++;}
  });
  const paths=[
    [[-.78,-.58,1.30],[-.56,-.32,1.53],[-.39,.05,1.55],[.07,.22,1.54],[.43,.10,1.55],[.31,-.17,1.62],[-.06,-.28,1.68],[-.26,-.51,1.64],[-.08,-.73,1.45],[.22,-.72,1.37],[.35,-.57,1.27]],
    [[-.73,.48,.94],[-.61,.08,1.32],[-.29,-.03,1.54],[.07,.09,1.63],[.26,-.16,1.64],[.05,-.37,1.62],[-.37,-.39,1.50],[-.61,-.67,1.30]],
    [[.56,.78,-.71],[1.15,.48,-.38],[1.40,-.07,.06],[1.36,-.53,.46],[1.04,-.78,.88],[1.12,-1.10,.90],[1.45,-1.28,.64]],
    [[-.73,-1.10,.23],[-1.30,-.68,-.22],[-1.30,.04,-.44],[-.87,.69,-.97],[-.27,.78,-1.25],[.23,.38,-1.39],[.47,-.31,-1.32],[.05,-.82,-1.14]]
  ];
  paths.forEach((points,id)=>{const curve=new T.CatmullRomCurve3(points.map(V)),radius=id===0?.013:id===1?.008:id===2?.009:.008;add(cords,new T.TubeGeometry(curve,180,radius,8,false),id===2?m.wine:m.red);for(let j=0;j<5;j++){const frames=curve.computeFrenetFrames(140,false),ps=[];for(let k=0;k<=140;k++){const a=k*.73+j*TAU/5;ps.push(curve.getPoint(k/140).addScaledVector(frames.normals[k],Math.cos(a)*radius).addScaledVector(frames.binormals[k],Math.sin(a)*radius).toArray());}add(cords,tube(ps,.0007,142,3),j%2?m.scarlet:m.wine);}});
  // Loose grey and jade trajectories enter the seams rather than circling a halo.
  [[[-1.29,-.63,.59],[-.99,-.46,1.09],[-.61,-.18,1.36],[-.31,.32,1.38],[-.75,.83,.78]],[[.33,-1.34,.44],[.82,-.93,.83],[.86,-.47,1.21],[.48,-.24,1.52],[-.08,-.10,1.55]]].forEach((p,i)=>add(cords,tube(p,.007,95,5),i?m.jade:m.thread));
  const blossoms=[[-.43,-1.02,.80,.11,m.burgundy],[.03,-1.16,.76,.13,m.flower],[.24,-.95,1.07,.09,m.flower],[-.63,.82,.76,.075,m.burgundy],[.57,.89,.63,.07,m.flower],[.95,-.68,.43,.075,m.burgundy],[-.74,-.43,-.82,.085,m.flower],[.66,.41,-.92,.07,m.burgundy]];
  blossoms.forEach(([x,y,z,r,mat],id)=>{const n=V([x,y,z]).sub(center).normalize(),matrix=pose(n,V([x,y,z]).sub(center).length()+.14,id*.9);for(let j=0;j<29;j++){const a=j*2.39996,len=r*(.50+(j%4)*.15),f=(u,v)=>{const s=u-.5,p=V([Math.cos(a)*len*v-Math.sin(a)*s*r*.57*Math.sin(Math.PI*v)**.7,Math.sin(a)*len*v+Math.cos(a)*s*r*.57*Math.sin(Math.PI*v)**.7,.027*Math.sin(v*4)+.015*Math.sin(u*7+j)*v]);return p.applyMatrix4(matrix).toArray();};const geo=surface(f,8,13);add(flowers,geo,mat);petalCount++;}const bud=new T.IcosahedronGeometry(.018,1);bud.applyMatrix4(matrix);add(flowers,bud,m.ochre);flowerCount++;});
  for(let i=0;i<62;i++){const a=i*2.39996,n=V([Math.cos(a),Math.sin(a*.71)*.72,Math.sin(a)]).normalize(),matrix=pose(n,1.26,range(0,TAU));for(let j=0;j<4;j++){const g=new T.IcosahedronGeometry(range(.016,.03),0);g.scale(1,1.3,.5);g.translate(range(-.055,.055),range(-.07,.07),0);g.applyMatrix4(matrix);add(flowers,g,i%4?m.moss:m.jade);}}
  // Six softened curved membranes create the milky upper-right mist of the reference.
  [[.30,.99,1.22,.82,.77,-.28],[.58,.70,1.39,.77,.81,.17],[.65,1.23,.72,.70,.64,-.39],[-.06,.96,1.13,.74,.42,.18],[.98,.36,.90,.41,.57,.26],[.42,.62,-1.21,.64,.71,-.16]].forEach(([x,y,z,w,h,a],id)=>{
    const matrix=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(new T.Euler(.12*(id%3-1),z<0?Math.PI:0,a)),V([1,1,1]));const g=surface((u,v)=>V([(u-.5)*w,(v-.5)*h,.035*Math.sin(u*7+v*5+id)+.06*(u-.5)**2]).applyMatrix4(matrix).toArray(),24,24);solid(haze,g,id%2?m.veil:m.mist,'porous paper mist '+id);
  });
  for(const {g,mat,geos} of pending.values()){const merged=mergeGeometries(geos);geos.forEach(x=>x.dispose());solid(g,merged,mat,g.name+' / '+mat.name);}
  let meshCount=0,triangleCount=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
  root.userData={title:'以我之见',englishTitle:'The Way I See',version:'0.34.0',sceneVersion:'0.34.0',artRevision:1,solidCore:true,bodyAxes:[1,1,1],bodyRadius:1.075,bodyCenter:center.toArray(),patchCount,stoneCount,cordCount:paths.length,fiberCount,flowerCount,petalCount,mistLayers:6,meshCount,triangleCount,exportPrimitiveCount:meshCount,layers:groups.map(g=>g.name),detailTargets:{paper:[-.15,.65,1.20],cords:[-.01,-.22,1.51],strata:[-.36,-.88,1.11]},structure:'Independent equal-axis mineral assemblage with rice-paper folds, layered rough stone shelves, broken black brush gestures, four continuous red silk paths, woven fibres, sparse botanical colour and porous upper mist. Side and back are complete sculptural structures.',referenceBasis:'User supplied The Way I See collage and lyrics; geometry and materials authored specifically for this seventh world, not a recoloured existing artwork or complete image projection.',visualStatus:'Current revision requires actual six-view inspection; this metadata is not art approval.'};
  return {root,groups,ready:m.ready,setSeparated(value){const a=T.MathUtils.clamp(Number(value)||0,0,1);groups.forEach(g=>g.position.fromArray(g.userData.restPosition).addScaledVector(V(g.userData.separation),a));},dispose(){root.traverse(o=>{if(o.geometry)o.geometry.dispose();});m.dispose();}};
}
