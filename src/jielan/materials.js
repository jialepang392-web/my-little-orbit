import * as T from 'three';

/** Original deterministic, locally drawn material studies; no image/font input. */
export function makeMaterials(){
  const textures=[];let seed=190032;
  const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  function texture(kind){
    const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
    x.fillStyle=kind==='linen'?'#e8e9dc':kind==='leaf'?'#cfddad':kind==='glaze'?'#b5c7e7':'#f6efdb';x.fillRect(0,0,512,512);
    for(let i=0;i<(kind==='leaf'?180:50);i++){const a=rnd()*512,b=rnd()*512,r=8+rnd()*55,g=x.createRadialGradient(a,b,0,a,b,r);g.addColorStop(0,kind==='leaf'?`rgba(${rnd()>.5?'76,110,38':'240,239,181'},.16)`:kind==='glaze'?'rgba(245,243,222,.18)':'rgba(128,112,70,.035)');g.addColorStop(1,'rgba(128,130,80,0)');x.fillStyle=g;x.fillRect(a-r,b-r,r*2,r*2);}
    for(let i=0;i<22000;i++){const a=rnd()*512,b=rnd()*512;x.fillStyle=`rgba(${rnd()>.5?'255,255,240':'38,48,25'},${.025+rnd()*.08})`;x.fillRect(a,b,kind==='linen'?1:2,kind==='linen'?4:1);}
    if(kind==='glaze'){
      for(let i=0;i<85;i++){const a=rnd()*512,b=rnd()*512,r=3+rnd()*18,g=x.createRadialGradient(a,b,0,a,b,r);g.addColorStop(0,i%3?'rgba(51,82,147,.12)':'rgba(232,219,181,.13)');g.addColorStop(1,'rgba(180,192,218,0)');x.fillStyle=g;x.fillRect(a-r,b-r,r*2,r*2);}
      for(let i=0;i<2600;i++){x.fillStyle=i%3?'#435d8820':'#fff5dc35';x.fillRect(rnd()*512,rnd()*512,.7+rnd(),.7+rnd());}
    }
    if(kind==='linen')for(let i=0;i<512;i+=2){x.strokeStyle=i%4?'#ffffff15':'#52594413';x.lineWidth=.45;x.beginPath();x.moveTo(i,0);x.bezierCurveTo(i+.8,170,i-.6,320,i,512);x.moveTo(0,i);x.lineTo(512,i+.4);x.stroke();}
    if(kind==='leaf')for(let j=0;j<35;j++){const y=j*14+rnd()*10;x.strokeStyle='#67854925';x.lineWidth=.65;for(const side of [-1,1]){x.beginPath();x.moveTo(256,y);x.bezierCurveTo(256+side*45,y+20,256+side*140,y+27,256+side*260,y+90);x.stroke();for(let k=1;k<6;k++){x.beginPath();x.moveTo(256+side*k*36,y+k*7);x.quadraticCurveTo(256+side*(k*36+15),y+k*7+20,256+side*(k*36+25),y+k*7+40);x.stroke();}}}
    if(['paper','menu','receipt','verso'].includes(kind)){
      for(let i=0;i<1400;i++){x.strokeStyle='#736d4520';x.lineWidth=.45;const a=rnd()*512,b=rnd()*512;x.beginPath();x.moveTo(a,b);x.lineTo(a+1+rnd()*7,b+rnd()*3);x.stroke();}
      x.strokeStyle='#aa855c16';x.lineWidth=7;x.beginPath();x.ellipse(350,340,90,76,.3,.1,4.5);x.stroke();x.strokeStyle=kind==='verso'?'#4f644936':'#365a3bd9';x.lineCap='round';
      if(kind==='paper'){
        // Quiet, original dry botanical transfers; no lettering or broad wave.
        x.strokeStyle='#68765338';x.fillStyle='#78826416';x.lineWidth=1.1;
        for(let j=0;j<3;j++){const bx=85+j*135;x.beginPath();x.moveTo(bx,420);x.quadraticCurveTo(bx+26,278,bx+5,135+j*34);x.stroke();for(let k=0;k<6;k++)for(const side of [-1,1]){const y=200+k*32+j*11;x.beginPath();x.ellipse(bx+side*15,y,8,23,side*.55,0,Math.PI*2);x.fill();x.stroke();}}
      }
      else if(kind==='menu'){x.strokeStyle='#315b3bc9';x.lineWidth=2.2;for(let j=0;j<4;j++){const y=116+j*70;for(let k=0;k<4+j%2;k++){const a=61+k*61,dy=9*Math.sin(k*2+j);x.beginPath();x.moveTo(a,y+dy);x.bezierCurveTo(a+23,y-36+dy,a-7,y+31,a+29,y-7);x.bezierCurveTo(a+49,y-23,a+20,y+23+dy,a+56,y-4);x.stroke();}}x.lineWidth=1.3;x.beginPath();x.moveTo(79,398);x.bezierCurveTo(201,368,167,433,327,382);x.stroke();}
      else if(kind==='receipt'){x.fillStyle='#786f5866';x.font='14px monospace';x.fillText('18 / TABLE',84,75);for(let j=0;j<13;j++){x.fillRect(78,114+j*22,50+rnd()*160,1);x.fillRect(323,114+j*22,25+rnd()*40,1);}x.font='12px serif';x.fillText('STILL WARM',100,458);}
      else{x.lineWidth=1.2;x.beginPath();x.moveTo(111,189);x.bezierCurveTo(180,127,166,250,249,218);x.moveTo(330,309);x.lineTo(362,299);x.stroke();}
    }
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;textures.push(t);return t;
  }
  const linenMap=texture('linen'),leafMap=texture('leaf'),paperMap=texture('paper'),grain=texture('grain'),glaze=texture('glaze');
  const mat=o=>new T.MeshPhysicalMaterial({side:T.DoubleSide,...o});
  const materials={
    blue:mat({color:'#2457ae',map:glaze,roughness:.39,roughnessMap:glaze,clearcoat:.38,clearcoatRoughness:.35,bumpMap:glaze,bumpScale:.007}),
    porcelain:mat({color:'#e7dcc3',map:grain,roughness:.82,bumpMap:grain,bumpScale:.007}),
    ceramicBack:mat({color:'#86a6b2',map:paperMap,roughness:.64,clearcoat:.20,clearcoatRoughness:.55,bumpMap:grain,bumpScale:.004}),
    cream:mat({color:'#f4ead5',map:grain,roughness:.38,clearcoat:.42,clearcoatRoughness:.29,bumpMap:grain,bumpScale:.006}),
    imprint:mat({color:'#8b8f71',roughness:.85,bumpMap:grain,bumpScale:.003}),
    linen:mat({color:'#879b92',map:linenMap,bumpMap:linenMap,bumpScale:.006,roughness:1,sheen:.22,sheenColor:'#c2ccbb'}),
    linenReverse:mat({color:'#a5b3a4',map:linenMap,bumpMap:linenMap,bumpScale:.01,roughness:1,sheen:.12}),
    linenPale:mat({color:'#d5cfbb',map:linenMap,bumpMap:linenMap,bumpScale:.01,roughness:.98,sheen:.35}),
    leaf:mat({color:'#5a8642',map:leafMap,bumpMap:leafMap,bumpScale:.008,roughness:.87,clearcoat:.015,clearcoatRoughness:.80}),
    young:mat({color:'#789752',map:leafMap,bumpMap:leafMap,bumpScale:.007,roughness:.89,clearcoat:.01}),
    vein:mat({color:'#63814c',roughness:.95}),
    branch:mat({color:'#837451',map:grain,bumpMap:grain,bumpScale:.032,roughness:.96}),
    bud:mat({color:'#733745',map:grain,roughness:.89}),
    flower:mat({color:'#e8cc68',roughness:.88}),
    seedGold:mat({color:'#c0a052',roughness:.92}),
    petal:mat({color:'#eedb8b',roughness:.90}),
    paper:mat({map:paperMap,color:'#fff5d8',roughness:.94,bumpMap:grain,bumpScale:.013}),
    menu:mat({map:texture('menu'),roughness:.96,bumpMap:grain,bumpScale:.01}),
    receipt:mat({map:texture('receipt'),roughness:.87,transmission:.2,thickness:.012}),
    verso:mat({map:texture('verso'),roughness:.97,bumpMap:grain,bumpScale:.012}),
    silver:mat({color:'#c9ceca',metalness:.72,roughness:.5,bumpMap:grain,bumpScale:.012}),
    thread:mat({color:'#cbd1b9',roughness:.9}),
    // Thin tinted sheets use alpha as well as transmission: the visible rear
    // layers must not depend solely on the renderer's refraction buffer.
    // GLB carries alphaMode BLEND plus KHR_materials_transmission; it is an
    // authored thin-glass approximation, not a volumetric optical simulation.
    wine:mat({color:'#81394d',transparent:true,opacity:.62,depthWrite:false,forceSinglePass:true,transmission:.3,thickness:.035,ior:1.36,roughness:.13,clearcoat:.55,attenuationColor:'#b75567',attenuationDistance:2}),
    amber:mat({color:'#d8a550',transparent:true,opacity:.5,depthWrite:false,forceSinglePass:true,transmission:.36,thickness:.028,ior:1.38,roughness:.14,clearcoat:.45}),
    violet:mat({color:'#665076',transparent:true,opacity:.78,transmission:.42,thickness:.16,roughness:.13,ior:1.46,clearcoat:.65}),
    brass:mat({color:'#aa8850',metalness:.78,roughness:.32}),
    specimenGlass:mat({color:'#b7a0af',transparent:true,opacity:.46,depthWrite:false,forceSinglePass:true,transmission:.69,thickness:.035,ior:1.39,roughness:.105,clearcoat:.62,iridescence:.10}),
    glassEdge:mat({color:'#edece1',metalness:.32,roughness:.19,transparent:true,opacity:.82}),
    film:mat({color:'#e1e3d4',transparent:true,opacity:.34,depthWrite:false,forceSinglePass:true,transmission:.67,thickness:.022,ior:1.34,roughness:.16,iridescence:.10,clearcoat:.50})
  };
  return { ...materials,dispose(){Object.values(materials).forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
