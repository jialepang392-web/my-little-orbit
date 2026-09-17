import { escapeHtml as xml } from './markdown.js';
import { artImage } from './art-paths.js';
import { postcardMiniature } from './illustrations.js';
export function postcardSvg(item, imageData='') {
  const characters=Array.from(item.message),lines=[];
  for(let i=0;i<characters.length;i+=18)lines.push(characters.slice(i,i+18).join(''));
  const safeImage=/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(imageData)?imageData:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs><clipPath id="art"><rect x="48" y="130" width="565" height="542" rx="9"/></clipPath></defs>
<rect width="1200" height="800" fill="#f7edda"/><rect x="23" y="23" width="1154" height="754" rx="9" fill="none" stroke="#b3baa0" stroke-width="2"/>
<text x="52" y="85" fill="#334b42" font-size="22" font-family="serif" letter-spacing="4">思念若是一首诗 / 一页拾藏</text>
<path d="M640 134V672" stroke="#aebb9b" stroke-dasharray="5 8"/>
<g clip-path="url(#art)"><rect x="48" y="130" width="565" height="542" fill="#dfd9be"/>${safeImage?`<image href="${safeImage}" x="-60" y="130" width="780" height="542" preserveAspectRatio="xMidYMid slice"/>`:`<g transform="translate(130 245)">${postcardMiniature(item.id)}</g>`}</g>
<g transform="translate(1080 179) rotate(12)"><circle r="47" fill="none" stroke="#b18559" stroke-width="2" stroke-dasharray="3 5"/><text text-anchor="middle" y="6" fill="#927348" font-family="serif" font-size="23">✦</text></g>
<text x="690" y="260" fill="#7d8a6b" font-size="14" font-family="sans-serif" letter-spacing="3">A LITTLE PLACE TO REMEMBER</text>
<text x="688" y="328" fill="#304f3f" font-size="44" font-family="serif">${xml(item.name)}</text>
${lines.map((line,i)=>`<text x="690" y="${405+i*38}" fill="#687259" font-size="22" font-family="sans-serif">${xml(line)}</text>`).join('')}
<path d="M690 534H1100M690 569H1100" stroke="#d8d1b8"/>
<text x="690" y="626" fill="#97754c" font-size="20" font-family="sans-serif">旅途收藏 · ${xml(item.treasure)}</text>
<text x="53" y="722" fill="#778566" font-size="15" font-family="sans-serif" letter-spacing="3">IF LONGING WERE A POEM / 2026</text>
<text x="1133" y="722" text-anchor="end" fill="#b47c4c" font-family="serif" font-size="21">WORLD 001</text></svg>`;
}
export async function downloadPostcard(item) {
  let image='';const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);
  try{if(!/^[a-z-]+$/.test(item.id))throw new Error('Invalid artwork ID');const response=await fetch(artImage(item.id),{signal:controller.signal});if(!response.ok)throw new Error('Artwork unavailable');const buffer=await response.arrayBuffer();if(buffer.byteLength>2*1024*1024)throw new Error('Artwork exceeds limit');let text='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));image=`data:image/webp;base64,${btoa(text)}`;}catch{/* Export a fully local vector postcard even when its cover is unavailable. */}finally{clearTimeout(timeout);}
  const blob=new Blob([postcardSvg(item,image)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=`orbit-${item.id}-postcard.svg`;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
