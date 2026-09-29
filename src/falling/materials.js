import * as T from 'three';

// Original, seeded material studies. No reference-image pixels or remote assets.
export function random(seed=601){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function canvas(size=768){const c=document.createElement('canvas');c.width=c.height=size;return[c,c.getContext('2d')];}
function texture(c,color=true){const t=new T.CanvasTexture(c);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;return t;}
function surface(kind,seed){
  const [c,x]=canvas(),r=random(seed),n=c.width;
  const bases={paper:[214,206,192],black:[37,35,37],silver:[146,146,146],red:[133,20,36],slate:[63,57,63],linen:[174,170,164]};
  const base=bases[kind],image=x.createImageData(n,n);
  for(let y=0;y<n;y++)for(let a=0;a<n;a++){
    const weave=(Math.sin(a*2.4)+Math.sin(y*2.3))*1.8;
    const fold=Math.sin(a*.017+y*.014)*7+Math.sin(a*.031-y*.009)*4;
    const v=(r()-.5)*(kind==='silver'?38:22)+fold+weave;
    const p=(y*n+a)*4;for(let k=0;k<3;k++)image.data[p+k]=Math.max(0,Math.min(255,base[k]+v));image.data[p+3]=255;
  }
  x.putImageData(image,0,0);
  for(let i=0;i<2400;i++){
    const a=r()*n,b=r()*n,l=2+r()*28;
    x.strokeStyle=r()>.5?'rgba(250,239,224,.14)':'rgba(17,13,20,.14)';x.lineWidth=.25+r()*.65;x.beginPath();x.moveTo(a,b);x.lineTo(a+l,b+(r()-.5)*5);x.stroke();
  }
  if(kind==='silver'||kind==='black'){
    for(let i=0;i<26;i++){
      const a=r()*n,b=r()*n;const grad=x.createLinearGradient(a,b,a+70,b+30);grad.addColorStop(0,'#f7f1e700');grad.addColorStop(.45,kind==='silver'?'#ece9e833':'#fff7e90e');grad.addColorStop(.5,'#08071055');grad.addColorStop(1,'#16141a00');x.fillStyle=grad;x.beginPath();x.moveTo(a,b);x.lineTo(a-90+r()*220,b+90+r()*260);x.lineTo(a+110,b+220);x.closePath();x.fill();
    }
  }
  if(kind==='linen'){
    x.lineWidth=1.0;
    for(let i=0;i<n;i+=5){x.strokeStyle=i%10?'#e5dfcb55':'#403e3866';x.beginPath();x.moveTo(i,0);x.lineTo(i+2,n);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(n,i+2);x.stroke();}
  }
  if(kind==='slate'){
    x.strokeStyle='#e7dbb188';x.lineWidth=.65;
    for(let i=0;i<31;i++){const a=180+r()*400,b=100+r()*550;x.beginPath();x.moveTo(a,b);x.lineTo(a-55+r()*100,b+60+r()*180);x.stroke();}
    x.save();x.translate(n*.24,n*.48);x.rotate(-.13);x.strokeStyle='#e8dfc199';x.lineWidth=.9;x.font='300 96px serif';x.scale(.66,1.35);x.strokeText('在坠落时',0,0);x.restore();
    x.fillStyle='#d7cbb580';x.font='17px serif';x.fillText('STILL / FALLING',70,652);x.font='11px monospace';x.fillText('006     A MOMENT HELD TOGETHER',70,678);
  }
  return texture(c);
}
function printTexture(){const[c,x]=canvas();x.fillStyle='#211e22';x.fillRect(0,0,768,768);x.save();x.translate(10,40);x.rotate(-.06);x.scale(.7,1.58);x.font='300 230px serif';x.strokeStyle='#d8d4cd';x.lineWidth=1.3;x.strokeText('在坠',-34,170);x.strokeText('落时',28,400);x.restore();const r=random(699);for(let i=0;i<1300;i++){x.fillStyle=r()>.5?'#f7ead70b':'#00000022';x.fillRect(r()*768,r()*768,r()*30+1,.5);}return texture(c);}
export function makeMaterials(){
  const maps={};for(const[k,i]of ['paper','black','silver','red','slate','linen'].map((k,i)=>[k,i]))maps[k]=surface(k,601+i*29);maps.print=printTexture();
  const m={};
  const make=(name,options)=>{const mat=new T.MeshStandardMaterial({name:'falling-'+name,side:T.DoubleSide,...options});m[name]=mat;return mat;};
  make('core',{color:'#40131e',map:maps.red,bumpMap:maps.red,bumpScale:.009,roughness:.97});
  make('velvet',{color:'#cf2946',map:maps.red,bumpMap:maps.linen,bumpScale:.006,roughness:.95});
  make('black',{map:maps.black,bumpMap:maps.silver,bumpScale:.004,roughness:.82,metalness:.12});
  make('printed',{map:maps.print,bumpMap:maps.black,bumpScale:.002,roughness:.86});
  make('silver',{map:maps.silver,bumpMap:maps.silver,bumpScale:.004,metalness:.82,roughness:.49});
  make('paleSilver',{color:'#d8d5d0',map:maps.silver,bumpMap:maps.silver,bumpScale:.003,metalness:.65,roughness:.57});
  make('linen',{map:maps.linen,bumpMap:maps.linen,bumpScale:.005,roughness:.96});
  make('paper',{map:maps.paper,bumpMap:maps.paper,bumpScale:.0025,roughness:.93});
  make('ink',{color:'#2f2833',metalness:.14,roughness:.68});
  make('slate',{map:maps.slate,bumpMap:maps.slate,bumpScale:.0006,metalness:.18,roughness:.81});
  make('thread',{color:'#a9a09b',metalness:.7,roughness:.47});
  make('darkThread',{color:'#292329',roughness:.88});
  make('redThread',{color:'#94142c',roughness:.82});
  make('stone',{color:'#a7aeb1',map:maps.paper,roughness:.96,bumpMap:maps.paper,bumpScale:.003,flatShading:true});
  make('roseStone',{color:'#b78b87',map:maps.paper,roughness:.91,bumpMap:maps.paper,bumpScale:.003,flatShading:true});
  make('driedStem',{color:'#847555',roughness:.88});
  make('petalIvory',{color:'#cbb891',map:maps.paper,roughness:.9,bumpMap:maps.linen,bumpScale:.0015});
  make('petalPale',{color:'#ded3c1',map:maps.paper,roughness:.91,bumpMap:maps.paper,bumpScale:.0015});
  make('petalOchre',{color:'#cd984c',map:maps.paper,roughness:.92,bumpMap:maps.linen,bumpScale:.0015});
  make('petalRust',{color:'#b67e5b',map:maps.paper,roughness:.92,bumpMap:maps.linen,bumpScale:.0015});
  make('seed',{color:'#80632d',roughness:.88});
  m.ruby=new T.MeshPhysicalMaterial({name:'falling-ruby-glass',color:'#b60026',metalness:.28,roughness:.19,clearcoat:1,clearcoatRoughness:.14,transmission:.15,thickness:.12,ior:1.48,attenuationColor:new T.Color('#8e001a'),attenuationDistance:.5});
  m.garnet=new T.MeshPhysicalMaterial({name:'falling-garnet',color:'#620c25',metalness:.42,roughness:.25,clearcoat:.85});
  m.crimsonGlass=new T.MeshPhysicalMaterial({name:'falling-crimson-film',color:'#ad122e',side:T.DoubleSide,metalness:.16,roughness:.38,transparent:true,opacity:.56,depthWrite:false,clearcoat:.65});
  m.seedWing=new T.MeshStandardMaterial({name:'falling-dried-translucent-wing',color:'#c7b7a1',roughness:.89,side:T.DoubleSide,transparent:true,opacity:.40,depthWrite:false});
  m.amethyst=new T.MeshPhysicalMaterial({name:'falling-amethyst-remnant',color:'#745082',metalness:.10,roughness:.24,clearcoat:1,transmission:.44,thickness:.025,side:T.DoubleSide});
  m.cobalt=new T.MeshPhysicalMaterial({name:'falling-inkblue-remnant',color:'#345b94',metalness:.12,roughness:.22,clearcoat:1,transmission:.44,thickness:.025,side:T.DoubleSide});
  m.glass=new T.MeshPhysicalMaterial({name:'falling-smoke-glass',color:'#a7a2a0',roughness:.16,metalness:.18,transmission:.36,thickness:.07,ior:1.43,side:T.DoubleSide,clearcoat:1});
  return {m,maps,dispose(){Object.values(m).forEach(x=>x.dispose());Object.values(maps).forEach(x=>x.dispose());}};
}
