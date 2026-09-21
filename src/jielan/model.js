import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMaterials} from './materials.js?v=0180';

const V=p=>new T.Vector3(...p);
function surface(fn,nu=48,nv=32){
  const p=[],uv=[],ix=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...fn(i/nu,j/nv));uv.push(i/nu,j/nv);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;ix.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
const tube=(pts,r=.008,steps=32)=>new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(V)),steps,r,5,false);
export function makeJielan(){
  const root=new T.Group(),groups=[],m=makeMaterials();root.name='JIE-LAN';
  function layer(name,offset){const g=new T.Group();g.name=name;g.userData.separation=offset;groups.push(g);root.add(g);return g;}
  function mesh(g,geo,mat){const o=new T.Mesh(geo,mat);o.castShadow=!(mat.transmission>0);o.receiveShadow=true;g.add(o);return o;}
  function batch(g,geos,mat){if(!geos.length)return;const geo=mergeGeometries(geos);geos.forEach(x=>x.dispose());return mesh(g,geo,mat);}
  const ceramics=layer('01 / broken cobalt porcelain, warm unglazed edges',[.14,-.15,0]);
  // Broad dish sectors: upper and lower skins joined by real warm ceramic walls.
  function dish(radius,start,span,pos,rot){
    const g=new T.Group();ceramics.add(g);g.position.set(...pos);g.rotation.set(...rot);
    const f=(u,v,z=0)=>{const a=start+u*span+.028*Math.sin(v*17+start)*Math.pow(Math.abs(u-.5)*2,10),r=radius*(.28+.72*v)*(1+.035*Math.sin(a*7)+.016*Math.sin(a*19));return [Math.cos(a)*r,Math.sin(a)*r,.13+.42*v**3+z+.055*Math.sin(a*5)*v];};
    mesh(g,surface((u,v)=>f(u,v)),m.blue);mesh(g,surface((u,v)=>f(u,v,-.065)),m.porcelain);
    for(const end of [0,1])mesh(g,surface((u,v)=>{const a=f(u,end,-.065*v);return a;},64,2),m.porcelain);
    for(const end of [0,1])mesh(g,surface((u,v)=>f(end,u,-.065*v),32,2),m.porcelain);
    const rim=[];for(let i=0;i<=90;i++)rim.push(f(i/90,.987,.005));mesh(g,tube(rim,.022,100),m.blue);
  }
  dish(1.43,3.12,1.1,[-.05,-.16,-.02],[-.18,-.23,.11]);
  dish(1.47,4.37,.96,[.19,-.24,-.24],[.1,.13,-.03]);
  dish(1.29,5.51,.83,[.4,-.12,-.04],[-.15,-.35,.1]);
  dish(1.18,-.4,1.62,[.51,.06,-.58],[.15,.35,-.24]);
  dish(.93,.67,1.2,[-.3,.06,-.76],[.1,2.92,.2]);
  dish(.49,3.15,1.55,[-.76,-.61,.38],[.42,-.54,-.4]);
  dish(.52,4.01,1.35,[.78,-.85,.12],[.51,.6,.37]);
  const cloth=layer('02 / folded sage linen, drape and stitched hems',[.38,-.18,-.18]);
  const seams=[];
  function fabric(w,h,pos,rot,mode,phase,pale=false){
    const g=new T.Group();cloth.add(g);g.position.set(...pos);g.rotation.set(...rot);
    const f=(u,v)=>{const s=u-.5,top=Math.pow(v,6),angle=v*2.7+phase,fold=Math.exp(-Math.pow((u-.31-.07*Math.sin(v*3+phase))/.13,2));
      let x=s*w*(.84+.16*Math.sin(v*2+phase))+.16*Math.sin(v*3+phase),y=(v-.5)*h+.14*s+.07*Math.sin(u*5+phase),z=.1*Math.sin(u*7+v*3+phase)+.19*fold*Math.sin(v*2+.4);
      if(mode==='pocket'){y-=top*(.18+.13*Math.sin(u*3+phase));z+=.55*s*s+.38*Math.sin(angle)*top+.2*Math.sin(u*4+phase)*v;x+=.14*top*Math.cos(angle);}
      else {x+=.18*Math.sin(v*3.4+phase)*v;z+=.23*Math.sin(v*4.1+phase)+.12*s*Math.sin(v*7+phase);}
      return [x,y,z];};
    mesh(g,surface(f,54,60),pale?m.linenPale:m.linen);
    g.updateMatrixWorld(true);
    for(const edge of [0,1])for(let j=0;j<55;j++){
      const pts=[f(edge*.96+.02,j/55),f(edge*.96+.02,(j+.55)/55)].map(p=>V(p).applyMatrix4(g.matrixWorld).toArray());seams.push(tube(pts,.006,2));
    }
    for(let i=0;i<85;i++){const u=i/84;const pts=[f(u,.002),f(u,.002).map((a,k)=>a+(k===1?-.04-.025*Math.sin(i*3):k===0?.014*Math.sin(i):0))].map(p=>V(p).applyMatrix4(g.matrixWorld).toArray());seams.push(tube(pts,.003,2));}
  }
  fabric(1.27,1.55,[1.03,.72,-.43],[.15,-.36,-.39],'pocket',.3);
  fabric(1.08,1.2,[.99,.91,-.08],[-.22,.43,.23],'pocket',2.1,true);
  fabric(.89,1.02,[1.26,.6,.14],[.28,-.2,-.69],'pocket',4.2);
  fabric(1.14,1.23,[-.89,-.01,-.77],[.1,.58,.37],'pocket',1.8);
  fabric(1.02,.82,[-.2,-.73,.22],[.24,.25,.19],'pocket',3.8,true);
  fabric(.75,1.98,[.29,-1.65,.26],[-.12,.25,-.22],'drape',.2);
  fabric(.39,1.54,[-.21,-1.6,-.09],[.1,-.35,.24],'drape',2.7,true);
  fabric(.68,.57,[.02,-.84,.7],[.3,.2,.55],'pocket',2.4);
  fabric(.56,.63,[-.1,-.63,-.99],[.2,2.8,-.51],'pocket',4.1,true);
  batch(cloth,seams,m.thread);
  const plants=layer('03 / eleven curled kailan leaves and branching veins',[-.35,.32,.12]);
  const stems=[],veins=[];
  const specs=[[-1.0,.43,.2,-.55,1.8,.63,.2],[-.55,.68,-.12,.2,2.03,.64,1.2],[-1.12,.7,-.48,-.73,1.58,.56,2.1],[-.4,.98,-.6,.25,1.47,.61,3],[-1.23,.05,.4,-1.15,1.38,.53,1],[-.66,.25,.32,-.13,1.63,.7,4],[.02,.85,-.65,.75,1.35,.51,2],[-.78,.57,-.96,-.5,1.66,.52,5],[-1.2,-.3,.12,-1.8,.97,.42,3],[.42,.35,-.83,1.0,1.15,.45,5],[-.26,.44,.08,.53,1.35,.51,6]];
  specs.forEach(([x,y,z,rz,len,w,seed],idx)=>{
    const g=new T.Group();g.position.set(x,y,z);g.rotation.set(.1*Math.sin(seed),.45*Math.sin(seed*2),rz);plants.add(g);
    const f=(u,t)=>{const s=u*2-1,profile=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.68),edge=1+.047*Math.sin(t*31+seed)+.032*Math.sin(t*53+seed*3)+.02*Math.sin(t*87+seed);return [s*w*profile*edge+.04*Math.sin(t*6+seed)*t,len*t,.15*Math.sin(t*4+seed)*t+.15*s*s*profile+(.027*Math.sin(t*23+s*3+seed)+.018*Math.sin(t*47+s*7+seed*2))*Math.abs(s)**1.5*profile+.11*s*t+.018*Math.sin(s*21+t*4)*profile];};
    mesh(g,surface(f,32,64),idx%4===1?m.young:m.leaf);g.updateMatrixWorld(true);
    const tr=p=>V(p).applyMatrix4(g.matrixWorld).toArray();
    const center=[];for(let i=0;i<=24;i++){const p=f(.5,i/24);p[2]+=.006;center.push(tr(p));}veins.push(tube(center,.0065,32));
    for(let k=1;k<10;k++)for(const side of [-1,1]){const t=k/11+.012*Math.sin(k*7+seed+side),pts=[],reach=.4+.035*Math.sin(k+seed);for(let j=0;j<=8;j++){const a=j/8,p=f(.5+side*reach*a,t+(.05+.02*Math.sin(k))*a);p[2]+=.006;pts.push(tr(p));}veins.push(tube(pts,.0025,10));for(let q=1;q<4;q++){const a=q/4,p=[];for(let j=0;j<5;j++){const b=j/4,s=f(.5+side*(reach*a+.055*b),t+.055*a+.04*b);s[2]+=.006;p.push(tr(s));}veins.push(tube(p,.0014,5));}}
    stems.push(tube([[.0,-.56,-.15],[x*.5,y*.5-.1,z*.6],tr(f(.5,0))],.024,24));
  });
  // Two branching flowering stalks, with flattened four-petal buds (not beads).
  const petals=[];
  for(let k=0;k<2;k++){
    const x=-.48+k*.43,z=-.35-k*.2;
    stems.push(tube([[x,-.23,z],[x+.12,.78,z],[x-.08,1.87-k*.2,z+.08]],.018,30));
    for(let j=0;j<4;j++){
      const y=1.27+j*.15-k*.2,bx=x+(j%2?1:-1)*(.12+j*.018);
      stems.push(tube([[x,y-.16,z],[bx,y-.04,z+.03],[bx,y,z+.06]],.008,10));
      for(let q=0;q<4;q++){
        const a=q*Math.PI/2;
        petals.push(surface((u,v)=>{const theta=u*Math.PI*2,r=Math.sin(v*Math.PI)*.025;return [bx+Math.cos(a)*v*.057+Math.cos(theta)*r,y+Math.sin(a)*v*.057+Math.sin(theta)*r,z+.06+.012*Math.sin(v*Math.PI)];},10,8));
      }
    }
  }
  batch(plants,petals,m.flower);batch(plants,stems,m.vein);batch(plants,veins,m.vein);
  const dry=[];
  for(let j=0;j<5;j++){const x=-1.14+j*.15,y=1.12+j*.1,z=-.58-j*.05;dry.push(tube([[-.46,-.43,-.49],[x*.85,.57,z],[x,y,z-.08],[x+.11,y+.3,z]],.014+j*.002,28));for(let k=0;k<3;k++)dry.push(tube([[x,y-.19+k*.1,z],[x-.13-k*.045,y+.05+k*.06,z+.04]],.004,8));const bud=mesh(plants,surface((u,v)=>{const a=u*Math.PI*2,r=.037*Math.sin(v*Math.PI)*(1+.18*Math.sin(a*5));return [Math.cos(a)*r,v*.1,Math.sin(a)*r];},12,12),m.bud);bud.position.set(x+.11,y+.3,z);}
  batch(plants,dry,m.branch);
  const papers=layer('04 / curled cream notes, folded blank reverses',[0,.05,.45]);
  const paperStitches=[];
  function note(w,h,p,r,idx,material=m.paper){
    const g=new T.Group();papers.add(g);g.position.set(...p);g.rotation.set(...r);
    const f=(u,v,back=0)=>[(u-.5)*w*(.82+.18*Math.pow(Math.sin(v*Math.PI),.35))+.006*Math.sin(v*73+idx),(v-.5)*h+.027*Math.sin(u*5+idx)+.009*Math.sin(u*61),.065*Math.sin(u*4+v*3+idx)+.23*Math.pow(u,7)+.15*Math.pow(1-v,9)+back];
    function pierced(back){const geo=surface((u,v)=>f(u,v,back),64,48),ix=geo.index.array,uv=geo.attributes.uv,keep=[];for(let i=0;i<ix.length;i+=3){const a=(uv.getX(ix[i])+uv.getX(ix[i+1])+uv.getX(ix[i+2]))/3,b=(uv.getY(ix[i])+uv.getY(ix[i+1])+uv.getY(ix[i+2]))/3;if(![.26,.39,.52,.65].some(y=>Math.hypot((a-.09)*w,(b-y)*h)<.015))keep.push(ix[i],ix[i+1],ix[i+2]);}geo.setIndex(keep);return geo;}
    mesh(g,pierced(0),material);mesh(g,pierced(-.012),m.verso);g.updateMatrixWorld(true);
    for(const y of [.26,.39,.52]){const a=f(.09,y,.005),b=f(.09,y+.13,.005),mid=f(.06,y+.065,.044);paperStitches.push(tube([a,mid,b].map(p=>V(p).applyMatrix4(g.matrixWorld).toArray()),.0035,10));}
  }
  note(1.08,.98,[-.17,.11,.83],[.12,-.3,-.22],0);
  note(.62,.95,[.55,.09,.6],[-.24,.3,.29],2,m.menu);
  note(.4,.9,[-.39,-.6,.52],[.2,-.4,-.48],3,m.receipt);
  note(.7,.76,[-.3,.24,-1.03],[0,Math.PI,.24],4,m.verso);
  note(.4,.67,[.23,-.39,-.98],[.23,2.7,-.41],6,m.receipt);
  batch(papers,paperStitches,m.thread);
  const gauze=layer('05 / diagonal silver gauze, loose stitch connections',[-.28,-.05,.3]);
  const threads=[];
  // Unequal broken strands follow diagonals, with local gathers and frayed ends.
  for(let j=0;j<155;j++){
    const phase=j*2.399,s=Math.sin(j*17.13),start=(j%9)*.017,end=.7+.3*(.5+.5*Math.sin(j*9.31)),pts=[];
    for(let k=0;k<25;k++){const t=start+(end-start)*k/24,spread=(.035+.2*Math.sin(t*Math.PI)**2+.16*t**5)*s;pts.push([-1.57+t*1.35+spread+.055*Math.sin(t*9+phase),-.7+t*1.44+spread*.7+.03*Math.cos(t*12+phase),.61+.18*Math.sin(t*4+phase*.07)+.045*Math.sin(t*18+phase)]);}
    threads.push(tube(pts,.0019+(j%4)*.00025,28));
  }
  for(let j=0;j<65;j++){const p=[],s=Math.sin(j*5.37);for(let k=0;k<28;k++){const t=k/27,a=t*4.4+j*.032;p.push([-1.22-.36*Math.sin(a)+s*.085,-.43+t*.93+s*.13,.55-.9*t+.19*Math.cos(a)+s*.08]);}threads.push(tube(p,.0024,30));}
  for(let j=0;j<29;j++){const p=[];for(let k=0;k<30;k++){const t=k/29,a=t*6.1+j*.18;p.push([-.46+.22*Math.cos(a)+j*.002,-.61+t*.32+.11*Math.sin(a),.75+.085*Math.sin(a*1.3)]);}threads.push(tube(p,.0022,32));}
  for(let j=0;j<37;j++){const s=Math.sin(j*8.3);threads.push(tube([[-.9,-.08,-.91],[-.65+s*.16,.34,-1.18],[-.15+s*.12,.49,-1.22],[.45+s*.19,.26,-1.03]],.0023,30));}
  batch(gauze,threads,m.silver);
  for(let j=0;j<4;j++){const film=mesh(gauze,surface((u,v)=>[(u-.5)*(.32+.12*j)*Math.sin(Math.PI*v)**.3,(v-.5)*.62,.09*Math.sin(u*7+v*4+j)+.13*u*u],24,24),m.film);film.position.set(-1.03+j*.2,-.46+j*.23,j===3?-.95:.6+j*.04);film.rotation.set(.2,j===3?2.7:.2,-.57+j*.19);}
  const glass=layer('06 / crumpled wine and amber thin-walled vessels',[.4,-.12,.4]);
  function vessel(p,scale,rot,material){
    const g=new T.Group();glass.add(g);g.position.set(...p);g.scale.setScalar(scale);g.rotation.set(...rot);
    // One shallow skin, not overlapping inner/outer lathe walls. A fine rim
    // supplies a physical edge without doubling the whole tinted surface.
    const profile=[[.008,0],[.13,.008],[.25,.032],[.34,.068],[.38,.105]];
    const deform=(x,y,z)=>{const angle=Math.atan2(z,x),d=1+.043*Math.sin(angle*5+y*4)+.012*Math.sin(angle*9);return [x*d,y+.013*Math.sin(angle*5+.3)*y/.105,z*d];};
    const geo=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),64);const a=geo.attributes.position;for(let i=0;i<a.count;i++)a.setXYZ(i,...deform(a.getX(i),a.getY(i),a.getZ(i)));geo.computeVertexNormals();mesh(g,geo,material);
    const rim=[];for(let i=0;i<=64;i++){const t=i/64*Math.PI*2;rim.push(deform(Math.sin(t)*.38,.105,Math.cos(t)*.38));}mesh(g,tube(rim,.004,72),material);
  }
  vessel([.98,-.48,1.36],1.04,[1.15,.12,-.35],m.wine);
  vessel([.48,-.91,1.16],.62,[1.25,.3,.45],m.amber);
  vessel([.63,-.22,-1.21],.64,[-1.2,.4,.7],m.wine);
  const inclusions=[];
  for(let j=0;j<3;j++){
    const knot=mesh(glass,surface((u,v)=>{const a=u*Math.PI*2,b=v*Math.PI,r=.09*(1+.1*Math.sin(a*3+b*5));return [Math.cos(a)*Math.sin(b)*r,Math.cos(b)*r*.63,Math.sin(a)*Math.sin(b)*r*.28];},24,18),m.amber);knot.position.set(.33+j*.19,-.49-j*.17,1.1+j*.017);knot.rotation.z=j*.8;
    inclusions.push(tube([[.29+j*.19,-.5-j*.17,1.1+j*.017],[.34+j*.19,-.45-j*.17,1.1+j*.017],[.38+j*.19,-.46-j*.17,1.1+j*.017]],.0028,8));
  }
  batch(glass,inclusions,m.branch);
  // One lateral front membrane and one rear membrane; neither coils over the
  // shallow dish centre. Preserve the berry accent while opening sight lines.
  for(let j=0;j<2;j++){const petal=mesh(glass,surface((u,v)=>[(u-.5)*.27*(.7+.3*Math.sin(v*Math.PI)),(v-.5)*.48,.045*Math.sin(u*4+v*2)+.035*v*v],24,24),m.wine);petal.position.set(j?.36:.57,j?-.15:-.45,j?-1.29:1.25);petal.rotation.set(.1,j?2.9:.25,j?.5:-.38);}
  // Two irregular amber slivers, small enough to remain accents to the wine glass.
  for(let k=0;k<2;k++){
    const shard=mesh(glass,surface((u,v)=>[(u-.5)*.23*(.5+.5*v),(v-.5)*.32,.04*Math.sin(u*4+v*3)],12,14),m.amber);
    shard.position.set(1.19-k*.24,-1.04-k*.13,1.17);shard.scale.setScalar(.72);shard.rotation.set(.3,k*.5,.7-k);
  }
  const hardware=layer('07 / silver spoon fragments and rear bindings',[0,-.18,-.25]);
  const spoon=mesh(hardware,surface((u,v)=>{const a=u*Math.PI*2,r=Math.sin(v*Math.PI/2);return [Math.cos(a)*.17*r,Math.sin(a)*.28*r,-.065*(1-r*r)];},36,14),m.silver);spoon.position.set(-.65,-.96,.72);spoon.rotation.z=-.7;
  mesh(hardware,tube([[-.53,-.76,.72],[-.29,-.44,.67],[-.12,-.23,.52]],.025,24),m.silver);
  const ties=[];for(let i=0;i<9;i++)ties.push(tube([[-.44+i*.045,-.54,-.8],[-.28+i*.045,-.68,-1.02],[.1+i*.045,-.44,-.88]],.008,18));batch(hardware,ties,m.thread);
  for(let j=0;j<4;j++){const foil=mesh(hardware,surface((u,v)=>[(u-.5)*(.2+j*.025),(v-.5)*.57,.05*Math.sin(u*13+v*7+j)+.08*v*v],18,28),m.silver);foil.position.set(-.59+j*.36,-.56+j*.08,j%2?-.92:.57);foil.rotation.set(.2,j%2?2.7:.3,.7-j*.38);}
  root.userData={title:'芥兰',englishTitle:'JIE LAN',version:'0.18.0',artRevision:3,referenceBasis:'Written direct observations by lead agent; original reference image not viewed by implementation agent',layers:groups.map(g=>g.name),leafCount:11,structure:'Seven staggered ceramic fragments; no spherical support',back:'Designed continuation: pierced paper reverses, wrapped fibers, linen knot, stems and berry film'};
  return {root,groups,setSeparated(amount){const a=T.MathUtils.clamp(Number(amount)||0,0,1);groups.forEach(g=>g.position.fromArray(g.userData.separation).multiplyScalar(a));},dispose(){const geos=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);});geos.forEach(g=>g.dispose());m.dispose();}};
}
