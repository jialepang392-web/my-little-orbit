/** Original printmaking for Yesterday, Today. No photographs or font assets. */
import * as T from 'three';
import { seededRandom } from '../math.js?v=091';
const canvas=(n=1024)=>{const c=document.createElement('canvas');c.width=c.height=n;return c;};
function texture(c,data=false){const t=new T.CanvasTexture(c);t.colorSpace=data?T.NoColorSpace:T.SRGBColorSpace;t.anisotropy=4;return t;}
function grain(c,seed,amount){const x=c.getContext('2d'),r=seededRandom(seed),im=x.getImageData(0,0,c.width,c.height);for(let i=0;i<im.data.length;i+=4){const v=(r()-.5)*amount;for(let k=0;k<3;k++)im.data[i+k]+=v;}x.putImageData(im,0,0);}

export function makeYesterdayTextures(glyphs={}){
  function lettering(x,word,px,py,size,color){x.save();x.fillStyle=color;x.translate(px,py);x.scale(size/100,-size/100);for(const ch of word){if(glyphs[ch])x.fill(new Path2D(glyphs[ch]),'evenodd');x.translate(ch==='，'?52:112,0);}x.restore();}
  const c=canvas(),x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,1024,1024);g.addColorStop(0,'#eee6dd');g.addColorStop(.65,'#e6c9d7');g.addColorStop(1,'#babbd9');x.fillStyle=g;x.fillRect(0,0,1024,1024);
  x.strokeStyle='#9a7b89';x.lineWidth=1;for(const r of [459,472]){x.beginPath();x.arc(512,512,r,0,Math.PI*2);x.stroke();}
  x.fillStyle='#463343';x.textAlign='center';x.font='italic 79px Georgia,serif';x.fillText('Yesterday,',497,394);x.fillText('Today',520,487);
  x.strokeStyle='#b95870';x.beginPath();x.moveTo(270,548);x.lineTo(754,548);x.stroke();
  lettering(x,'昨天，今天',291,661,88,'#59404f');
  x.font='17px monospace';x.fillText('TWO TIMES / ONE ORBIT',512,757);x.font='13px monospace';x.fillText('MY LITTLE ORBIT',512,828);
  x.fillStyle='#b62b45';x.beginPath();x.arc(717,699,13,0,Math.PI*2);x.fill();grain(c,210,15);
  const label=texture(c);

  function paper(seed,mode=0){
    const c=canvas(),x=c.getContext('2d'),r=seededRandom(seed);
    x.fillStyle=mode===2?'#d5c4d9':'#e8dfd4';x.fillRect(0,0,1024,1024);
    // Original botanical impressions, laid over interrupted horizon plates.
    const sky=x.createLinearGradient(0,130,0,800);sky.addColorStop(0,mode===1?'#a59bbf':'#bdaac2');sky.addColorStop(.52,'#ddd0d9');sky.addColorStop(1,'#8d7d93');x.fillStyle=sky;x.fillRect(48,78,928,777);
    x.save();x.beginPath();x.rect(48,78,928,777);x.clip();
    for(let i=0;i<9;i++){x.fillStyle=i%2?'#4f425d':'#a993b0';x.globalAlpha=.16+r()*.22;x.fillRect(20,460+i*41,990,8+r()*27);}
    function branch(px,py,len,a,depth){if(!depth)return;const qx=px+Math.sin(a)*len,qy=py-Math.cos(a)*len;x.strokeStyle='#463c4c';x.globalAlpha=.52+depth*.065;x.lineWidth=depth*1.9;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px-9,py-len*.48,qx,qy);x.stroke();for(let k=0;k<4;k++){const t=.3+k*.19,lx=px+(qx-px)*t,ly=py+(qy-py)*t;x.save();x.translate(lx,ly);x.rotate(a+(k%2?1:-1)*.7);x.fillStyle='#443449';x.beginPath();x.ellipse(0,-len*.075,len*.034,len*.105,0,0,Math.PI*2);x.fill();x.restore();}branch(qx,qy,len*.66,a-.34-r()*.3,depth-1);branch(qx,qy,len*.69,a+.32+r()*.28,depth-1);}
    branch(285+mode*129,970,258,.08+mode*.14,5);x.restore();x.globalAlpha=1;
    // A small displaced ink pass reads as an imperfect print, not random text.
    x.strokeStyle='#735367';x.lineWidth=mode===2?17:3;x.strokeRect(53,83,918,767);x.fillStyle='#665062';x.textAlign='left';x.font='17px monospace';x.fillText(mode===1?'PRESENT / 02':'MEMORY / 01',54,928);
    x.strokeStyle='#f5e8dc';x.globalAlpha=.16;x.lineWidth=1;for(let yy=84;yy<850;yy+=4){x.beginPath();x.moveTo(54,yy);x.lineTo(972,yy);x.stroke();}x.globalAlpha=1;
    for(let i=0;i<2800;i++){x.fillStyle=i%2?'#f3eadd':'#857a85';x.globalAlpha=.05+r()*.19;x.fillRect(r()*1024,r()*1024,.4+r()*2,.4+r()*2);}x.globalAlpha=1;grain(c,seed+5,25);return texture(c);
  }
  function folds(){const c=canvas(512),x=c.getContext('2d'),im=x.createImageData(512,512),r=seededRandom(62);for(let y=0;y<512;y++)for(let a=0;a<512;a++){const u=a/512,v=y/512;const f=Math.sin(u*51+Math.sin(v*16)*1.2)*.23+Math.sin(u*121-v*85)*.12+Math.sin(u*353+v*117)*.04;const k=(y*512+a)*4;im.data[k]=im.data[k+1]=im.data[k+2]=130+f*110+(r()-.5)*12;im.data[k+3]=255;}x.putImageData(im,0,0);return texture(c,true);}
  function membrane(){const c=canvas(),x=c.getContext('2d'),g=x.createLinearGradient(0,1024,1024,0);g.addColorStop(0,'#8d77ac');g.addColorStop(.3,'#bd9fb8');g.addColorStop(.57,'#ede1de');g.addColorStop(.77,'#a9afd3');g.addColorStop(1,'#d18fa8');x.fillStyle=g;x.fillRect(0,0,1024,1024);grain(c,38,16);return texture(c);}
  function petal(){const c=canvas(512),x=c.getContext('2d'),g=x.createLinearGradient(0,512,0,0);g.addColorStop(0,'#b64972');g.addColorStop(.27,'#dc83a5');g.addColorStop(.72,'#f2c1d0');g.addColorStop(1,'#fff0e3');x.fillStyle=g;x.fillRect(0,0,512,512);x.strokeStyle='#fff2e8';x.lineWidth=.8;for(let i=0;i<45;i++){x.globalAlpha=.12;x.beginPath();x.moveTo(256,530);x.quadraticCurveTo(i*9,255,i*13,-20);x.stroke();}x.globalAlpha=1;grain(c,173,9);return texture(c);}
  const rough=canvas(512),rx=rough.getContext('2d');rx.fillStyle='#e9e9e9';rx.fillRect(0,0,512,512);grain(rough,37,46);
  return {label,membrane:membrane(),folds:folds(),petal:petal(),paperA:paper(231),paperB:paper(913,1),paperC:paper(563,2),paperGrain:texture(rough,true)};
}
