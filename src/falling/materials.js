import * as T from 'three';

export function random(seed=2709){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function canvas(n=1024){const c=document.createElement('canvas');c.width=c.height=n;return [c,c.getContext('2d')];}
function texture(c,color=true){const t=new T.CanvasTexture(c);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=8;return t;}
function study(kind,seed){
  const[c,x]=canvas(),n=c.width,r=random(seed),data=x.createImageData(n,n);
  const base={wine:[92,31,45],carbon:[23,22,27],silver:[208,211,217],ivory:[213,205,190],petal:[239,226,197],linen:[146,141,134]}[kind];
  for(let y=0;y<n;y++)for(let a=0;a<n;a++){
    const grain=(r()-.5)*(kind==='silver'?23:16),cloud=Math.sin(a*.012+y*.007)*Math.cos(y*.009)*3.0;
    const warp=Math.sin(a*Math.PI*.50)*Math.sin(y*Math.PI*.52)*1.7;
    const g=grain+cloud+(kind==='wine'||kind==='linen'?warp:0),index=(y*n+a)*4;
    for(let k=0;k<3;k++)data.data[index+k]=Math.max(0,Math.min(255,base[k]+g));data.data[index+3]=255;
  }x.putImageData(data,0,0);
  x.lineWidth=.35;
  for(let i=0;i<1900;i++){
    const a=r()*n,b=r()*n,w=kind==='silver'?10+r()*70:2+r()*15;
    x.strokeStyle=r()>.5?'rgba(255,249,230,.09)':'rgba(30,17,27,.09)';x.beginPath();x.moveTo(a,b);x.lineTo(a+w,b+(r()-.5)*1.3);x.stroke();
  }
  if(kind==='wine'||kind==='linen'){
    for(let i=0;i<n;i+=4){x.strokeStyle=i%8===0?'#f4dac40b':'#11091316';x.lineWidth=.5;x.beginPath();x.moveTo(i,0);x.lineTo(i+Math.sin(i)*.8,n);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(n,i+.6);x.stroke();}
  }
  if(kind==='petal'){
    for(let i=0;i<85;i++){const a=r()*n;x.lineWidth=.5;x.strokeStyle='#b1a28530';x.beginPath();x.moveTo(a,0);x.bezierCurveTo(a-30,n*.3,a+40,n*.7,a+15,n);x.stroke();}
    const fade=x.createLinearGradient(0,0,0,n);fade.addColorStop(0,'#9b684e65');fade.addColorStop(.40,'#a08d6520');fade.addColorStop(1,'#fff9e320');x.fillStyle=fade;x.fillRect(0,0,n,n);
  }
  return texture(c);
}
function print(){
  const[c,x]=canvas();x.fillStyle='#232128';x.fillRect(0,0,1024,1024);
  x.save();x.translate(40,60);x.scale(.70,1.52);x.font='300 216px serif';x.strokeStyle='#d8d0c9';x.lineWidth=.65;x.strokeText('在坠',-12,160);x.strokeText('落时',100,335);x.restore();
  const r=random(271);for(let i=0;i<36;i++){const a=r()*1024,b=r()*1024;x.strokeStyle='#d2cec45a';x.lineWidth=.45;x.beginPath();x.moveTo(a,b);x.lineTo(a+6+r()*14,b-22-r()*50);x.stroke();}
  return texture(c);
}
function inscribed(){const[c,x]=canvas();x.fillStyle='#302c32';x.fillRect(0,0,1024,1024);x.save();x.translate(92,385);x.scale(.88,1.1);x.font='300 116px serif';x.fillStyle='#bcb5a6';x.fillText('在坠落时',0,0);x.font='25px serif';x.fillStyle='#928780';x.fillText('STILL / FALLING',10,64);x.restore();x.strokeStyle='#bcb5a64a';x.lineWidth=1;x.beginPath();x.moveTo(108,527);x.lineTo(741,506);x.stroke();return texture(c);}
export function makeMaterials(){
  const maps={};for(const[k,i]of ['wine','carbon','silver','ivory','petal','linen'].map((k,i)=>[k,i]))maps[k]=study(k,2700+i*19);maps.print=print();maps.inscribed=inscribed();
  const m={};const make=(name,settings,physical=false)=>m[name]=new (physical?T.MeshPhysicalMaterial:T.MeshStandardMaterial)({name:'falling-028-'+name,side:T.DoubleSide,...settings});
  make('core',{color:'#352e39',map:maps.wine,bumpMap:maps.wine,bumpScale:.003,roughness:.97});
  make('silk',{color:'#d3aeac',map:maps.wine,bumpMap:maps.wine,bumpScale:.002,roughness:.86,sheen:.8,sheenColor:new T.Color('#b97682'),sheenRoughness:.65},true);
  make('darkSilk',{color:'#967677',map:maps.wine,roughness:.93,sheen:.7,sheenColor:new T.Color('#ac526b')},true);
  make('black',{map:maps.carbon,roughness:.82,bumpMap:maps.carbon,bumpScale:.0018,metalness:.06});
  make('graphite',{color:'#35343d',roughness:.57,metalness:.32,bumpMap:maps.carbon,bumpScale:.0016});
  make('print',{map:maps.print,roughness:.86,metalness:.03});
  make('label',{map:maps.inscribed,roughness:.73,metalness:.20});
  make('silver',{map:maps.silver,metalness:.94,roughness:.29,bumpMap:maps.silver,bumpScale:.0016});
  make('edgeSilver',{color:'#e2e8ef',metalness:.96,roughness:.20});
  make('silverBack',{map:maps.silver,color:'#83899a',roughness:.46,metalness:.81});
  make('paperBack',{color:'#5e5559',map:maps.linen,roughness:.98});
  make('dustRose',{color:'#c8a5ac',map:maps.ivory,roughness:.97,bumpMap:maps.linen,bumpScale:.0028});
  make('ash',{color:'#8e939e',map:maps.ivory,roughness:.91,bumpMap:maps.linen,bumpScale:.002});
  make('paper',{map:maps.ivory,roughness:.98,bumpMap:maps.ivory,bumpScale:.002});
  make('linen',{map:maps.linen,roughness:.98,bumpMap:maps.linen,bumpScale:.0028});
  make('thread',{color:'#b7ada6',roughness:.56,metalness:.55});
  make('blackThread',{color:'#383038',roughness:.97});
  make('redThread',{color:'#a41534',roughness:.78});
  make('rustThread',{color:'#853348',roughness:.95});
  make('oldGold',{color:'#99805e',roughness:.69,metalness:.30});
  make('rustPetal',{map:maps.petal,color:'#9b6158',roughness:.98});
  make('stem',{color:'#8e7c63',roughness:.91});
  make('seed',{color:'#92774d',roughness:.86});
  make('petal',{map:maps.petal,color:'#e8ded0',roughness:.91,bumpMap:maps.petal,bumpScale:.001});
  make('petalShadow',{map:maps.petal,color:'#bca79b',roughness:.93});
  make('ochre',{map:maps.petal,color:'#c2a678',roughness:.94,bumpMap:maps.petal,bumpScale:.001});
  make('ochreShadow',{map:maps.petal,color:'#ae8e68',roughness:.96});
  make('rose',{map:maps.petal,color:'#bf968c',roughness:.96});
  make('stone',{color:'#8d8989',map:maps.ivory,roughness:.94,flatShading:true});
  make('roseStone',{color:'#bba69f',map:maps.ivory,roughness:.96,flatShading:true});
  make('ruby',{color:'#af1439',roughness:.19,metalness:.16,clearcoat:1,clearcoatRoughness:.12,transmission:.28,ior:1.47,thickness:.11,attenuationDistance:.5,attenuationColor:new T.Color('#700d25')},true);
  make('garnet',{color:'#5e162f',roughness:.23,metalness:.21,clearcoat:1},true);
  make('film',{color:'#ae6473',roughness:.35,metalness:.14,transparent:true,opacity:.30,depthWrite:false,clearcoat:.8},true);
  make('wing',{color:'#d9cdb2',roughness:.96,transparent:true,opacity:.16,depthWrite:false});
  return {m,maps,dispose(){Object.values(m).forEach(a=>a.dispose());Object.values(maps).forEach(a=>a.dispose());}};
}
