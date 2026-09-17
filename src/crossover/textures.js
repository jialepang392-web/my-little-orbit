/** Original press textures for the supplied monochrome-collage art direction.
 * These canvases are typography/material artwork, not a copy of the album cover.
 * All random marks are seeded. No user image, performer credit or font file is loaded.
 */
import * as T from 'three';
import { seededRandom } from '../math.js?v=060';

function canvas(size=1024){const c=document.createElement('canvas');c.width=c.height=size;return c;}
function texture(c){const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}

function paperNoise(c,seed,strength=20){
  const ctx=c.getContext('2d'),random=seededRandom(seed),image=ctx.getImageData(0,0,c.width,c.height),d=image.data;
  for(let i=0;i<d.length;i+=4){const n=(random()-.5)*strength;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}
  ctx.putImageData(image,0,0);
}

function speckles(ctx,seed,count,light=false){
  const random=seededRandom(seed),size=ctx.canvas.width;
  for(let i=0;i<count;i++){
    const x=random()*size,y=random()*size,r=.3+Math.pow(random(),4)*5;
    ctx.globalAlpha=.15+random()*.7;ctx.fillStyle=light?'#e5e3da':'#1b1b1f';
    ctx.fillRect(x,y,r*(.7+random()*2),r);
  }ctx.globalAlpha=1;
}

function column(ctx,text,x,y,size,color,width=1){
  ctx.save();ctx.fillStyle=color;ctx.font=`900 ${size}px "Songti SC", "Noto Serif CJK SC", serif`;ctx.translate(x,y);ctx.scale(width,1);
  [...text].forEach((ch,i)=>ctx.fillText(ch,0,i*size*.90));ctx.restore();
}

