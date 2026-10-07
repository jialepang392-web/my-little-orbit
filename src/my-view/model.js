import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials} from './materials.js?v=0350';

const TAU=Math.PI*2,V=p=>new T.Vector3(...p);
function surface(f,nu=24,nv=22){const p=[],uv=[],ix=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...f(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;ix.push(a,a+1,b,b,a+1,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;}
function tube(points,r=.006,n=32,sides=5){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),n,r,sides,false);}
function reverse(geo,thickness){const g=geo.clone(),p=g.attributes.position,n=g.attributes.normal,ix=g.index;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)-n.getX(i)*thickness,p.getY(i)-n.getY(i)*thickness,p.getZ(i)-n.getZ(i)*thickness);for(let i=0;i<ix.count;i+=3){const a=ix.getX(i);ix.setX(i,ix.getX(i+2));ix.setX(i+2,a);}g.computeVertexNormals();return g;}
export function makeMyView(){
 const root=new T.Group(),groups=[],m=makeMaterials(),pending=new Map();root.name='以我之见 / The Way I See';
 let state=350703,patchCount=0,stoneCount=0,fiberCount=0,petalCount=0,flowerCount=0;
 const rnd=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296),range=(a,b)=>a+(b-a)*rnd(),center=V([0,-.06,0]);
 function layer(name,offset){const g=new T.Group();g.name=name;g.userData.separation=offset;g.userData.restPosition=[0,0,0];root.add(g);groups.push(g);return g;}
 function add(g,geo,mat){if(!geo.index)geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i));const key=g.id+':'+mat.id;if(!pending.has(key))pending.set(key,{g,mat,geos:[]});pending.get(key).geos.push(geo);}
 function solid(g,geo,mat,name){const mesh=new T.Mesh(geo,mat);mesh.name=name;mesh.castShadow=mesh.receiveShadow=!mat.transparent&&!mat.alphaTest;if(mat.transparent)mesh.renderOrder=3;g.add(mesh);return mesh;}
 function at(p,a=0,rx=0,ry=0){return new T.Matrix4().compose(V(p),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,a)),V([1,1,1]));}
 function pose(n,radius,angle=0){const normal=V(n).normalize(),q=new T.Quaternion().setFromUnitVectors(V([0,0,1]),normal).multiply(new T.Quaternion().setFromAxisAngle(V([0,0,1]),angle));return new T.Matrix4().compose(normal.multiplyScalar(radius).add(center),q,V([1,1,1]));}
 const stone=layer('01 / mineral heart and a long diagonal broken stone band',[.012,-.035,-.035]);
 const coreGeo=new T.IcosahedronGeometry(.86,5),cp=coreGeo.attributes.position;
 for(let i=0;i<cp.count;i++){const v=new T.Vector3().fromBufferAttribute(cp,i),n=v.clone().normalize();v.setLength(.86+.022*Math.sin(n.x*19+n.y*7)*Math.cos(n.z*17)).add(center);cp.setXYZ(i,v.x,v.y,v.z);}coreGeo.computeVertexNormals();
 const core=solid(stone,coreGeo,m.charcoal,'recessed equal-axis mineral heart');core.userData={solidCore:true,radius:.86,axes:[1,1,1],center:center.toArray()};
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
  if(id%3===0)for(const side of [0,1])for(let j=0;j<14;j++){const t=(j+.4)/14,p=V(f(side,t)).applyMatrix4(matrix),q=V(f(side?.96:.04,t)).applyMatrix4(matrix),end=p.clone().addScaledVector(p.clone().sub(q).normalize(),range(.008,.035)).add(V([range(-.005,.005),-.009,.006]));add(fibers,tube([p.toArray(),p.clone().lerp(end,.5).add(V([0,.007,.004])).toArray(),end.toArray()],.00085,4,3),m.thread);fiberCount++;}
  return f;
 }
 // Recessed volumes and bundled folds surround the heart in every direction.
 // The front composition is authored below rather than produced by a tiled shell.
 for(let i=0;i<36;i++){
  const y=1-2*(i+.5)/36,a=i*2.399963,n=[Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a)],r=.89+range(-.03,.06),matrix=pose(n,r,range(-1.5,1.5)),g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;
  const sx=range(.17,.28),sy=range(.16,.29),sz=range(.07,.12);
  for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j),rough=1+.15*Math.sin(x*17+y*23+i)*Math.sin(z*29+i);p.setXYZ(j,x*sx*rough,y*sy*rough,z*sz*rough);}g.computeVertexNormals();g.applyMatrix4(matrix);add(stone,g,[m.stone,m.chalk,m.slate,m.charcoal][i%4]);stoneCount++;
  for(let j=0;j<3;j++)patch(j===1?textiles:papers,pose([n[0]+range(-.10,.10),n[1]+range(-.09,.09),n[2]],r+.13+j*.035,range(-1.3,1.3)),range(.22,.42),range(.31,.64),[m.greyPaper,m.linen,m.inkPaper,m.greyLinen,m.foil,m.leafPaper][(i*3+j)%6],i*3+j,{fold:range(.025,.07),curl:range(.04,.12),taper:range(.65,.95)});
 }
 // Broad recessed rear and flank folios cover the mineral heart between bundles.
 [[[-.12,.25,-1],.58,.69,.27,m.greyPaper],[[.28,-.22,-1],.61,.57,-.32,m.linen],[[-.35,-.36,-1],.45,.64,.35,m.inkPaper],[[1,.04,-.06],.56,.67,-.18,m.greyLinen],[[-1,-.05,-.09],.48,.59,.28,m.printed]].forEach(([n,w,h,a,mat],i)=>patch(papers,pose(n,1.04,a),w,h,mat,160+i,{curl:.08,fold:.04}));
 // Tall rear paper pieces, worn and tilted, make an uneven upper contour.
 [[-.39,1.00,.08,.57,.93,-.20,m.inkPaper],[.04,1.08,-.12,.67,.86,.14,m.greyPaper],[.48,1.06,-.08,.41,.75,-.17,m.pale],[-.91,.44,.10,.43,.77,-.42,m.inkPaper],[.96,-.35,.04,.46,.86,-.42,m.linen]].forEach(([x,y,z,w,h,a,mat],i)=>patch(papers,at([x,y,z],a,-.1,.12),w,h,mat,130+i,{fold:.075,curl:.11}));
 // A continuous descending stone band is broken into shallow laminated surfaces.
 const band=new T.CatmullRomCurve3([[-1.25,-.18,.86],[-.96,-.46,1.15],[-.58,-.78,1.27],[-.19,-1.01,1.05],[.14,-1.21,.63]].map(V));
 for(let j=0;j<5;j++){
  const geo=surface((u,v)=>{const p=band.getPoint(v),t=band.getTangent(v),axis=V([t.y,-t.x,0]).normalize(),s=(u-.5)*(.14+.024*j)*(1+.10*Math.sin(v*45+j)),q=p.addScaledVector(axis,s);q.z+=j*.021+.007*Math.sin(v*109+u*23);return q.toArray();},18,90);
  add(stone,geo,j===4?m.stone:j===3?m.pale:j%2?m.chalk:m.charcoal);add(stone,reverse(geo,.018),m.charcoal);patchCount++;
 }
 // Front collage: controlled angles and sizes keep distinct paper/cloth strata.
 const front=[
 [-.72,.56,.70,.49,.73,-.45,m.greyLinen],[-.40,.61,.98,.45,.72,.20,m.printed],[.27,.53,.94,.60,.64,-.16,m.pale],[.69,.57,.56,.36,.77,-.36,m.linen],
 [-.86,.11,.61,.37,.63,-.31,m.inkPaper],[-.52,.13,.98,.37,.55,.54,m.leafPaper],[.28,.10,1.05,.47,.51,-.41,m.foil],[.77,.03,.73,.37,.75,-.55,m.greyPaper],
 [-.77,-.36,.85,.40,.42,.54,m.greyLinen],[-.48,-.43,1.10,.40,.59,-.54,m.paper],[-.08,-.50,1.11,.47,.56,.32,m.linen],[.34,-.53,1.06,.53,.39,-.45,m.printed],[.72,-.46,.73,.45,.55,-.59,m.greyLinen],
 [-.21,-.89,.66,.45,.51,.51,m.inkPaper],[.22,-.88,.69,.55,.52,-.20,m.paper],[.51,-.84,.44,.38,.52,-.44,m.linen]
 ];
 front.forEach(([x,y,z,w,h,a,mat],i)=>{patch(textiles,at([x,y,z],a,.12*Math.sin(i),.12*Math.cos(i)),w,h,mat,180+i,{curl:.11,fold:.065});for(let j=0;j<3;j++)patch(papers,at([x+range(-.12,.12),y+range(-.13,.13),z+.025+j*.022],a+range(-.7,.7)),w*range(.34,.63),h*range(.36,.7),[m.greyPaper,m.foil,m.inkPaper,m.linen][(i+j)%4],220+i*3+j,{curl:.055,fold:.025,thickness:.003,res:18});});
 // The crooked handwritten leaf is partially veiled, never a flat album projection.
 patch(calligraphy,at([-.13,.45,1.25],-.20,.025,.03),.59,.79,m.title,301,{curl:.026,fold:.012,taper:.92,res:32});
 const accents=[[-.69,.68,.94,.25,.58,-.30,m.cobalt],[-.59,.89,.68,.30,.32,.30,m.violet],[-.34,1.08,.39,.32,.24,-.16,m.pink],[.57,.88,.56,.25,.25,-.25,m.jade],[.89,.37,.57,.24,.29,.39,m.pink],[-.66,-.24,1.10,.28,.38,.31,m.greyLinen],[.50,-.77,.87,.36,.25,-.13,m.pink],[.02,-1.04,.50,.34,.21,.20,m.violet],[-.35,.53,-.98,.31,.43,.31,m.cobalt]];
 accents.forEach(([x,y,z,w,h,a,mat],i)=>patch(colour,at([x,y,z],a,0,z<0?Math.PI:0),w,h,mat,330+i,{curl:.09,fold:.035}));
 // Loose textile strands remain fine; the scan supplies the dense woven microstructure.
 [[-.72,.08,.98],[.73,-.25,.94],[-.03,-.86,.93],[-.42,.40,-1.01],[.74,-.31,-.76]].forEach((p,id)=>{
  const n=V(p).normalize(),up=V([.1,1,.08]).addScaledVector(n,-V([.1,1,.08]).dot(n)).normalize(),right=up.clone().cross(n),c=V(p);
  for(let j=0;j<72;j++){const ps=[],v=(j/71-.5)*.57;for(let k=0;k<=10;k++){const t=k/10,u=(t-.5)*(.48+.17*Math.sin(j*1.3)**2),s=v+.05*Math.sin(t*4+j*.63);ps.push(c.clone().addScaledVector(right,u).addScaledVector(up,s).addScaledVector(n,-(u*u+s*s)/2.5+.021*Math.sin(t*8+j*.3)).toArray());}add(fibers,tube(ps,.00085,11,3),j%6?m.thread:m.darkThread);fiberCount++;}
  for(let j=0;j<13;j++){const p=c.clone().addScaledVector(up,range(-.2,.2)).addScaledVector(right,range(-.2,.2)),q=p.clone().addScaledVector(up,range(.15,.31)).addScaledVector(right,range(-.15,.15));add(fibers,tube([p.toArray(),p.clone().lerp(q,.6).addScaledVector(n,.035).toArray(),q.toArray()],.0019,9,4),m.dry);fiberCount++;}
 });
 const paths=[
 [[-.54,-.27,1.09],[-.40,.02,1.39],[-.12,.19,1.47],[.27,.23,1.42],[.40,.02,1.47],[.29,-.22,1.52],[-.13,-.26,1.51],[-.26,-.43,1.46],[.06,-.58,1.46],[.25,-.83,1.26],[-.10,-1.02,1.04],[-.40,-.91,.69]],
 [[-.49,-.30,1.17],[-.34,-.09,1.49],[-.12,.11,1.48],[.15,.20,1.45],[.28,-.06,1.51],[.04,-.22,1.55],[-.33,-.23,1.49],[-.51,-.35,1.21]],
 [[.66,.52,-.65],[1.02,.12,-.23],[1.07,-.38,.56],[1.25,-.54,.75],[1.22,-.73,.86],[.97,-.79,.94],[1.05,-1.03,.84]],
 [[-.65,-.89,.15],[-1.07,-.48,-.32],[-.96,.23,-.67],[-.47,.79,-.87],[.10,.55,-1.13],[.44,.03,-1.21],[.14,-.65,-1.06]]
 ];
 paths.forEach((points,id)=>{const curve=new T.CatmullRomCurve3(points.map(V)),radius=id===0?.011:id===1?.006:id===2?.008:.007;add(cords,new T.TubeGeometry(curve,180,radius,7,false),id===2?m.wine:m.cord);const frames=curve.computeFrenetFrames(130,false);for(let j=0;j<4;j++){const ps=[];for(let k=0;k<=130;k++){const a=k*.73+j*TAU/4;ps.push(curve.getPoint(k/130).addScaledVector(frames.normals[k],Math.cos(a)*radius).addScaledVector(frames.binormals[k],Math.sin(a)*radius).toArray());}add(cords,tube(ps,.00065,132,3),j%2?m.scarlet:m.wine);}});
 [[[-.85,.86,.64],[-.70,.58,1.04],[-.29,.18,1.36],[-.17,-.09,1.41],[-.49,-.34,1.34]],[[.19,-1.23,.29],[.70,-.81,.64],[.76,-.42,1.02],[.38,-.19,1.44],[-.24,-.12,1.43]]].forEach((p,i)=>add(cords,tube(p,i?.006:.009,95,5),i?m.thread:m.jade));
 // Fine folded red textile peeks out behind the lower cord.
 patch(colour,at([.33,-.27,1.25],-.48),.41,.22,m.red,354,{curl:.075,fold:.085});
 const blossoms=[[-.34,1.05,.62,.12,m.burgundy],[-.51,.93,.94,.08,m.flower],[-.29,-.99,.79,.12,m.burgundy],[.14,-1.07,.71,.14,m.flower],[.58,-.74,.91,.08,m.burgundy],[.83,.34,.64,.11,m.flower],[-.53,-.37,-.94,.10,m.flower],[.49,.48,-.95,.095,m.burgundy]];
 blossoms.forEach(([x,y,z,r,mat],id)=>{const matrix=at([x,y,z],id*.9,.1,z<0?Math.PI:0);for(let j=0;j<17;j++){const a=j*2.39996,len=r*range(.63,1.23),f=(u,v)=>{const s=u-.5,p=V([Math.cos(a)*len*v-Math.sin(a)*s*r*.63*Math.sin(Math.PI*v)**.65,Math.sin(a)*len*v+Math.cos(a)*s*r*.63*Math.sin(Math.PI*v)**.65,.023*Math.sin(v*5+j)+.019*Math.sin(u*7+j)*v]);return p.applyMatrix4(matrix).toArray();};add(flowers,surface(f,7,11),mat);petalCount++;}flowerCount++;});
 // Clouds are independent curved translucent membranes and survive GLB export.
 [[.30,.77,1.59,1.28,1.38,-.22],[.62,.81,1.63,1.14,1.27,.34],[.29,1.30,.81,1.02,.76,-.23],[-.16,.99,1.52,.90,.48,.14],[.87,.24,1.08,.47,.87,.25],[.42,.61,-1.18,.86,.93,-.16]].forEach(([x,y,z,w,h,a],id)=>{const matrix=at([x,y,z],a,.08,z<0?Math.PI:0),geo=surface((u,v)=>V([(u-.5)*w,(v-.5)*h,.055*Math.sin(u*7+v*5+id)]).applyMatrix4(matrix).toArray(),24,24);solid(haze,geo,id===1?m.warmMist:id===4?m.veil:m.mist,'mist membrane '+id);});
 // Large partial brush lettering is a real scene layer behind the material mass.
 [['之',-1.22,1.03,1.13,1.01,-.05],['见',-1.18,.02,1.17,1.25,-.08],['以',1.16,1.03,1.13,1.47,.06],['我',1.15,-.13,1.33,1.51,.025]].forEach(([letter,x,y,w,h,a])=>{const g=new T.PlaneGeometry(w,h);g.applyMatrix4(at([x,y,.28],a));solid(lettering,g,m['glyph'+letter],'original brush '+letter);});
 for(const {g,mat,geos} of pending.values()){const merged=mergeGeometries(geos);geos.forEach(x=>x.dispose());solid(g,merged,mat,g.name+' / '+mat.name);}
 let meshCount=0,triangleCount=0;root.traverse(o=>{if(o.isMesh){meshCount++;triangleCount+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 root.userData={title:'以我之见',englishTitle:'The Way I See',version:'0.35.0',sceneVersion:'0.35.0',artRevision:2,solidCore:true,bodyAxes:[1,1,1],bodyRadius:.86,bodyCenter:center.toArray(),patchCount,stoneCount,cordCount:paths.length,fiberCount,flowerCount,petalCount,mistLayers:6,brushGlyphs:4,meshCount,triangleCount,exportPrimitiveCount:meshCount,layers:groups.map(g=>g.name),detailTargets:{paper:[-.10,.57,1.19],cords:[-.03,-.33,1.37],strata:[-.41,-.79,.99]},structure:'Dense irregular equal-axis assemblage with a continuous diagonal stone band, worn printed paper, upper-left cobalt fabric, translucent warm mist, central handwritten leaf and four original peripheral brush glyphs. Four red silk paths pass through the lower strata. Side and back are authored three-dimensional continuations.',referenceBasis:'User supplied The Way I See cover and lyrics. Original geometry, original brush paths and an AI-generated macro material atlas; no whole reference image is projected or published.',visualStatus:'Render inspection is recorded separately; geometry metadata is not human approval.'};
 return {root,groups,ready:m.ready,setSeparated(value){const a=T.MathUtils.clamp(Number(value)||0,0,1);groups.forEach(g=>g.position.fromArray(g.userData.restPosition).addScaledVector(V(g.userData.separation),a));},dispose(){root.traverse(o=>{if(o.geometry)o.geometry.dispose();});m.dispose();}};
}
