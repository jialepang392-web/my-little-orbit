import * as T from 'three';

/** Original paper, mineral and ink studies; no reference artwork pixels. */
export function makeMaterials(){
  const maps=[],N=512;let state=347901;
  const rnd=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
  const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
  const noise=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(i,j),hash(i+1,j),a),T.MathUtils.lerp(hash(i,j+1),hash(i+1,j+1),a),b);};
  function texture(kind){
    const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N);
    for(let y=0;y<N;y++)for(let u=0;u<N;u++){
      const k=(y*N+u)*4,n=noise(u/65,y/71)*.48+noise(u/23,y/29)*.27+noise(u/7,y/8)*.16+noise(u/2,y/2)*.09;
      let value=kind==='stone'?170+n*70:kind==='dark'?31+n*88:214+n*36;
      if(kind==='stone')value-=Math.pow(Math.max(0,Math.sin(u*.014+y*.029+n*13)),22)*30;
      if(kind==='fabric')value-=12*(Math.pow(Math.cos(u*Math.PI/3),8)+Math.pow(Math.cos(y*Math.PI/4),8));
      const warm=kind==='paper'||kind==='title'||kind==='fabric';
      im.data[k]=value+(warm?3:0);im.data[k+1]=value;im.data[k+2]=value-(warm?9:2);im.data[k+3]=255;
      if(kind==='mist'){const a=Math.pow(Math.max(0,Math.sin(u/N*Math.PI)*Math.sin(y/N*Math.PI)),1.6);im.data[k]=249;im.data[k+1]=249;im.data[k+2]=243;im.data[k+3]=255*a*Math.max(0,(n-.19)*2.7);}
    }
    x.putImageData(im,0,0);
    if(kind!=='mist'){
      for(let j=0;j<9500;j++){const u=rnd()*N,v=rnd()*N,l=.4+rnd()*4;x.strokeStyle=j%4?'#ffffff28':'#252b3026';x.lineWidth=.25+rnd()*.7;x.beginPath();x.moveTo(u,v);x.lineTo(u+l,v+l*.3);x.stroke();}
      if(['paper','title','fabric','ink'].includes(kind))for(let j=0;j<1700;j++){const u=rnd()*N,v=rnd()*N;x.strokeStyle=j%3?'#716d581c':'#fffce75c';x.lineWidth=.3+rnd()*.7;x.beginPath();x.moveTo(u,v);x.quadraticCurveTo(u+3,v-4,u+8+rnd()*11,v-7);x.stroke();}
      if(kind==='stone')for(let j=0;j<3500;j++){const u=rnd()*N,v=rnd()*N;x.strokeStyle=j%3?'#28333039':'#ffffff52';x.lineWidth=.3+rnd()*.8;x.beginPath();x.moveTo(u,v);x.lineTo(u+2+rnd()*18,v+1+rnd()*4);x.stroke();}
      if(kind==='ink'){
        x.save();x.translate(224,182);x.rotate(-.27);x.fillStyle='#292c2abb';x.font='290px "Kaiti SC",STKaiti,KaiTi,serif';x.textAlign='center';x.fillText('山',0,22);x.fillText('水',71,277);x.restore();
        for(let j=0;j<300;j++){const u=rnd()*N,v=rnd()*N;x.strokeStyle='#25282252';x.lineWidth=.3+rnd()*.8;x.beginPath();x.moveTo(u,v);x.lineTo(u+3+rnd()*23,v+12);x.stroke();}
        for(let j=0;j<1700;j++){x.fillStyle='#f0f0df53';x.fillRect(rnd()*N,rnd()*N,.4+rnd()*1.4,2+rnd()*8);}
      }
      if(kind==='title'){
        x.save();x.translate(258,220);x.rotate(-.12);x.fillStyle='#333936e6';x.textAlign='center';x.font='138px "Kaiti SC",STKaiti,KaiTi,serif';x.fillText('以我',-10,-24);x.fillText('之见',14,126);x.restore();
        x.fillStyle='#a13b3780';x.fillRect(361,353,31,31);x.strokeStyle='#eee2cbaa';x.lineWidth=2;x.strokeRect(367,359,19,19);
        x.strokeStyle='#333c3738';x.lineWidth=1;for(let j=0;j<6;j++){x.beginPath();x.moveTo(65,90+j*18);x.lineTo(110+j*3,100+j*18);x.stroke();}
      }
    }
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;maps.push(map);return map;
  }
  const paper=texture('paper'),stone=texture('stone'),dark=texture('dark'),ink=texture('ink'),fabric=texture('fabric'),mist=texture('mist'),title=texture('title');
  const bump=map=>{const t=map.clone();t.colorSpace=T.NoColorSpace;maps.push(t);return t;};
  const paperB=bump(paper),stoneB=bump(stone),fabricB=bump(fabric);
  const mat=options=>new T.MeshPhysicalMaterial({side:T.FrontSide,roughness:.94,...options});
  const m={
    paper:mat({color:'#dad7d2',map:paper,bumpMap:paperB,bumpScale:.009}),
    pale:mat({color:'#faf5e8',map:paper,bumpMap:paperB,bumpScale:.011}),
    greyPaper:mat({color:'#c2c1bd',map:paper,bumpMap:paperB,bumpScale:.007}),
    inkPaper:mat({color:'#d8d7d1',map:ink,bumpMap:paperB,bumpScale:.010}),
    title:mat({map:title,bumpMap:paperB,bumpScale:.012}),
    stone:mat({color:'#aaa9a5',map:stone,bumpMap:stoneB,bumpScale:.020}),
    chalk:mat({color:'#e5e4d9',map:stone,bumpMap:stoneB,bumpScale:.022}),
    slate:mat({color:'#a8a7a4',map:stone,bumpMap:stoneB,bumpScale:.018}),
    charcoal:mat({color:'#acb0a9',map:stone,bumpMap:stoneB,bumpScale:.019}),
    ink:mat({color:'#19231f',map:dark,roughness:1,bumpMap:paperB,bumpScale:.003}),
    linen:mat({color:'#d0cfbf',map:fabric,bumpMap:fabricB,bumpScale:.008,sheen:.28,sheenColor:'#dedccf',sheenRoughness:.9}),
    greyLinen:mat({color:'#a2a5a2',map:fabric,bumpMap:fabricB,bumpScale:.010,sheen:.15}),
    red:mat({color:'#b51e2b',map:fabric,bumpMap:fabricB,bumpScale:.002,roughness:.55,sheen:.6,sheenColor:'#ee5146',sheenRoughness:.8}),
    wine:mat({color:'#8a3542',map:fabric,roughness:.7,sheen:.25}),
    scarlet:mat({color:'#dc3532',roughness:.64}),
    cobalt:mat({color:'#343978',map:paper,bumpMap:paperB,bumpScale:.008}),
    violet:mat({color:'#73557e',map:paper,bumpMap:paperB,bumpScale:.006}),
    pink:mat({color:'#bd7b78',map:paper,bumpMap:paperB,bumpScale:.006}),
    ochre:mat({color:'#b6a46b',map:paper,roughness:.98}),
    moss:mat({color:'#6e8270',map:stone,bumpMap:stoneB,bumpScale:.014}),
    jade:mat({color:'#7eaa91',map:paper,roughness:.75,clearcoat:.07}),
    thread:mat({color:'#bbbfb7',roughness:.84,metalness:.16}),
    dry:mat({color:'#8b8373',map:fabric,roughness:1}),
    flower:mat({color:'#c2a697',map:paper,bumpMap:paperB,bumpScale:.003,side:T.DoubleSide}),
    burgundy:mat({color:'#75515c',map:paper,bumpMap:paperB,bumpScale:.003,side:T.DoubleSide}),
    mist:mat({color:'#ffffff',emissive:'#e6e4dd',emissiveIntensity:.20,map:mist,transparent:true,opacity:.80,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,roughness:1}),
    veil:mat({color:'#eeeeda',map:mist,transparent:true,opacity:.29,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,roughness:1})
  };
  for(const [name,material] of Object.entries(m))material.name='The Way I See / '+name;
  return {...m,ready:Promise.resolve(),dispose(){Object.values(m).forEach(v=>v.dispose());maps.forEach(v=>v.dispose());}};
}