function pressSheet(kind,seed){
  const c=canvas(),ctx=c.getContext('2d'),dark=kind==='black',random=seededRandom(seed);
  ctx.fillStyle=dark?'#27262b':'#e2e0d6';ctx.fillRect(0,0,1024,1024);
  if(kind==='news'){
    ctx.fillStyle='#403f40';ctx.font='italic 100px Georgia, serif';ctx.fillText('A HUNDRED',32,123);ctx.font='900 196px Impact, "Arial Narrow", sans-serif';ctx.fillText('TIMES.',22,304);
    for(let row=0;row<31;row++){
      ctx.fillStyle=row%4===0?'#96918b':'#666365';ctx.font=`${row%5===0?24:17}px Georgia,serif`;
      ctx.fillText(row%4===0?'A SMALL RECORD OF EVERYTHING LEFT UNSAID.':'type / sound / paper / repeat / begin again / no. 02',34,365+row*20);
    }
    ctx.save();ctx.translate(822,505);ctx.rotate(Math.PI/2);ctx.font='900 85px Impact,sans-serif';ctx.fillStyle='#323238';ctx.fillText('CROSSOVER',0,0);ctx.restore();
  }else if(kind==='black'){
    column(ctx,'错频',420,390,445,'#515057',1.2);
    ctx.save();ctx.translate(45,475);ctx.rotate(-.12);ctx.scale(.69,1);ctx.fillStyle='#e5e1d8';ctx.font='bold 168px Georgia,serif';ctx.fillText('A Hundred',0,0);ctx.fillText('Times.',175,160);ctx.restore();
    ctx.strokeStyle='#949087';ctx.lineWidth=3;ctx.strokeRect(40,46,944,932);
    ctx.fillStyle='#c6c1b7';ctx.font='24px monospace';ctx.fillText('REPEAT / REASSEMBLE / RETURN',50,952);
  }else if(kind==='type'){
    ctx.fillStyle='#b5b0ae';ctx.fillRect(0,0,1024,1024);
    column(ctx,'重复未完',90,304,337,'#353338',1.0);
    column(ctx,'声音',587,244,321,'#888387',1.25);
    ctx.save();ctx.translate(21,1010);ctx.rotate(-Math.PI/2);ctx.font='80px Impact,sans-serif';ctx.fillStyle='#e2dfd6';ctx.fillText('UNFINISHED / 002',0,0);ctx.restore();
  }else if(kind==='diagram'){
    ctx.fillStyle='#e8e5d9';ctx.fillRect(0,0,1024,1024);ctx.strokeStyle='#b1acaa';ctx.lineWidth=2;
    for(let i=0;i<27;i++){ctx.beginPath();ctx.moveTo(0,i*40);ctx.lineTo(1024,i*40);ctx.stroke();ctx.beginPath();ctx.moveTo(i*40,0);ctx.lineTo(i*40,1024);ctx.stroke();}
    ctx.strokeStyle='#353641';ctx.lineWidth=5;
    for(let circle=0;circle<7;circle++){ctx.beginPath();ctx.arc(520,505,70+circle*43,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#393b49';ctx.font='300px Georgia,serif';ctx.fillText('02',310,610);ctx.font='24px monospace';ctx.fillText('SIGNAL / CROSSOVER / STUDY',170,936);
  }else{
    ctx.fillStyle='#c9c7c1';ctx.fillRect(0,0,1024,1024);
    for(let i=0;i<13;i++){
      ctx.save();ctx.translate(random()*1024,random()*1024);ctx.rotate(random()-.5);
      ctx.fillStyle=i%3===0?'#343438':i%3===1?'#e7e4db':'#8b868b';ctx.fillRect(-180,-250,170+random()*370,90+random()*370);
      ctx.fillStyle=i%3===0?'#d9d6d0':'#4a464c';ctx.font=`900 ${90+random()*230}px Impact,sans-serif`;ctx.fillText(['T','N','R','02','TIME'][i%5],-90,30);ctx.restore();
    }
  }
  if(!dark){
    ctx.save();ctx.globalAlpha=.2;ctx.translate(280,200);ctx.rotate(.18);ctx.fillStyle='#6b80ac';ctx.fillRect(0,0,305,115);ctx.restore();
  }
  speckles(ctx,seed+113,6500,dark);paperNoise(c,seed+400,18);return texture(c);
}

/** Grey/silver ridges use a height field and material lighting, not photo highlights. */
function foil(){
  const c=canvas(),ctx=c.getContext('2d'),image=ctx.createImageData(1024,1024),d=image.data;
  for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){
    const u=x/1024,v=y/1024;
    const warp=Math.sin(u*17+Math.sin(v*12)*2)+Math.cos(v*27+u*8);
    const crease=Math.abs(Math.sin(u*46+v*37+warp*2.2));
    const folds=Math.abs(Math.sin(v*69-u*23+Math.sin(u*21)*2.0));
    const grain=Math.sin(x*12.989+y*78.233)*43758.5453;const noise=grain-Math.floor(grain);
    const a=105+Math.pow(crease,.23)*71+Math.pow(folds,.45)*38+(noise-.5)*24;
    const i=(y*1024+x)*4;d[i]=a;d[i+1]=a;d[i+2]=a+2;d[i+3]=255;
  }ctx.putImageData(image,0,0);speckles(ctx,141,21000,false);return texture(c);
}

function disc(){
  const c=canvas(),ctx=c.getContext('2d');ctx.fillStyle='#d4d1c7';ctx.fillRect(0,0,1024,1024);
  for(let ring=0;ring<6;ring++){
    ctx.strokeStyle=ring%2?'#303036':'#eae7de';ctx.lineWidth=[14,5,3,17,3,3][ring];ctx.beginPath();ctx.arc(512,512,[452,413,385,220,194,54][ring],-.08,Math.PI*2-.35);ctx.stroke();
  }
  ctx.fillStyle='#333238';ctx.beginPath();ctx.arc(512,512,32,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(512,512);ctx.rotate(.15);ctx.fillStyle='#36323b';ctx.font='900 145px "Songti SC", serif';ctx.fillText('错频',-140,310);ctx.font='22px monospace';ctx.fillText('CONCEPT NO. 002',-105,351);ctx.restore();
  ctx.save();ctx.translate(128,341);ctx.rotate(-.11);ctx.scale(.8,1);ctx.fillStyle='#333139';ctx.font='bold 91px Georgia,serif';ctx.fillText('A HUNDRED',0,0);ctx.font='italic 134px Georgia,serif';ctx.fillText('times',20,123);ctx.restore();
  // Offset bars make the label intentionally fragmented like the reference.
  ctx.fillStyle='#4b454d';ctx.fillRect(722,178,90,293);ctx.fillStyle='#d7d1c7';ctx.fillRect(697,232,49,215);
  paperNoise(c,601,15);speckles(ctx,991,2800,false);return texture(c);
}

function alphabet(){
  const c=canvas(),ctx=c.getContext('2d');ctx.fillStyle='#eae8df';ctx.fillRect(0,0,1024,1024);
  const letters=['U','N','D','O','N','E','R','02','F','O','L','D','X','T','I','M'];
  for(let i=0;i<16;i++){
    const x=(i%4)*256,y=Math.floor(i/4)*256;ctx.fillStyle='#28282c';ctx.font='900 80px Impact,"Arial Narrow",sans-serif';ctx.textAlign='center';ctx.fillText(letters[i],x+128,y+151);
    ctx.strokeStyle='#bdbcb4';ctx.lineWidth=1;ctx.strokeRect(x+8,y+8,240,240);
  }ctx.textAlign='left';paperNoise(c,1993,13);return texture(c);
}

export function makePressTextures(){
  return {foil:foil(),disc:disc(),letters:alphabet(),black:pressSheet('black',51),news:pressSheet('news',35),type:pressSheet('type',73),diagram:pressSheet('diagram',102),fragments:pressSheet('fragments',127)};
}
