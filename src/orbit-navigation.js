/** Native links/details work without JS; this only adds dismissal and focus care.
 * Page navigation remains browser-native: no SPA, no second WebGL scene, no
 * delayed exit animation or dependency on the 3D CDN.
 */
const picker=document.querySelector('.orbit-picker');
if(picker){
  const summary=picker.querySelector('summary');
  const sync=()=>summary.setAttribute('aria-expanded',String(picker.open));
  sync();picker.addEventListener('toggle',sync);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&picker.open){picker.open=false;summary.focus();}});
  document.addEventListener('pointerdown',event=>{if(picker.open&&!picker.contains(event.target))picker.open=false;});
  picker.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{picker.open=false;}));
  window.addEventListener('pageshow',()=>{picker.open=false;sync();});
}
// A named gallery anchor restores the visitor to the work they just left.
if(!document.body.dataset.orbitWorld&&location.hash.startsWith('#world-')){
  const target=document.getElementById(location.hash.slice(1));
  if(target){requestAnimationFrame(()=>target.focus({preventScroll:true}));}
}
