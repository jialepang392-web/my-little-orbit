import * as T from 'three';

/** Original deterministic, locally drawn material studies; no image/font input. */
export function makeMaterials(){
  const textures=[];let seed=180032;
  const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  function texture(kind){
    const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
    x.fillStyle=kind==='linen'?'#e8e9dc':kind==='leaf'?'#cfddad':kind==='glaze'?'#b5c7e7':'#f6efdb';x.fillRect(0,0,512,512);
    for(let i=0;i<(kind==='leaf'?180:50);i++){const a=rnd()*512,b=rnd()*512,r=8+rnd()*55,g=x.createRadialGradient(a,b,0,a,b,r);g.addColorStop(0,kind==='leaf'?`rgba(${rnd()>.5?'76,110,38':'240,239,181'},.16)`:kind==='glaze'?'rgba(245,243,222,.18)':'rgba(128,112,70,.035)');g.addColorStop(1,'rgba(128,130,80,0)');x.fillStyle=g;x.fillRect(a-r,b-r,r*2,r*2);}
    for(let i=0;i<22000;i++){const a=rnd()*512,b=rnd()*512;x.fillStyle=`rgba(${rnd()>.5?'255,255,240':'38,48,25'},${.025+rnd()*.08})`;x.fillRect(a,b,kind==='linen'?1:2,kind==='linen'?4:1);}
    if(kind==='linen')for(let i=0;i<512;i+=2){x.strokeStyle=i%4?'#ffffff15':'#52594413';x.lineWidth=.45;x.beginPath();x.moveTo(i,0);x.bezierCurveTo(i+.8,170,i-.6,320,i,512);x.moveTo(0,i);x.lineTo(512,i+.4);x.stroke();}
    if(kind==='leaf')for(let j=0;j<35;j++){const y=j*14+rnd()*10;x.strokeStyle='#67854925';x.lineWidth=.65;for(const side of [-1,1]){x.beginPath();x.moveTo(256,y);x.bezierCurveTo(256+side*45,y+20,256+side*140,y+27,256+side*260,y+90);x.stroke();for(let k=1;k<6;k++){x.beginPath();x.moveTo(256+side*k*36,y+k*7);x.quadraticCurveTo(256+side*(k*36+15),y+k*7+20,256+side*(k*36+25),y+k*7+40);x.stroke();}}}
    if(['paper','menu','receipt','verso'].includes(kind)){
      for(let i=0;i<1400;i++){x.strokeStyle='#736d4520';x.lineWidth=.45;const a=rnd()*512,b=rnd()*512;x.beginPath();x.moveTo(a,b);x.lineTo(a+1+rnd()*7,b+rnd()*3);x.stroke();}
      x.strokeStyle='#aa855c16';x.lineWidth=7;x.beginPath();x.ellipse(350,340,90,76,.3,.1,4.5);x.stroke();x.strokeStyle=kind==='verso'?'#4f644936':'#365a3bd9';x.lineCap='round';
      if(kind==='paper'){x.lineWidth=8;x.beginPath();x.moveTo(92,337);x.bezierCurveTo(200,340,98,187,171,135);x.bezierCurveTo(214,116,179,253,267,267);x.bezierCurveTo(341,282,245,96,365,119);x.stroke();x.lineWidth=2;x.beginPath();x.moveTo(116,360);x.bezierCurveTo(247,399,334,318,409,332);x.stroke();x.fillStyle='#36583e';x.font='18px serif';x.save();x.translate(99,93);x.rotate(-.07);x.fillText('JIE LAN',0,0);x.restore();x.font='13px serif';x.fillText('STILL WARM',235,426);}
      else if(kind==='menu'){x.fillStyle='#45603b';x.font='17px serif';x.fillText('微苦的日常',71,103);x.lineWidth=1.3;for(let j=0;j<5;j++){const y=170+j*43;x.beginPath();x.moveTo(75,y);x.bezierCurveTo(93,y-18,114,y+10,142,y-6);x.moveTo(163,y-4);x.lineTo(265+j%3*29,y-7);x.moveTo(351,y-5);x.lineTo(373,y-7);x.stroke();}x.lineWidth=3;x.beginPath();x.moveTo(104,414);x.bezierCurveTo(156,356,194,480,304,404);x.stroke();}
      else if(kind==='receipt'){x.fillStyle='#786f5866';x.font='14px monospace';x.fillText('18 / TABLE',84,75);for(let j=0;j<13;j++){x.fillRect(78,114+j*22,50+rnd()*160,1);x.fillRect(323,114+j*22,25+rnd()*40,1);}x.font='12px serif';x.fillText('STILL WARM',100,458);}
      else{x.lineWidth=1.2;x.beginPath();x.moveTo(111,189);x.bezierCurveTo(180,127,166,250,249,218);x.moveTo(330,309);x.lineTo(362,299);x.stroke();}
    }
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;textures.push(t);return t;
  }
  const linenMap=texture('linen'),leafMap=texture('leaf'),paperMap=texture('paper'),grain=texture('grain'),glaze=texture('glaze');
  const mat=o=>new T.MeshPhysicalMaterial({side:T.DoubleSide,...o});
  const materials={
    blue:mat({color:'#164fba',map:glaze,roughness:.34,roughnessMap:glaze,clearcoat:.48,clearcoatRoughness:.32,bumpMap:glaze,bumpScale:.024}),
    porcelain:mat({color:'#d8e0df',map:grain,roughness:.65,bumpMap:grain,bumpScale:.022}),
    linen:mat({color:'#c1c9b2',map:linenMap,bumpMap:linenMap,bumpScale:.012,roughness:.96,sheen:.5,sheenColor:'#e1e3cd'}),
    linenPale:mat({color:'#d5cfbb',map:linenMap,bumpMap:linenMap,bumpScale:.01,roughness:.98,sheen:.35}),
    leaf:mat({color:'#688849',map:leafMap,bumpMap:leafMap,bumpScale:.025,roughness:.64,clearcoat:.08}),
    young:mat({color:'#a9be66',map:leafMap,bumpMap:leafMap,bumpScale:.018,roughness:.58,clearcoat:.1}),
    vein:mat({color:'#829763',roughness:.78}),
    branch:mat({color:'#837451',map:grain,bumpMap:grain,bumpScale:.032,roughness:.96}),
    bud:mat({color:'#733745',map:grain,roughness:.89}),
    flower:mat({color:'#eee2a5',roughness:.88}),
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
    wine:mat({color:'#b86a86',transparent:true,opacity:.38,depthWrite:false,forceSinglePass:true,transmission:.2,thickness:.008,ior:1.18,roughness:.15,clearcoat:.2,attenuationColor:'#e9becd',attenuationDistance:4}),
    amber:mat({color:'#edc789',transparent:true,opacity:.32,depthWrite:false,forceSinglePass:true,transmission:.24,thickness:.012,ior:1.22,roughness:.16,clearcoat:.18}),
    film:mat({color:'#ddd0df',transmission:.88,thickness:.01,roughness:.4,iridescence:.12})
  };
  return { ...materials,dispose(){Object.values(materials).forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
