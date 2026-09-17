/** Authored, deterministic print and pearlescent materials. No photo projection. */
import * as T from 'three';
import { seededRandom } from '../math.js?v=070';

const makeCanvas = (n=1024) => {const c=document.createElement('canvas');c.width=c.height=n;return c;};
function tex(c,data=false){const t=new T.CanvasTexture(c);t.colorSpace=data?T.NoColorSpace:T.SRGBColorSpace;t.anisotropy=4;return t;}
function grain(c,seed,amount=8){const x=c.getContext('2d'),r=seededRandom(seed),im=x.getImageData(0,0,c.width,c.height);for(let i=0;i<im.data.length;i+=4){const n=(r()-.5)*amount;for(let k=0;k<3;k++)im.data[i+k]+=n;}x.putImageData(im,0,0);}

export function makeYesterdayTextures(glyphs={}){
  const paths=new Map(Object.entries(glyphs).map(([key,d])=>[key,new Path2D(d)]));
  function letter(ctx,ch,x,y,size,color,squash=1){
    ctx.save();ctx.fillStyle=color;ctx.translate(x,y);
    if(paths.has(ch)){ctx.scale(size/100*squash,-size/100);ctx.fill(paths.get(ch));}
    else{ctx.scale(squash,1);ctx.font=`900 ${size}px "Songti SC",serif`;ctx.fillText(ch,0,0);}
    ctx.restore();
  }
  function label(back=false){
    const c=makeCanvas(),x=c.getContext('2d');
    const fill=x.createLinearGradient(30,70,940,1000);fill.addColorStop(0,'#dddae7');fill.addColorStop(.36,'#ede7df');fill.addColorStop(.7,'#f1ccd2');fill.addColorStop(1,'#dddae5');x.fillStyle=fill;x.fillRect(0,0,1024,1024);
    x.strokeStyle='#a18c9a';x.lineWidth=1.5;for(const radius of [445,463,472]){x.beginPath();x.arc(512,512,radius,0,Math.PI*2);x.stroke();}
    x.fillStyle='#483747';x.textAlign='center';x.font='bold 43px Georgia,serif';x.fillText(back?'The other side':'Yesterday',512,233);
    x.save();x.translate(500,508);x.rotate(-.06);
    letter(x,'昨',-306,15,310,'#453443',.85);letter(x,'天',-41,15,310,'#453443',.82);
    letter(x,'今',-136,246,257,'#806080',.80);letter(x,'天',81,246,257,'#806080',.79);x.restore();
    x.fillStyle='#463144';x.font='italic 45px Georgia,serif';x.fillText(back?'Nothing is lost.':'Today',512,817);
    x.font='15px monospace';x.fillText('Y / T   —   MY LITTLE ORBIT',512,877);
    x.fillStyle='#b94058';x.beginPath();x.arc(710,768,21,0,6.284);x.fill();
    x.strokeStyle='#d67187';x.lineWidth=2;x.beginPath();x.moveTo(291,263);x.lineTo(742,263);x.stroke();
    grain(c,603,9);return tex(c);
  }
  function membrane(){
    const c=makeCanvas(),x=c.getContext('2d'),r=seededRandom(173);const g=x.createLinearGradient(0,920,960,0);
    g.addColorStop(0,'#a4448b');g.addColorStop(.22,'#c77aab');g.addColorStop(.44,'#eed3df');g.addColorStop(.61,'#8e81bd');g.addColorStop(.84,'#de829d');g.addColorStop(1,'#f4c9cc');x.fillStyle=g;x.fillRect(0,0,1024,1024);
    for(let i=0;i<95;i++){x.strokeStyle=i%3?'#f6dfea':'#755bb5';x.globalAlpha=.05+r()*.14;x.lineWidth=.3+r()*3;const y=r()*1024;x.beginPath();x.moveTo(-100,y);x.bezierCurveTo(320,y-210,650,y+170,1120,y-125);x.stroke();}x.globalAlpha=1;grain(c,775,9);return tex(c);
  }
  function folds(){
    const n=512,c=makeCanvas(n),x=c.getContext('2d'),im=x.createImageData(n,n);
    for(let y=0;y<n;y++)for(let xx=0;xx<n;xx++){
      const u=xx/n,v=y/n;
      const a=.32*Math.sin(u*41+Math.sin(v*13)*2)+.12*Math.sin(u*111-v*43)+.055*Math.sin(u*399+v*17);
      const shade=134+a*110;const i=(y*n+xx)*4;im.data[i]=im.data[i+1]=im.data[i+2]=shade;im.data[i+3]=255;
    }x.putImageData(im,0,0);return tex(c,true);
  }
  function petal(){
    const c=makeCanvas(512),x=c.getContext('2d'),r=seededRandom(516);const g=x.createLinearGradient(0,512,0,0);
    g.addColorStop(0,'#b5416b');g.addColorStop(.35,'#e792b1');g.addColorStop(.76,'#f1c3cb');g.addColorStop(1,'#fbe9df');x.fillStyle=g;x.fillRect(0,0,512,512);
    for(let i=0;i<58;i++){x.strokeStyle=i%3?'#fff0e6':'#cb6e96';x.globalAlpha=.09+r()*.15;x.lineWidth=.7;x.beginPath();x.moveTo(250,530);x.quadraticCurveTo(120+r()*290,250,i*9,-10);x.stroke();}x.globalAlpha=1;grain(c,243,5);return tex(c);
  }
  function silk(){const c=makeCanvas(512),x=c.getContext('2d');x.fillStyle='#e8dce6';x.fillRect(0,0,512,512);x.strokeStyle='#fffaf3';x.lineWidth=.7;for(let i=0;i<150;i++){x.globalAlpha=.19+(i%7)*.045;x.beginPath();x.moveTo(i*3.7,-10);x.quadraticCurveTo(i*3.7+30,210,i*3.7-20,522);x.stroke();}grain(c,776,6);return tex(c);}
  return {label:label(),backLabel:label(true),membrane:membrane(),folds:folds(),petal:petal(),silk:silk()};
}
