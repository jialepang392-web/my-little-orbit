import * as T from 'three';

/** Real material surfaces. Two generated atlases supply eight macro studies;
 * geometry and small supplementary maps remain authored locally.
 * No whole-artwork image is projected onto the sculpture.
 */
export function makeMaterials(){
  const textures=[];let seed=200021;
  const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const N=512, TAU=Math.PI*2;
  function canvas(){const c=document.createElement('canvas');c.width=c.height=N;return [c,c.getContext('2d')];}
  function register(c,color=true){const t=new T.CanvasTexture(c);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;t.wrapS=t.wrapT=T.RepeatWrapping;textures.push(t);return t;}
  function relief(kind){
    const [c,x]=canvas(),d=x.createImageData(N,N);
    for(let y=0;y<N;y++)for(let z=0;z<N;z++){
      const a=(y*N+z)*4;let v=128;
      if(kind==='weave'){
        const warp=Math.pow(.5+.5*Math.cos(z*TAU/5),2),weft=Math.pow(.5+.5*Math.cos(y*TAU/5),2);
        const over=((Math.floor(z/5)+Math.floor(y/5))%2===0);
        v=86+77*(over?warp*.82+weft*.28:warp*.28+weft*.82)+16*rnd();
      }else if(kind==='bark')v=106+39*Math.sin(z*.23+Math.sin(y*.025)*.8)+22*Math.sin(z*.73+y*.008)+15*rnd();
      else if(kind==='leaf')v=122+17*Math.sin(z*.17+Math.sin(y*.047)*2)*Math.sin(y*.19)+12*rnd();
      else v=117+22*rnd()+5*Math.sin(z*.31)*Math.sin(y*.27);
      d.data[a]=d.data[a+1]=d.data[a+2]=Math.max(0,Math.min(255,v));d.data[a+3]=255;
    }
    x.putImageData(d,0,0);return register(c,false);
  }
  function texture(kind){
    const [c,x]=canvas();
    const grounds={plantFiber:'#d8dfcb',linen:'#e9e8d8',leaf:'#d5e2c7',glaze:'#eee7d4',bark:'#b6a183',grain:'#eee6d3',paper:'#f4e6c9',menu:'#f2e2bd',receipt:'#ede2c6',verso:'#eee0bf'};
    x.fillStyle=grounds[kind]||grounds.grain;x.fillRect(0,0,N,N);
    for(let i=0;i<(kind==='leaf'?145:65);i++){
      const a=rnd()*N,b=rnd()*N,r=12+rnd()*82,g=x.createRadialGradient(a,b,0,a,b,r);
      const ink=kind==='leaf'?(i%3?'66,99,28':'234,239,159'):kind==='bark'?'74,56,36':'137,105,53';
      g.addColorStop(0,`rgba(${ink},${kind==='leaf'?.16:kind==='bark'?.12:.046})`);g.addColorStop(1,`rgba(${ink},0)`);x.fillStyle=g;x.fillRect(a-r,b-r,r*2,r*2);
    }
    for(let i=0;i<13000;i++){x.fillStyle=`rgba(${i%2?'255,255,235':'46,43,24'},${.018+rnd()*.052})`;x.fillRect(rnd()*N,rnd()*N,.7+rnd(),.6+rnd());}
    if(kind==='plantFiber'){
      // Short interlocked vegetal fibres, not a smooth olive-painted balloon.
      for(let i=0;i<10500;i++){
        const a=rnd()*N,b=rnd()*N,angle=rnd()*TAU,len=2+rnd()*12;
        x.strokeStyle=i%3?'#59715140':'#f2eed07a';x.lineWidth=.45+rnd()*1.3;x.beginPath();x.moveTo(a,b);
        x.quadraticCurveTo(a+Math.cos(angle+.4)*len*.55,b+Math.sin(angle+.4)*len*.55,a+Math.cos(angle)*len,b+Math.sin(angle)*len);x.stroke();
      }
    }
    if(kind==='linen'){
      for(let i=0;i<N;i+=3){x.lineWidth=.7;x.strokeStyle=i%6?'#5e645518':'#fffbe960';x.beginPath();x.moveTo(i,0);x.bezierCurveTo(i+.9,170,i-.9,340,i,N);x.moveTo(0,i);x.bezierCurveTo(160,i+.7,340,i-.8,N,i);x.stroke();}
      for(let i=0;i<500;i++){x.strokeStyle='#716f5630';x.lineWidth=.5;const a=rnd()*N,b=rnd()*N;x.beginPath();x.moveTo(a,b);x.lineTo(a+(i%2?1:4),b+(i%2?5:1));x.stroke();}
    }
    if(kind==='leaf'){
      // Tiny irregular secondary reticulation only. Primary veins are the
      // authored 3D curves, so no repeating painted ladder fights them.
      x.lineCap='round';x.lineWidth=.55;
      for(let j=0;j<220;j++){
        const a=rnd()*N,b=rnd()*N,w=8+rnd()*29,h=8+rnd()*31;
        x.strokeStyle=j%3?'#7d965c32':'#edf0c62a';x.beginPath();x.moveTo(a,b);
        x.bezierCurveTo(a+w*.3,b+h*.05,a+w*.7,b+h*.65,a+w,b+h);x.stroke();
        if(j%2===0){x.beginPath();x.moveTo(a+w*.5,b+h*.35);x.quadraticCurveTo(a+w*.63,b-h*.04,a+w*.9,b-h*.15);x.stroke();}
      }
    }
    if(kind==='bark'){
      for(let j=0;j<155;j++){const a=rnd()*N,b=rnd()*N;x.strokeStyle=j%3?'#594b3a72':'#e7ddbe85';x.lineWidth=.4+rnd()*2.2;x.beginPath();x.moveTo(a,b);x.bezierCurveTo(a+6*Math.sin(j),b+39,a-4,b+98,a+4,b+165);x.stroke();}
      for(let j=0;j<10;j++){x.strokeStyle='#62503b44';x.lineWidth=1;const a=rnd()*N,b=rnd()*N;for(let k=0;k<3;k++){x.beginPath();x.ellipse(a,b,3+k*2,11+k*6,.12,0,TAU);x.stroke();}}
    }
    if(kind==='glaze'){
      // Cobalt pooling and kiln scratches; the glaze reads as a blue colour mass.
      x.fillStyle='#285cc0';x.fillRect(0,0,N,N);
      for(let i=0;i<90;i++){const a=rnd()*N,b=rnd()*N,r=12+rnd()*120,g=x.createRadialGradient(a,b,0,a,b,r);g.addColorStop(0,i%3?'#153f8730':'#adcddc46');g.addColorStop(1,'#346bbb00');x.fillStyle=g;x.fillRect(a-r,b-r,r*2,r*2);}
      for(const y of [22,38,475]){x.strokeStyle='#b8cad666';x.lineWidth=1.2;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(180,y+2,340,y-3,N,y);x.stroke();}
      for(let i=0;i<260;i++){x.strokeStyle=i%4?'#bbd6eb20':'#162c6345';x.lineWidth=.5;const a=rnd()*N,b=rnd()*N;x.beginPath();x.moveTo(a,b);x.lineTo(a+3+rnd()*19,b+2+rnd()*4);x.stroke();}
    }
    if(['paper','menu','receipt','verso'].includes(kind)){
      for(let i=0;i<1700;i++){x.strokeStyle='#86684124';x.lineWidth=.5;const a=rnd()*N,b=rnd()*N;x.beginPath();x.moveTo(a,b);x.lineTo(a+1+rnd()*7,b+rnd()*3);x.stroke();}
      x.strokeStyle='#96723e1b';x.lineWidth=6;x.beginPath();x.ellipse(356,349,91,70,.3,.15,4.7);x.stroke();
      if(kind==='menu'){
        // One small real paper label, not text tiled across a spherical skin.
        x.fillStyle='#45624a';x.font='132px "Kaiti SC", STKaiti, KaiTi, serif';x.fillText('芥兰',118,228);
        x.fillStyle='#647259';x.font='37px "Kaiti SC", STKaiti, KaiTi, serif';x.fillText('请好好吃饭',160,308);
        x.strokeStyle='#48654899';x.lineWidth=2;x.beginPath();x.moveTo(70,375);x.bezierCurveTo(184,383,315,357,441,365);x.stroke();
      }else if(kind==='receipt'){
        x.fillStyle='#68705e';x.font='32px "Kaiti SC", STKaiti, KaiTi, serif';x.fillText('一人一半',102,117);
        x.strokeStyle='#7c817459';x.lineWidth=1;for(let j=0;j<5;j++){x.beginPath();x.moveTo(89,165+j*46);x.lineTo(410,165+j*46);x.stroke();}
        x.font='italic 43px Georgia, serif';x.fillText('1 / 2',281,324);x.fillText('1 / 2',107,374);
      }else{
        x.strokeStyle=kind==='verso'?'#59634036':'#54704675';x.fillStyle='#61794d25';x.lineWidth=1.1;
        for(let j=0;j<(kind==='verso'?1:3);j++){const bx=110+j*125;x.beginPath();x.moveTo(bx,433);x.quadraticCurveTo(bx+32,267,bx+10,110+j*41);x.stroke();for(let k=0;k<7;k++)for(const s of [-1,1]){const y=175+k*32+j*7;x.beginPath();x.ellipse(bx+s*15,y,8,21,s*.6,0,TAU);x.fill();x.stroke();}}
      }
    }
    return register(c);
  }
  const maps={linen:texture('linen'),leaf:texture('leaf'),glaze:texture('glaze'),bark:texture('bark'),paper:texture('paper'),grain:texture('grain'),menu:texture('menu'),receipt:texture('receipt'),verso:texture('verso')};
  const weave=relief('weave'),grain=relief('grain'),leafRelief=relief('leaf'),barkRelief=relief('bark');
  const fibreMap=texture('plantFiber');fibreMap.repeat.set(3,2);weave.repeat.set(2,2);
  // Paired paper/cloth/porcelain skins have explicit reverse faces. Rendering
  // those skins double-sided duplicates hidden faces and muddies the creases.
  const mat=o=>new T.MeshPhysicalMaterial({side:T.FrontSide,...o});
  const materials={
    blue:mat({color:'#ffffff',map:maps.glaze,roughness:.30,clearcoat:.53,clearcoatRoughness:.22,bumpMap:grain,bumpScale:.002}),
    cobalt:mat({color:'#244a8f',roughness:.30,clearcoat:.62,clearcoatRoughness:.22,bumpMap:grain,bumpScale:.003}),
    porcelain:mat({color:'#ddceb3',map:maps.grain,roughness:.89,bumpMap:grain,bumpScale:.011}),
    ceramicBack:mat({color:'#365c83',map:maps.grain,roughness:.48,clearcoat:.28,clearcoatRoughness:.30,bumpMap:grain,bumpScale:.004}),
    cream:mat({color:'#f1e8ce',map:maps.grain,roughness:.43,clearcoat:.31,bumpMap:grain,bumpScale:.005}),
    imprint:mat({color:'#627448',roughness:.88}),
    linen:mat({color:'#a9b4a6',map:maps.linen,bumpMap:weave,bumpScale:.003,roughness:.93,sheen:.38,sheenColor:'#d9dece',sheenRoughness:.88}),
    linenReverse:mat({color:'#838f81',map:maps.linen,bumpMap:weave,bumpScale:.003,roughness:1,sheen:.22,sheenColor:'#d2cfb6'}),
    linenPale:mat({color:'#ccd0bd',map:maps.linen,bumpMap:weave,bumpScale:.003,roughness:.95,sheen:.35,sheenColor:'#e1decb'}),
    roseLinen:mat({color:'#998a8f',map:maps.linen,bumpMap:weave,bumpScale:.003,roughness:.97,sheen:.27,sheenColor:'#c8afb7'}),
    roseThread:mat({color:'#bd8994',roughness:.94,sheen:.24}),
    leaf:mat({side:T.DoubleSide,color:'#396b2e',map:maps.leaf,bumpMap:leafRelief,bumpScale:.015,roughness:.52,clearcoat:.19,clearcoatRoughness:.39}),
    leafDark:mat({side:T.DoubleSide,color:'#214c32',map:maps.leaf,bumpMap:leafRelief,bumpScale:.013,roughness:.53,clearcoat:.18,clearcoatRoughness:.38}),
    leafPale:mat({side:T.DoubleSide,color:'#74974d',map:maps.leaf,bumpMap:leafRelief,bumpScale:.014,roughness:.47,clearcoat:.22,clearcoatRoughness:.34}),
    young:mat({side:T.DoubleSide,color:'#8cab55',map:maps.leaf,bumpMap:leafRelief,bumpScale:.005,roughness:.63,clearcoat:.11,clearcoatRoughness:.45}),
    vein:mat({color:'#889e58',roughness:.73,clearcoat:.04}),
    branch:mat({color:'#817c5e',map:maps.grain,bumpMap:grain,bumpScale:.011,roughness:.98}),
    bark:mat({color:'#a8997e',map:maps.bark,bumpMap:barkRelief,bumpScale:.028,roughness:.98}),
    moss:mat({color:'#74843b',map:maps.leaf,bumpMap:grain,bumpScale:.026,roughness:1}),
    globeFiber:mat({color:'#f8faf2',map:fibreMap,vertexColors:true,bumpMap:grain,bumpScale:.014,roughness:.98}),
    bud:mat({color:'#843e50',map:maps.grain,roughness:.83}),
    flower:mat({color:'#dbc54b',roughness:.62}),
    seedGold:mat({color:'#ae873b',map:maps.grain,roughness:.51,metalness:.12}),
    petal:mat({color:'#eed168',roughness:.76}),
    paper:mat({map:maps.paper,roughness:.96,bumpMap:grain,bumpScale:.012}),
    menu:mat({map:maps.menu,roughness:.95,bumpMap:grain,bumpScale:.009}),
    receipt:mat({map:maps.receipt,roughness:.95,bumpMap:grain,bumpScale:.008}),
    verso:mat({map:maps.verso,roughness:.97,bumpMap:grain,bumpScale:.01}),
    silver:mat({color:'#a8aaa1',metalness:.83,roughness:.29,bumpMap:grain,bumpScale:.003}),
    thread:mat({color:'#c5c9ba',metalness:.24,roughness:.64}),
    // Opaque colored seeds remain visible inside the refractive glass pocket.
    // Mixing alpha blending and transmission for nested shells would erase
    // their depth in the single refraction buffer used by this renderer.
    wine:mat({color:'#6e263e',bumpMap:grain,bumpScale:.003,roughness:.36,metalness:.03,clearcoat:.38,clearcoatRoughness:.27}),
    amber:mat({color:'#bd8d38',roughness:.18,metalness:.35,clearcoat:.7,clearcoatRoughness:.14}),
    violet:mat({color:'#684467',bumpMap:grain,bumpScale:.003,roughness:.39,metalness:.02,clearcoat:.33,clearcoatRoughness:.29}),
    brass:mat({color:'#a49064',metalness:.79,roughness:.35,bumpMap:grain,bumpScale:.002}),
    warmCore:mat({color:'#edbd63',emissive:'#d99135',emissiveIntensity:.55,roughness:.25,metalness:.08}),
    specimenGlass:mat({side:T.DoubleSide,color:'#e1e9df',transmission:0,opacity:.20,transparent:true,depthWrite:false,forceSinglePass:true,roughness:.10,metalness:.09,envMapIntensity:1.15,clearcoat:1,clearcoatRoughness:.07}),
    dew:mat({color:'#ffffff',transmission:1,opacity:1,thickness:.028,ior:1.333,roughness:.035,envMapIntensity:.55,clearcoat:.15}),
    glassEdge:mat({side:T.DoubleSide,color:'#ececd8',metalness:.24,roughness:.12,transparent:true,opacity:.68,depthWrite:false,forceSinglePass:true,envMapIntensity:1.9}),
    glassRim:mat({color:'#c3cfbc',metalness:.28,roughness:.15,transparent:true,opacity:.52,depthWrite:false,clearcoat:1,envMapIntensity:1.2}),
    glassLip:mat({side:T.DoubleSide,color:'#c9c0a0',metalness:.60,roughness:.04,transparent:true,opacity:.30,depthWrite:false,forceSinglePass:true,clearcoat:1,envMapIntensity:1.6}),
    // This second, very thin membrane is a non-refracting transparent layer.
    // Keep it separate from the physical glass pocket for stable orbit sorting.
    film:mat({side:T.DoubleSide,color:'#e0e8d4',transparent:true,opacity:.13,depthWrite:false,forceSinglePass:true,transmission:0,roughness:.11,metalness:.09,clearcoat:.8,clearcoatRoughness:.10,iridescence:.08})
  };
  const ready=new Promise((resolve,reject)=>new T.TextureLoader().load(new URL('../../assets/jielan/reference-material-atlas.png',import.meta.url).href,atlas=>{
    atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;textures.push(atlas);
    function quadrant(x,y,color=true){const t=atlas.clone();t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.repeat.set(.499,.499);t.offset.set(x*.5+.0005,y*.5+.0005);t.needsUpdate=true;textures.push(t);return t;}
    const leafMap=quadrant(0,1),leafBump=quadrant(0,1,false),linenMap=quadrant(1,1),linenBump=quadrant(1,1,false),woodMap=quadrant(0,0),woodBump=quadrant(0,0,false),roseMap=quadrant(1,0),roseBump=quadrant(1,0,false);
    for(const [key,color] of [['leaf','#f3ffd0'],['leafDark','#c7dcbd'],['leafPale','#ffffff'],['young','#ebffc6']]){Object.assign(materials[key],{map:leafMap,bumpMap:leafBump,bumpScale:.002,roughness:.58,clearcoat:.16,clearcoatRoughness:.38});materials[key].color.set(color);materials[key].emissive.set(key==='leafDark'?'#254817':'#486e1d');materials[key].emissiveIntensity=key==='leafDark'?.10:.25;materials[key].needsUpdate=true;}
    // Repeat only the atlas's fabric cell, with a pale flax colour response.
    // The crop is a UV material tile, never a reference-artwork projection.
    const tile=document.createElement('canvas');tile.width=tile.height=1024;const tx=tile.getContext('2d'),aw=atlas.image.width/2,ah=atlas.image.height/2;
    for(let y=0;y<3;y++)for(let x=0;x<3;x++)tx.drawImage(atlas.image,aw,0,aw,ah,x*1024/3,y*1024/3,1024/3,1024/3);
    const pixels=tx.getImageData(0,0,1024,1024);for(let i=0;i<pixels.data.length;i+=4){const value=pixels.data[i]*.25+pixels.data[i+1]*.6+pixels.data[i+2]*.15;pixels.data[i]=133+value*.42;pixels.data[i+1]=137+value*.43;pixels.data[i+2]=129+value*.41;}tx.putImageData(pixels,0,0);
    const fabric=register(tile),fabricBump=register(tile,false);
    for(const [key,color] of [['linen','#cad2c9'],['linenReverse','#a0b0a0'],['linenPale','#e9e9dc'],['roseLinen','#c2adb8']]){Object.assign(materials[key],{map:fabric,bumpMap:fabricBump,bumpScale:.005,sheen:.08,roughness:1});materials[key].color.set(color);materials[key].needsUpdate=true;}
    for(const key of ['bark','branch']){Object.assign(materials[key],{map:woodMap,bumpMap:woodBump,bumpScale:.023,roughness:1});materials[key].color.set(key==='bark'?'#bac0b5':'#a0ae94');materials[key].needsUpdate=true;}
    resolve();
  },undefined,reject));
  const objectReady=new Promise((resolve,reject)=>new T.TextureLoader().load(new URL('../../assets/jielan/reference-object-atlas.png',import.meta.url).href,atlas=>{
    atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;textures.push(atlas);
    const quadrant=(x,y)=>{const t=atlas.clone();t.repeat.set(.499,.499);t.offset.set(x*.5+.0005,y*.5+.0005);t.needsUpdate=true;textures.push(t);return t;};
    materials.silver.bumpMap=quadrant(0,0);materials.silver.bumpScale=.002;materials.silver.color.set('#8b9a93');materials.silver.roughness=.36;materials.silver.needsUpdate=true;
    const amber=quadrant(1,0);
    for(const key of ['amber','seedGold']){materials[key].map=amber;materials[key].color.set('#ffffff');materials[key].roughness=.21;materials[key].metalness=.24;materials[key].clearcoat=.88;materials[key].clearcoatRoughness=.09;materials[key].emissive.set('#a46b1f');materials[key].emissiveIntensity=.17;materials[key].needsUpdate=true;}
    resolve();
  },undefined,reject));
  for(const [name,material] of Object.entries(materials))material.name=`Jielan / ${name}`;
  return {...materials,ready:Promise.all([ready,objectReady]),dispose(){Object.values(materials).forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
