import * as T from 'three';
export function random(seed=290930){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function canvas(n=1024){const c=document.createElement('canvas');c.width=c.height=n;return[c,c.getContext('2d')];}
function tex(c,color=true){const t=new T.CanvasTexture(c);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=8;return t;}
function noise(x,y,seed){const q=Math.sin(x*127.1+y*311.7+seed*73.9)*43758.5453;return q-Math.floor(q);}
function field(x,y,scale,seed){x/=scale;y/=scale;const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(noise(a,b,seed),noise(a+1,b,seed),s),T.MathUtils.lerp(noise(a,b+1,seed),noise(a+1,b+1,seed),s),t);}
function textile(base,seed,{weave=true,stone=false}={}){
  const[c,x]=canvas(),[normal,nx]=canvas(),[rough,rx]=canvas(),n=c.width,r=random(seed),im=x.createImageData(n,n),nm=nx.createImageData(n,n),rm=rx.createImageData(n,n),height=new Float32Array(n*n);
  for(let y=0;y<n;y++)for(let a=0;a<n;a++){
    const i=y*n+a,j=i*4,broad=field(a,y,72,seed),fine=field(a,y,9,seed+3),grain=r(),warp=Math.sin((a+.75*Math.sin(y*.016))*Math.PI*.26),weft=Math.sin((y+.70*Math.sin(a*.021))*Math.PI*.24),thread=weave?(Math.max(warp,weft)*.55+warp*weft*.17):0;
    const g=(broad-.5)*42+(fine-.5)*22+(grain-.5)*(stone?59:49)+thread*21,holes=grain>.95?-34:0;
    for(let k=0;k<3;k++)im.data[j+k]=Math.max(0,Math.min(255,base[k]+g+holes));im.data[j+3]=255;
    height[i]=.38*thread+.28*fine+.24*grain+.14*broad;
    const v=Math.min(255,Math.max(70,181+(grain-.5)*73+(broad-.5)*29));rm.data[j]=rm.data[j+1]=rm.data[j+2]=v;rm.data[j+3]=255;
  }
  for(let y=0;y<n;y++)for(let a=0;a<n;a++){
    const i=y*n+a,j=i*4,dx=height[y*n+(a+1)%n]-height[y*n+(a+n-1)%n],dy=height[((y+1)%n)*n+a]-height[((y+n-1)%n)*n+a],v=new T.Vector3(-dx*1.6,-dy*1.6,1).normalize();nm.data[j]=(v.x*.5+.5)*255;nm.data[j+1]=(v.y*.5+.5)*255;nm.data[j+2]=(v.z*.5+.5)*255;nm.data[j+3]=255;
  }
  x.putImageData(im,0,0);nx.putImageData(nm,0,0);rx.putImageData(rm,0,0);
  // Individual broken fibres and tiny imperfections, not a flat noise overlay.
  for(let i=0;i<3100;i++){const a=r()*n,b=r()*n,light=r()>.56;x.strokeStyle=light?'rgba(243,240,230,.24)':'rgba(11,14,19,.32)';x.lineWidth=.35+r()*.65;x.beginPath();x.moveTo(a,b);x.lineTo(a+(weave?r()*.9:(r()-.5)*9),b+1+r()*(weave?12:3));x.stroke();}
  return{map:tex(c),normal:tex(normal,false),rough:tex(rough,false)};
}
function petalMap(){const[c,x]=canvas(),r=random(29611);x.fillStyle='#e8d0ad';x.fillRect(0,0,1024,1024);const g=x.createLinearGradient(0,0,0,1024);g.addColorStop(0,'#836843');g.addColorStop(.22,'#c5a576');g.addColorStop(.62,'#edcfac');g.addColorStop(1,'#b69a7f');x.fillStyle=g;x.fillRect(0,0,1024,1024);
  for(let i=0;i<190;i++){const a=r()*1024;x.strokeStyle=i%3?'#7652384a':'#fff5db73';x.lineWidth=.6+r()*2;x.beginPath();x.moveTo(a,0);x.bezierCurveTo(a-25,310,a+45,680,a+(r()-.5)*65,1024);x.stroke();}
  for(let i=0;i<12000;i++){x.fillStyle=r()>.7?'#41231350':'#fff0ce30';x.fillRect(r()*1024,r()*1024,.5+r()*2,.5+r()*3);}return tex(c);
}
function lettering(){const[c,x]=canvas(),r=random(29932);x.fillStyle='#555259';x.fillRect(0,0,1024,1024);for(let i=0;i<29000;i++){x.fillStyle=r()>.5?'#b8aaa11d':'#090b122d';x.fillRect(r()*1024,r()*1024,1+r()*2,1+r()*2);}x.save();x.translate(105,125);x.transform(1,-.13,-.14,1,0,0);x.scale(.68,1.82);x.font='200 192px serif';x.lineWidth=1.55;x.strokeStyle='#eae7df';x.strokeText('在坠落时',0,205);x.font='22px serif';x.fillStyle='#c9c0b5';x.fillText('A MOMENT / STILL HELD',125,283);x.restore();x.strokeStyle='#ddd9c268';x.lineWidth=.7;for(let i=0;i<17;i++){const a=140+r()*750,b=450+r()*330;x.beginPath();x.moveTo(a,b);x.lineTo(a+18+r()*130,b-110-r()*260);x.stroke();}return tex(c);}
function gauzeMap(){const[c,x]=canvas(),r=random(29381);x.clearRect(0,0,1024,1024);for(let j=0;j<114;j++){x.lineWidth=.55+r()*1.2;x.strokeStyle=`rgba(176,181,183,${.35+r()*.55})`;for(let k=0;k<2;k++){x.beginPath();for(let t=0;t<=64;t++){const a=t*16,b=j*9+(r()-.5)*1.4+Math.sin(t*.21+j)*2.8;if(k){if(t===0)x.moveTo(b,a);else x.lineTo(b,a);}else{if(t===0)x.moveTo(a,b);else x.lineTo(a,b);}}x.stroke();}}return tex(c);}
export function makeMaterials(){
  const cloth=textile([168,175,178],2901),carbon=textile([28,29,31],2902),paper=textile([122,119,122],2903,{weave:false}),red=textile([191,31,47],2904),stone=textile([142,146,147],2905,{weave:false,stone:true});
  const maps={cloth:cloth.map,clothNormal:cloth.normal,clothRough:cloth.rough,carbon:carbon.map,carbonNormal:carbon.normal,carbonRough:carbon.rough,paper:paper.map,paperNormal:paper.normal,paperRough:paper.rough,red:red.map,redNormal:red.normal,redRough:red.rough,stone:stone.map,stoneNormal:stone.normal,stoneRough:stone.rough,petal:petalMap(),label:lettering(),gauze:gauzeMap()};
  const m={};function make(name,settings,physical=false){m[name]=new(physical?T.MeshPhysicalMaterial:T.MeshStandardMaterial)({name:'falling-030-'+name,side:T.DoubleSide,...settings});return m[name];}
  const woven={map:maps.cloth,normalMap:maps.clothNormal,normalScale:new T.Vector2(.75,.75),roughnessMap:maps.clothRough};
  const black={map:maps.carbon,normalMap:maps.carbonNormal,normalScale:new T.Vector2(.65,.65),roughnessMap:maps.carbonRough};
  const rock={map:maps.stone,normalMap:maps.stoneNormal,normalScale:new T.Vector2(.9,.9),roughnessMap:maps.stoneRough};
  make('core',{map:maps.carbon,color:'#b7a5ab',normalMap:maps.carbonNormal,roughness:.99});
  make('redCloth',{map:maps.red,normalMap:maps.redNormal,roughnessMap:maps.redRough,roughness:.94,color:'#ee929a'});
  make('black',{...black,roughness:.91,metalness:.02});make('charcoal',{...black,color:'#9c9fa4',roughness:.98});
  make('silverCloth',{...woven,metalness:.37,roughness:.79});make('silverDark',{...woven,color:'#828695',metalness:.40,roughness:.84});
  make('silver',{...woven,color:'#e3e8eb',normalScale:new T.Vector2(.36,.36),metalness:.87,roughness:.42});
  make('edgeSilver',{color:'#bbc2c5',metalness:.83,roughness:.43});
  make('dustRose',{map:maps.paper,color:'#dbbbc0',normalMap:maps.paperNormal,roughness:.97});
  make('ash',{map:maps.paper,color:'#bfc4cb',normalMap:maps.paperNormal,roughness:.98});
  make('paperBack',{...black,roughness:.98,color:'#d2c9c4'});
  make('darkPrint',{map:maps.label,color:'#6a6465',normalMap:maps.paperNormal,roughness:.97});
  make('label',{map:maps.label,normalMap:maps.paperNormal,normalScale:new T.Vector2(.28,.28),roughness:.89,metalness:.07});
  make('stone',{...rock,roughness:1,color:'#b2bac1'});make('roseStone',{...rock,roughness:1,color:'#b58486'});make('darkStone',{...rock,roughness:.95,color:'#53565c'});
  make('ivory',{map:maps.petal,color:'#fff2da',roughness:.97});make('ochre',{map:maps.petal,color:'#fbbb48',roughness:.94});make('rustPetal',{map:maps.petal,color:'#bd744d',roughness:.97});make('rose',{map:maps.petal,color:'#d8b2b1',roughness:.98});make('petalBack',{map:maps.petal,color:'#b19d85',roughness:.99});
  make('leafFilm',{color:'#b7a194',roughness:.99,transparent:true,opacity:.15,depthWrite:false});
  make('seed',{color:'#92754b',roughness:.98});make('stem',{color:'#8b7d75',roughness:1});make('oldLeaf',{map:maps.petal,color:'#9e9082',roughness:.96});
  make('thread',{color:'#9fa7a5',roughness:.72,metalness:.31});make('darkThread',{color:'#252429',roughness:.98});
  make('fiber',{color:'#752031',roughness:.99});make('fiberLight',{color:'#9c2940',roughness:.96});make('redThread',{color:'#b61632',roughness:.77});
  make('coral',{map:maps.red,color:'#efb7b4',normalMap:maps.redNormal,roughness:.67});
  make('ruby',{color:'#aa0e25',roughness:.17,metalness:.17,clearcoat:1,clearcoatRoughness:.11,transmission:.14,ior:1.51,thickness:.042},true);
  make('garnet',{color:'#510e1a',roughness:.21,metalness:.22,clearcoat:.92},true);
  make('rubyBright',{color:'#ce1e35',roughness:.16,metalness:.12,clearcoat:1},true);
  make('gauze',{map:maps.gauze,alphaTest:.22,roughness:.95,metalness:.19,transparent:false});
  make('purpleGlass',{color:'#4b2868',roughness:.23,metalness:.13,clearcoat:1},true);make('blueGlass',{color:'#233b80',roughness:.24,metalness:.28,clearcoat:.9},true);make('olive',{color:'#727b32',roughness:.81,metalness:.2});
  return{m,maps,dispose(){Object.values(m).forEach(x=>x.dispose());Object.values(maps).forEach(x=>x.dispose());}};
}
