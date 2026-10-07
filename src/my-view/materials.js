import * as T from 'three';
import {paintBrush} from './brush.js?v=0370';

export function makeMaterials(){
 const maps=[],atlasMaps=[],materials=[],m={};
 let resolve,reject;const ready=new Promise((a,b)=>{resolve=a;reject=b;});
 function canvas(size){const c=document.createElement('canvas');c.width=c.height=size;return c;}
 function canvasMap(c){const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;maps.push(t);return t;}
 // A fine, pale material atlas preserves tactile detail without coarse dark noise.
 const calmMaps=[];let resolveCalm,rejectCalm;const calmReady=new Promise((a,b)=>{resolveCalm=a;rejectCalm=b;});
 const calmAtlas=new T.TextureLoader().load(new URL('../../assets/my-view/quiet-materials-0360.png',import.meta.url).href,()=>{const s=calmAtlas.image.width/2;for(const {t,i} of calmMaps){const x=t.image.getContext('2d');x.drawImage(calmAtlas.image,(i%2)*s+8,Math.floor(i/2)*s+8,s-16,s-16,0,0,t.image.width,t.image.height);t.needsUpdate=true;}resolveCalm();},undefined,rejectCalm);calmAtlas.colorSpace=T.SRGBColorSpace;maps.push(calmAtlas);
 function calmTile(i,bump=false){const t=new T.CanvasTexture(canvas(624));t.colorSpace=bump?T.NoColorSpace:T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;calmMaps.push({t,i});maps.push(t);return t;}
 function calmMat(name,i,color,roughness=.96){const mat=new T.MeshPhysicalMaterial({color,map:calmTile(i),bumpMap:calmTile(i,true),bumpScale:.0035,roughness,side:T.DoubleSide,sheen:i===1||i===3?.18:0});mat.name=name;m[name]=mat;materials.push(mat);return mat;}
 calmMat('vellum',0,'#f2eee3');calmMat('porcelain',2,'#d4d9d4');calmMat('silk',3,'#e0e2dc');calmMat('graphite',2,'#626966');
 const titleCanvas=canvas(1024),titleMap=canvasMap(titleCanvas);
 const atlas=new T.TextureLoader().load(new URL('../../assets/my-view/reference-materials-0350.png',import.meta.url).href,()=>{
   for(const t of atlasMaps){t.image=atlas.image;t.needsUpdate=true;}
   const x=titleCanvas.getContext('2d'),s=atlas.image.width/4;x.drawImage(atlas.image,0,0,s,s,0,0,1024,1024);
   const ink=canvas(1024),ix=ink.getContext('2d');paintBrush(ix,'之',135,35,645,427,'#40483ac4');paintBrush(ix,'见',216,419,641,545,'#353d37d9');
   x.save();x.translate(512,512);x.rotate(-.065);x.drawImage(ink,-512,-512);x.restore();
   x.strokeStyle='#34372d44';x.lineWidth=3;for(let i=0;i<13;i++){x.beginPath();x.moveTo(78+i*13,187+i*27);x.lineTo(86+i*12,295+i*24);x.stroke();}
   titleMap.needsUpdate=true;resolve();
 },undefined,reject);atlas.colorSpace=T.SRGBColorSpace;maps.push(atlas);
 function tile(i,bump=false){const t=atlas.clone();t.offset.set((i%4)/4,(3-Math.floor(i/4))/4);t.repeat.set(.25,.25);t.colorSpace=bump?T.NoColorSpace:T.SRGBColorSpace;t.anisotropy=8;atlasMaps.push(t);maps.push(t);return t;}
 function mat(name,i,colour,options={}){const v=new T.MeshPhysicalMaterial({color:colour,map:tile(i),bumpMap:tile(i,true),bumpScale:.007,roughness:.94,side:T.DoubleSide,...options});v.name=name;m[name]=v;materials.push(v);return v;}
 mat('paper',0,'#d5d2cd');mat('pale',0,'#f1eeea');calmMat('greyPaper',0,'#dbddd7');mat('inkPaper',12,'#d7d7d1');
 m.title=new T.MeshPhysicalMaterial({color:'#c4c7c0',map:titleMap,roughness:.97,side:T.DoubleSide,bumpMap:tile(0,true),bumpScale:.005});m.title.name='original written paper';materials.push(m.title);
 mat('stone',2,'#efede6',{bumpScale:.011});mat('chalk',14,'#d4d7ce',{bumpScale:.008});mat('slate',5,'#c6cbc6',{bumpScale:.012});mat('charcoal',1,'#a9ada9');mat('ink',1,'#202521');
 calmMat('linen',1,'#daddd8');calmMat('greyLinen',3,'#c0c8c1');mat('foil',4,'#d5d9d7',{metalness:.32,roughness:.78});mat('leafPaper',6,'#cbd4c5');mat('printed',13,'#d1cad1');
 m.cord=new T.MeshPhysicalMaterial({color:'#ba332e',roughness:.57,sheen:.25});m.cord.name='red silk core';materials.push(m.cord);
 mat('red',10,'#ff6254',{roughness:.57,sheen:.42});mat('wine',10,'#a33a46',{roughness:.7});mat('scarlet',10,'#e45748');
 mat('cobalt',8,'#9194d5');mat('violet',8,'#b8a3c5');mat('pink',9,'#d6a3a0');mat('ochre',11,'#cbb799');mat('moss',6,'#869a85');mat('jade',6,'#84aaa0');
 for(const [n,c] of [['thread','#aeb5b0'],['darkThread','#606964']]){m[n]=new T.MeshStandardMaterial({color:c,roughness:.86,metalness:.17});m[n].name=n;materials.push(m[n]);}
 mat('dry',11,'#8e8279');calmMat('flower',0,'#eed2be');calmMat('burgundy',0,'#b57788');
 calmMat('reed',1,'#bcac91');calmMat('paleReed',0,'#d6c8ac');
 const tissue=calmMat('tissue',3,'#f1f0e9');Object.assign(tissue,{transparent:true,opacity:.61,depthWrite:false,forceSinglePass:true});
 for(const [name,color,roughness,metalness] of [['silver','#bfc9c7',.46,.55],['wire','#737e7b',.65,.35]]){const v=new T.MeshStandardMaterial({color,roughness,metalness});v.name=name;m[name]=v;materials.push(v);}
 for(const letter of ['以','我','之','见']){const c=canvas(1024);paintBrush(c.getContext('2d'),letter,0,0,1024,1024,'#151b18');const v=new T.MeshBasicMaterial({map:canvasMap(c),alphaTest:.04,transparent:true,depthWrite:false,side:T.FrontSide});v.name='original brush '+letter;materials.push(v);m['glyph'+letter]=v;}
 const fog=canvas(512),cx=fog.getContext('2d'),im=cx.createImageData(512,512);
 const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 function noise(x,y){const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b),hash(a+1,b),s),T.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),s),t);}
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const u=x/511,v=y/511,n=noise(u*5+9,v*5+7)*.62+noise(u*13,v*13)*.27+noise(u*38,v*38)*.11,edge=Math.pow(Math.sin(Math.PI*u)*Math.sin(Math.PI*v),1.5),a=Math.max(0,Math.min(1,(n-.18)*2.6))*edge,i=(y*512+x)*4;im.data[i]=248;im.data[i+1]=245;im.data[i+2]=239;im.data[i+3]=255*a;}
 cx.putImageData(im,0,0);const fogMap=canvasMap(fog);
 for(const [n,c,a] of [['mist','#f3f2ed',.95],['veil','#dce0da',.44],['warmMist','#eed2c5',.46]]){m[n]=new T.MeshBasicMaterial({map:fogMap,color:c,opacity:a,transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true});m[n].name=n;materials.push(m[n]);}
 return {...m,ready:Promise.all([ready,calmReady]),dispose(){materials.forEach(x=>x.dispose());maps.forEach(x=>x.dispose());}};
}
