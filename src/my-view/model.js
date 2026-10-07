import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials} from './materials.js?v=0370';

const TAU=Math.PI*2,V=p=>new T.Vector3(...p);
function surface(f,nu=24,nv=22){const p=[],uv=[],ix=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...f(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;ix.push(a,a+1,b,b,a+1,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
function tube(points,r=.006,n=32,sides=5){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),n,r,sides,false);}
function reverse(geo,thickness){const g=geo.clone(),p=g.attributes.position,n=g.attributes.normal,ix=g.index;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)-n.getX(i)*thickness,p.getY(i)-n.getY(i)*thickness,p.getZ(i)-n.getZ(i)*thickness);for(let i=0;i<ix.count;i+=3){const a=ix.getX(i);ix.setX(i,ix.getX(i+2));ix.setX(i+2,a);}g.computeVertexNormals();return g;}
export function makeMyView(){
 const root=new T.Group(),groups=[],m=makeMaterials(),pending=new Map();root.name='以我之见 / The Way I See';
 let state=350703,patchCount=0,stoneCount=0,fiberCount=0,petalCount=0,flowerCount=0,weavePanels=0,reedStrands=0,sprigCount=0;
 const rnd=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296),range=(a,b)=>a+(b-a)*rnd(),center=V([0,-.06,0]);
 function layer(name,offset){const g=new T.Group();g.name=name;g.userData.separation=offset;g.userData.restPosition=[0,0,0];root.add(g);groups.push(g);return g;}
 function add(g,geo,mat){if(!geo.index)geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i));const key=g.id+':'+mat.id;if(!pending.has(key))pending.set(key,{g,mat,geos:[]});pending.get(key).geos.push(geo);}
 function solid(g,geo,mat,name){const mesh=new T.Mesh(geo,mat);mesh.name=name;mesh.castShadow=!mat.transparent&&!mat.alphaTest&&!g.name.startsWith('06 /')&&!g.name.startsWith('07 /');mesh.receiveShadow=!mat.transparent&&!mat.alphaTest;if(mat.transparent)mesh.renderOrder=g.name.startsWith('10 /')?4:3;g.add(mesh);return mesh;}
 function at(p,a=0,rx=0,ry=0){return new T.Matrix4().compose(V(p),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,a)),V([1,1,1]));}
 function pose(n,radius,angle=0){const normal=V(n).normalize(),q=new T.Quaternion().setFromUnitVectors(V([0,0,1]),normal).multiply(new T.Quaternion().setFromAxisAngle(V([0,0,1]),angle));return new T.Matrix4().compose(normal.multiplyScalar(radius).add(center),q,V([1,1,1]));}
 const stone=layer('01 / mineral heart and a long diagonal broken stone band',[.012,-.035,-.035]);
 const coreGeo=new T.IcosahedronGeometry(.86,5),cp=coreGeo.attributes.position;
 for(let i=0;i<cp.count;i++){const v=new T.Vector3().fromBufferAttribute(cp,i),n=v.clone().normalize();v.setLength(.86+.022*Math.sin(n.x*19+n.y*7)*Math.cos(n.z*17)).add(center);cp.setXYZ(i,v.x,v.y,v.z);}coreGeo.computeVertexNormals();
 const core=solid(stone,coreGeo,m.graphite,'recessed equal-axis mineral heart');core.userData={solidCore:true,radius:.86,axes:[1,1,1],center:center.toArray()};
 const papers=layer('02 / irregular overlapping rice paper and ink remnants',[.03,.02,.035]);
 const textiles=layer('03 / torn linen, folded gauze and crumpled silver',[-.035,.005,.06]);
 const calligraphy=layer('04 / crooked central written leaf',[.005,.025,.085]);
 const colour=layer('05 / upper-left cobalt print and faded pressed petals',[-.025,.012,.065]);
 const fibers=layer('06 / woven edges and loose dry fibres',[.018,.005,.06]);
 const cords=layer('07 / vermilion silk passing through the lower folds',[.025,-.015,.10]);
 const flowers=layer('08 / pressed blossoms in the paper seams',[-.015,-.015,.08]);
 const haze=layer('09 / layered warm mist over the upper shoulder',[.025,.04,.13]);
 const lettering=layer('10 / four original brush silhouettes around the assemblage',[0,0,-.04]);
 function patch(g,matrix,w,h,material,id,{curl=.1,fold=.06,thickness=.005,taper=.86,res=22}={}){
  const f=(u,v)=>{const s=u-.5,t=v-.5,rag=.005*Math.sin(v*29+id)*Math.sin(v*79+id*.7)+.002*Math.sin(v*103+id*.7),edge=.006*Math.sin(u*37-id)*Math.sin(u*67+id)+.002*Math.sin(u*113+id),waist=taper+(1-taper)*Math.sin(Math.PI*v),x=s*w*waist+rag*(u**8+(1-u)**8),y=t*h+edge*(v**8+(1-v)**8),crease=fold*(Math.abs(u-.26-.06*Math.sin(id))*2.4+Math.abs(v-.61)*.8),lift=curl*(Math.pow(u,6)*(.55+.45*Math.sin(v*5+id)**2)-.24*Math.pow(1-v,7));return [x,y,-(x*x+y*y)/2.3+crease+lift+.006*Math.sin(u*19+v*8+id)];};
  const geo=surface(f,res,res),back=reverse(geo,thickness);geo.applyMatrix4(matrix);back.applyMatrix4(matrix);add(g,geo,material);add(g,back,material===m.red?m.wine:material===m.ink?m.charcoal:m.greyPaper);patchCount++;
  if(id%3===0)for(const side of [0,1])for(let j=0;j<7;j++){const t=(j+.4)/7,p=V(f(side,t)).applyMatrix4(matrix),q=V(f(side?.96:.04,t)).applyMatrix4(matrix),end=p.clone().addScaledVector(p.clone().sub(q).normalize(),range(.006,.021)).add(V([range(-.005,.005),-.009,.006]));add(fibers,tube([p.toArray(),p.clone().lerp(end,.5).add(V([0,.007,.004])).toArray(),end.toArray()],.00085,4,3),m.thread);fiberCount++;}
  return f;
 }
 // Recessed volumes and bundled folds surround the heart in every direction.
 // The front composition is authored below rather than produced by a tiled shell.
 for(let i=0;i<36;i++){
  const y=1-2*(i+.5)/36,a=i*2.399963,n=[Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a)],r=.89+range(-.03,.06),matrix=pose(n,r,range(-1.5,1.5)),g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;
  const sx=range(.17,.28),sy=range(.16,.29),sz=range(.07,.12);
  for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j),rough=1+.15*Math.sin(x*17+y*23+i)*Math.sin(z*29+i);p.setXYZ(j,x*sx*rough,y*sy*rough,z*sz*rough);}g.computeVertexNormals();g.applyMatrix4(matrix);add(stone,g,[m.stone,m.chalk,m.slate,m.charcoal][i%4]);stoneCount++;
  for(let j=0;j<2;j++)patch(j===1?textiles:papers,pose([n[0]+range(-.10,.10),n[1]+range(-.09,.09),n[2]],r+.13+j*.035,range(-1.3,1.3)),range(.28,.44),range(.38,.67),[m.vellum,m.porcelain,m.greyLinen,m.silk,m.printed,m.linen][(i*2+j)%6],i*3+j,{fold:range(.025,.07),curl:range(.04,.12),taper:range(.65,.95)});
 }
 // Broad recessed rear and flank folios cover the mineral heart between bundles.
 [[[-.12,.25,-1],.58,.69,.27,m.greyPaper],[[.28,-.22,-1],.61,.57,-.32,m.linen],[[-.35,-.36,-1],.45,.64,.35,m.inkPaper],[[1,.04,-.06],.56,.67,-.18,m.greyLinen],[[-1,-.05,-.09],.48,.59,.28,m.printed]].forEach(([n,w,h,a,mat],i)=>patch(papers,pose(n,1.04,a),w,h,mat,160+i,{curl:.08,fold:.04}));
 // Tall rear paper pieces, worn and tilted, make an uneven upper contour.
 [[-.39,.96,.08,.55,.76,-.20,m.printed],[.04,1.01,-.12,.61,.73,.14,m.vellum],[.48,.97,-.08,.40,.68,-.17,m.silk],[-.91,.36,.10,.43,.72,-.42,m.greyPaper],[.96,-.35,.04,.43,.72,-.42,m.linen]].forEach(([x,y,z,w,h,a,mat],i)=>patch(papers,at([x,y,z],a,-.1,.12),w,h,mat,130+i,{fold:.075,curl:.11}));
 // A continuous descending stone band is broken into shallow laminated surfaces.
 const band=new T.CatmullRomCurve3([[-1.11,-.11,.70],[-.90,-.39,1.06],[-.64,-.64,1.23],[-.29,-.94,1.10],[.12,-1.17,.64]].map(V));
 for(let j=0;j<5;j++){
  const geo=surface((u,v)=>{const p=band.getPoint(v),t=band.getTangent(v),axis=V([t.y,-t.x,0]).normalize(),s=(u-.5)*(.10+.016*j)*(1+.07*Math.sin(v*27+j)-.14*Math.cos(v*11+j)),q=p.addScaledVector(axis,s);q.z+=j*.021+.0016*Math.sin(v*37+u*8);return q.toArray();},18,90);
  const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(.10+.016*j)/.36,uv.getY(i)*band.getLength()/.36);
  add(stone,geo,j===4?m.porcelain:j===3?m.vellum:j%2?m.porcelain:m.graphite);add(stone,reverse(geo,.012),m.graphite);patchCount++;
 }
 // Front collage: controlled angles and sizes keep distinct paper/cloth strata.
 const front=[
 [-.72,.56,.70,.48,.70,-.45,m.greyLinen],[-.40,.61,.98,.44,.64,.20,m.vellum],[.27,.53,.94,.59,.67,-.16,m.silk],[.69,.57,.56,.34,.65,-.36,m.linen],
 [-.86,.11,.61,.37,.63,-.31,m.graphite],[-.52,.13,.98,.37,.55,.54,m.vellum],[.28,.10,1.05,.47,.51,-.41,m.porcelain],[.77,.03,.73,.37,.75,-.55,m.silk],
 [-.77,-.36,.85,.40,.42,.54,m.linen],[-.48,-.43,1.10,.44,.65,-.54,m.vellum],[-.08,-.50,1.11,.51,.62,.32,m.silk],[.34,-.53,1.06,.53,.39,-.45,m.printed],[.72,-.46,.73,.45,.55,-.59,m.greyLinen],
 [-.21,-.89,.66,.45,.51,.51,m.greyPaper],[.22,-.88,.69,.55,.52,-.20,m.vellum],[.51,-.84,.44,.38,.52,-.44,m.silk]
 ];
 front.forEach(([x,y,z,w,h,a,mat],i)=>{patch(textiles,pose([x,y,z],Math.hypot(x,y,z),a),w,h,mat,180+i,{curl:.095,fold:.035});for(let j=0;j<(i%3===0?2:0);j++)patch(papers,at([x+range(-.12,.12),y+range(-.13,.13),z+.025+j*.022],a+range(-.7,.7)),w*range(.34,.63),h*range(.36,.7),[m.greyPaper,m.silk,m.vellum,m.linen][(i+j)%4],220+i*3+j,{curl:.055,fold:.025,thickness:.003,res:18});});
 // Narrow woven folds connect the stratified faces without enclosing the silhouette.
 function ribbon(points,widths,material,id){
  const path=new T.CatmullRomCurve3(points.map(V));
  const f=(u,v)=>{const p=path.getPoint(v),t=path.getTangent(v),axis=V([-t.y,t.x,0]).normalize(),n=v*(widths.length-1),i=Math.min(widths.length-2,Math.floor(n)),w=T.MathUtils.lerp(widths[i],widths[i+1],n-i),s=u-.5;p.addScaledVector(axis,s*w);p.z+=.095*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)+.011*Math.sin(v*8+id);return p.toArray();};
  const geo=surface(f,22,84);const normal=geo.attributes.normal;if(normal.getZ(Math.floor(normal.count/2))<0){const ix=geo.index;for(let i=0;i<ix.count;i+=3){const a=ix.getX(i);ix.setX(i,ix.getX(i+2));ix.setX(i+2,a);}geo.computeVertexNormals();}
  const uv=geo.attributes.uv,meanWidth=widths.reduce((a,b)=>a+b,0)/widths.length;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*meanWidth/.36,uv.getY(i)*path.getLength()/.36);
  add(textiles,geo,material);add(textiles,reverse(geo,.006),m.porcelain);patchCount++;
 }
 ribbon([[.60,.82,.50],[.41,.57,1.09],[.48,.16,1.19],[.25,-.19,1.28],[.16,-.58,1.16]],[.10,.16,.19,.12,.035],m.silk,1);
 ribbon([[-.68,.35,.85],[-.80,.07,1.01],[-.68,-.23,1.11],[-.40,-.45,1.22],[-.17,-.58,1.14]],[.045,.09,.12,.09,.03],m.linen,2);
 ribbon([[.64,.41,-.72],[.40,.05,-1.09],[.02,-.42,-1.08],[-.36,-.67,-.73]],[.09,.31,.28,.06],m.silk,3);
 // The crooked handwritten leaf is partially veiled, never a flat album projection.
 patch(calligraphy,at([-.06,.51,1.25],-.16,.025,.03),.43,.59,m.title,301,{curl:.026,fold:.012,taper:.92,res:32});
 const accents=[[-.69,.68,.94,.25,.58,-.30,m.cobalt],[-.59,.89,.68,.30,.32,.30,m.violet],[-.34,1.08,.39,.32,.24,-.16,m.pink],[.57,.88,.56,.25,.25,-.25,m.jade],[.89,.37,.57,.24,.29,.39,m.pink],[-.66,-.24,1.10,.28,.38,.31,m.greyLinen],[.50,-.77,.87,.36,.25,-.13,m.pink],[.02,-1.04,.50,.34,.21,.20,m.violet],[-.35,.53,-.98,.31,.43,.31,m.cobalt]];
 accents.forEach(([x,y,z,w,h,a,mat],i)=>patch(colour,at([x,y,z],a,0,z<0?Math.PI:0),w,h,mat,330+i,{curl:.09,fold:.035}));
 // Loose textile strands remain fine; the scan supplies the dense woven microstructure.
 [[-.72,.08,.98],[.73,-.25,.94],[-.03,-.86,.93],[-.42,.40,-1.01],[.74,-.31,-.76]].forEach((p,id)=>{
  const n=V(p).normalize(),up=V([.1,1,.08]).addScaledVector(n,-V([.1,1,.08]).dot(n)).normalize(),right=up.clone().cross(n),c=V(p);
  for(let j=0;j<34;j++){const ps=[],v=(j/33-.5)*.48;for(let k=0;k<=10;k++){const t=k/10,u=(t-.5)*(.48+.17*Math.sin(j*1.3)**2),s=v+.05*Math.sin(t*4+j*.63);ps.push(c.clone().addScaledVector(right,u).addScaledVector(up,s).addScaledVector(n,-(u*u+s*s)/2.5+.021*Math.sin(t*8+j*.3)).toArray());}add(fibers,tube(ps,.00085,11,3),j%6?m.thread:m.darkThread);fiberCount++;}
  for(let j=0;j<7;j++){const p=c.clone().addScaledVector(up,range(-.2,.2)).addScaledVector(right,range(-.2,.2)),q=p.clone().addScaledVector(up,range(.15,.31)).addScaledVector(right,range(-.15,.15));add(fibers,tube([p.toArray(),p.clone().lerp(q,.6).addScaledVector(n,.035).toArray(),q.toArray()],.0019,9,4),m.dry);fiberCount++;}
 });
 const paths=[
 [[-.45,-.25,1.12],[-.31,.02,1.42],[-.08,.11,1.50],[.22,.10,1.48],[.34,-.10,1.51],[.18,-.31,1.53],[-.17,-.29,1.50],[-.26,-.44,1.44],[-.03,-.58,1.47],[.12,-.82,1.39],[-.11,-.96,1.22],[-.30,-.88,1.0]],
 [[-.61,.29,1.04],[-.45,.07,1.25],[-.12,-.08,1.46],[.25,-.04,1.50],[.32,-.19,1.50],[-.06,-.32,1.52],[-.39,-.32,1.27]],
 [[.61,.54,-.61],[.96,.12,-.17],[.98,-.27,.73],[1.15,-.42,.94],[1.18,-.64,1.04],[1.00,-.77,1.10],[.88,-.63,1.18],[1.02,-.52,1.19],[1.13,-.69,.95],[.97,-.92,.66]],
 [[-.65,-.89,.15],[-1.07,-.48,-.32],[-.96,.23,-.67],[-.47,.79,-.87],[.10,.55,-1.13],[.44,.03,-1.21],[.14,-.65,-1.06]]
 ];
 paths.forEach((points,id)=>{const curve=new T.CatmullRomCurve3(points.map(V)),radius=id===0?.008:id===1?.0048:id===2?.006:.006;add(cords,new T.TubeGeometry(curve,180,radius,7,false),id===2?m.wine:m.cord);const frames=curve.computeFrenetFrames(130,false);for(let j=0;j<4;j++){const ps=[];for(let k=0;k<=130;k++){const a=k*.73+j*TAU/4;ps.push(curve.getPoint(k/130).addScaledVector(frames.normals[k],Math.cos(a)*radius).addScaledVector(frames.binormals[k],Math.sin(a)*radius).toArray());}add(cords,tube(ps,.00065,132,3),j%2?m.scarlet:m.wine);}});
 [[[-.85,.86,.64],[-.70,.58,1.04],[-.29,.18,1.36],[-.17,-.09,1.41],[-.49,-.34,1.34]],[[.19,-1.13,.49],[.67,-.81,.91],[.72,-.47,1.20],[.46,-.25,1.42],[.10,-.25,1.45],[-.17,-.35,1.37]]].forEach((p,i)=>add(cords,tube(p,i?.0045:.0048,95,5),i?m.thread:m.jade));
 // Fine folded red textile peeks out behind the lower cord.
 patch(colour,at([.33,-.27,1.25],-.48),.25,.15,m.wine,354,{curl:.075,fold:.085});
 const blossoms=[[-.34,1.05,.62,.12,m.burgundy],[-.51,.93,.94,.08,m.flower],[-.35,-.85,1.10,.10,m.burgundy],[.15,-.90,1.17,.16,m.flower],[.59,-.68,1.07,.10,m.burgundy],[.83,.34,.64,.11,m.flower],[-.53,-.37,-.94,.10,m.flower],[.49,.48,-.95,.095,m.burgundy]];
 blossoms.forEach(([x,y,z,r,mat],id)=>{const matrix=at([x,y,z],id*.9,.1,z<0?Math.PI:0);for(let j=0;j<17;j++){const a=j*2.39996,len=r*range(.63,1.23),f=(u,v)=>{const s=u-.5,p=V([Math.cos(a)*len*v-Math.sin(a)*s*r*.63*Math.sin(Math.PI*v)**.65,Math.sin(a)*len*v+Math.cos(a)*s*r*.63*Math.sin(Math.PI*v)**.65,.019*Math.sin(v*5+j)+.021*Math.sin(Math.PI*v)+.010*Math.sin(u*7+j)*v]);return p.applyMatrix4(matrix).toArray();};add(flowers,surface(f,7,11),mat);petalCount++;}flowerCount++;});
 // Authored material clusters follow the reference's diagonal, with calmer paper between them.
 const clusters=[[-.62,.22,1.18,.40,.42,-.48],[.57,.30,1.10,.31,.45,.29],[-.53,-.50,1.17,.38,.34,-.72],[.44,-.72,.95,.34,.36,.38],[-.43,.16,-1.03,.35,.43,-.30],[.98,-.14,.22,.34,.42,.26]];
 clusters.forEach(([x,y,z,w,h,a],id)=>{
  for(let j=0;j<6;j++){
   const p=[x+range(-.095,.095),y+range(-.095,.095),z+(z<0?-1:1)*(.014+j*.011)];
   patch(j%3?papers:textiles,pose(p,Math.hypot(...p),a+range(-.42,.42)),w*range(.38,.76),h*range(.47,.86),[m.greyPaper,m.inkPaper,m.porcelain,m.linen,m.printed,m.vellum][(j+id)%6],410+id*8+j,{curl:range(.04,.12),fold:range(.025,.055),taper:range(.40,.83),res:18});
  }
  for(let j=0;j<2;j++){const p=[x+(j-.5)*.10,y-.05,z+(z<0?-.07:.08)];patch(textiles,pose(p,Math.hypot(...p),a-.22+j*.2),.045+j*.025,.27+j*.055,m.foil,480+id*2+j,{curl:.13,fold:.025,taper:.5,res:18});}
 });
 // Exposed slivers of mineral anchor the paper seams rather than make a second shell.
 [[-.77,-.22,1.02],[-.65,-.58,1.14],[-.44,-.79,.98],[.53,-.45,1.13],[.72,-.47,.83],[.82,.16,.81],[-.79,.48,.84],[-.13,.91,.75],[.69,.58,.50],[.39,-.66,-.79],[-.48,.31,-.98],[-.87,-.20,-.46]].forEach((p,id)=>{
  const g=new T.IcosahedronGeometry(1,1);g.scale(.045+id%3*.014,.085+id%4*.014,.014+id%2*.009);g.applyMatrix4(pose(p,Math.hypot(...p),id*.83));add(stone,g,[m.porcelain,m.slate,m.chalk,m.graphite][id%4]);stoneCount++;
 });
 // Real warp and weft. Curved, broken edge threads are separate from the albedo weave.
 function meshPanel(p,w,h,a,id){
  const matrix=pose(p,Math.hypot(...p),a),point=(u,v)=>V([(u-.5)*w,(v-.5)*h,.018*Math.sin(u*8+v*3)+.037*Math.sin(v*5+id)-((u-.5)**2*w*w+(v-.5)**2*h*h)/2.3]).applyMatrix4(matrix).toArray();
  for(const axis of [0,1])for(let j=0;j<(axis?25:29);j++){
   const count=axis?25:29,t=(j+.3)/count,ps=[];
   for(let k=0;k<=14;k++){const s=k/14,drift=.009*Math.sin(k*.63+j*.81),u=axis?s:t+drift,v=axis?t+drift:s;ps.push(point(u,v));}
   add(fibers,tube(ps,j%7===0?.00125:.00085,16,3),j%7===0?m.wire:m.silver);fiberCount++;
  }
  for(let j=0;j<9;j++){const t=(j+.5)/9,ps=[point(0,t),point(-.045,t+.012),point(-.09,t+.034)];add(fibers,tube(ps,.0009,5,3),m.thread);fiberCount++;}
  weavePanels++;
 }
 [[[-.69,-.15,1.23],.46,.54,.42],[[.58,-.24,1.24],.37,.43,-.22],[[-.18,-.81,1.17],.50,.30,.19],[[.39,.28,-1.08],.43,.54,.21],[[-.97,.04,.20],.38,.47,-.29]].forEach(([p,w,h,a],i)=>meshPanel(p,w,h,a,i));
 // A bound flax fan is the warm, finely woven centre of the lower reference collage.
 const fanPoint=(u,v)=>V([-.44+.74*v+.065*u*(1-v),-.77+.28*v+(u-.5)*(.28-.25*v)+.017*Math.sin(u*11+v*6),1.43+.035*Math.sin(Math.PI*v)+.009*Math.sin(u*31+v*9)]);
 for(let j=0;j<86;j++){
  const ps=[],start=.03+.085*Math.sin(j*1.91)**2,end=.89+.10*Math.sin(j*.77)**2;for(let k=0;k<=18;k++)ps.push(fanPoint(j/85,start+(end-start)*k/18).toArray());
  add(fibers,tube(ps,j%9===0?.0020:.00115,20,4),j%4?m.reed:m.paleReed);fiberCount++;reedStrands++;
 }
 for(let j=0;j<8;j++){
  const ps=[];for(let k=0;k<=24;k++){const p=fanPoint(k/24,(j+1)/10);p.z+=.003*Math.cos(k*Math.PI);ps.push(p.toArray());}
  add(fibers,tube(ps,.0013,26,3),j%3?m.thread:m.wire);fiberCount++;
 }
 for(let j=0;j<3;j++){const ps=[];for(let k=0;k<=60;k++){const a=k/60*TAU;ps.push([.18+j*.015+.035*Math.sin(a),-.53+.057*Math.cos(a),1.452+.018*Math.sin(a)]);}add(fibers,tube(ps,.0021,60,4),m.wire);}
 patch(textiles,at([-.43,-.69,1.46],-.72),.14,.25,m.tissue,560,{curl:.07,fold:.025,taper:.55});
 for(let j=0;j<14;j++){const a=j*.67,ps=[];for(let k=0;k<=36;k++){const t=k/36;ps.push([-.25+.20*Math.cos(a)*t+.07*Math.sin(t*6+j),-.66+.11*Math.sin(a)*t+.025*Math.sin(t*7+j),1.455+.018*Math.sin(t*5+j)]);}add(fibers,tube(ps,.0010,37,3),j%3?m.reed:m.paleReed);fiberCount++;}
 [[-.18,-.16,1.29,.20,.28,-.57,m.printed],[.01,-.26,1.35,.19,.31,.49,m.greyPaper],[-.32,.00,1.29,.13,.22,.29,m.foil]].forEach(([x,y,z,w,h,a,mat],i)=>patch(papers,at([x,y,z],a),w,h,mat,575+i,{curl:.07,fold:.03,taper:.48,res:18}));
 // Pressed stems and scattered small petals carry the printed flowers into real space.
 const sprigs=[[-.59,.62,1.17,-.52],[.78,.02,1.06,-.28],[-.46,-.83,1.13,.47],[.41,-.64,1.32,-.63],[-.41,.43,-1.06,.22],[.96,-.31,.23,.35]];
 sprigs.forEach(([x,y,z,a],id)=>{
  const matrix=pose([x,y,z],Math.hypot(x,y,z),a),length=.26+(id%3)*.045,pt=(x,y,z)=>V([x,y,z]).applyMatrix4(matrix).toArray();
  add(flowers,tube([pt(0,-length*.5,0),pt(.015,0,.016),pt(-.018,length*.5,.005)],.0018,20,4),m.dry);
  for(let j=0;j<7;j++){
   const side=j%2?1:-1,cy=-length*.36+j*length*.11,cx=side*.023,len=.065+(j%3)*.018;
   add(flowers,tube([pt(.01,cy,0),pt(side*.04,cy+.021,.009),pt(side*.07,cy+.04,.014)],.0011,9,3),m.wire);
   const geo=surface((u,v)=>{const s=u-.5,yy=cy+v*len,xx=cx+side*v*len*.73+s*.047*Math.sin(Math.PI*v)**.75;return pt(xx,yy,.014+.018*Math.sin(Math.PI*v)+.006*Math.sin(u*7+j));},8,12);
   add(flowers,geo,[m.leafPaper,m.flower,m.burgundy,m.greyPaper][(j+id)%4]);petalCount++;
  }
  const bud=new T.IcosahedronGeometry(.016,1);bud.scale(.8,1.3,.65);bud.translate(-.018,length*.5,.008);bud.applyMatrix4(matrix);add(flowers,bud,id%2?m.burgundy:m.paleReed);sprigCount++;
 });
 // Fine open silver loops and red folded tape echo the lower-right knot of the cover.
 [[-.57,.05,1.34,.13,.20,.20],[.67,-.34,1.34,.11,.15,-.30],[-.08,-.83,1.35,.14,.08,.37]].forEach(([x,y,z,w,h,a],id)=>{
  const ps=[];for(let j=0;j<=70;j++){const t=j/70*TAU*.83+.2,xx=Math.cos(t)*w,yy=Math.sin(t)*h;ps.push([x+xx*Math.cos(a)-yy*Math.sin(a),y+xx*Math.sin(a)+yy*Math.cos(a),z+.025*Math.sin(t*2)]);}
  add(fibers,tube(ps,.0017,70,4),m.silver);fiberCount++;
 });
 ribbon([[.84,-.30,.94],[1.03,-.40,1.12],[1.09,-.61,1.19],[.92,-.76,1.13],[.85,-.66,1.09]],[.018,.030,.042,.025,.008],m.wine,7);
 [[-.63,.78,1.08,.16,.24,-.2,m.cobalt],[-.50,.88,.98,.16,.15,.4,m.pink],[.53,.80,.83,.13,.18,-.3,m.ochre],[.77,.39,.87,.17,.22,.3,m.pink],[-.23,-.96,.91,.19,.13,-.4,m.violet],[.41,-.84,1.02,.17,.13,.3,m.pink]].forEach(([x,y,z,w,h,a,mat],i)=>patch(colour,at([x,y,z],a),w,h,mat,600+i,{curl:.055,fold:.025,taper:.54,res:18}));

 // Clouds are independent curved translucent membranes and survive GLB export.
 [[.27,.73,1.69,1.13,1.02,-.22],[.53,.72,1.74,.96,1.02,.34],[.29,1.30,.81,1.02,.76,-.23],[-.16,.99,1.52,.90,.48,.14],[.87,.24,1.08,.47,.87,.25],[.42,.61,-1.18,.86,.93,-.16]].forEach(([x,y,z,w,h,a],id)=>{const matrix=at([x,y,z],a,.08,z<0?Math.PI:0),geo=surface((u,v)=>V([(u-.5)*w,(v-.5)*h,.055*Math.sin(u*7+v*5+id)]).applyMatrix4(matrix).toArray(),24,24);solid(haze,geo,id===1?m.warmMist:id===4?m.veil:m.mist,'mist membrane '+id);});
 // Large partial brush lettering is a real scene layer behind the material mass.
 [['之',-.83,.88,1.038,.604,-.035],['见',-.874,.05,1.015,1.208,-.055],['以',.938,.827,.773,.966,.025],['我',.865,-.024,.942,1.19,.025]].forEach(([letter,x,y,w,h,a])=>{const g=new T.PlaneGeometry(w,h);g.applyMatrix4(at([x,y,1.60],a));solid(lettering,g,m['glyph'+letter],'original brush '+letter);});
 for(const {g,mat,geos} of pending.values()){const merged=mergeGeometries(geos);geos.forEach(x=>x.dispose());solid(g,merged,mat,g.name+' / '+mat.name);}
 let meshCount=0,triangleCount=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 root.userData={title:'以我之见',englishTitle:'The Way I See',version:'0.37.0',sceneVersion:'0.37.0',artRevision:5,solidCore:true,bodyAxes:[1,1,1],bodyRadius:.86,bodyCenter:center.toArray(),patchCount,stoneCount,cordCount:paths.length,fiberCount,flowerCount,petalCount,weavePanels,reedStrands,sprigCount,mistLayers:6,brushGlyphs:4,meshCount,triangleCount,exportPrimitiveCount:meshCount,layers:groups.map(g=>g.name),detailTargets:{paper:[-.10,.57,1.19],cords:[-.03,-.33,1.37],strata:[-.41,-.79,.99]},structure:'Equal-axis reference-led assemblage with clustered mineral flakes, layered printed paper, silver mesh, a woven reed fan, pressed botanical sprigs, cobalt fabric and warm gauze mist. Four large original brush glyphs frame the material mass and a written leaf. Four red silk paths pass through the lower strata. Side and back are authored three-dimensional continuations.',referenceBasis:'User supplied The Way I See cover and lyrics. Original geometry, original brush paths and an AI-generated macro material atlas; no whole reference image is projected or published.',visualStatus:'Render inspection is recorded separately; geometry metadata is not human approval.'};
 return {root,groups,ready:m.ready,setFrameFacing(value){const a=T.MathUtils.smoothstep(value,.58,.94);lettering.visible=a>.012;for(const letter of ['之','见','以','我'])m['glyph'+letter].opacity=a;root.userData.frameOpacity=a;},setSeparated(value){const a=T.MathUtils.clamp(Number(value)||0,0,1);groups.forEach(g=>g.position.fromArray(g.userData.restPosition).addScaledVector(V(g.userData.separation),a));},dispose(){root.traverse(o=>{if(o.geometry)o.geometry.dispose();});m.dispose();}};
}
