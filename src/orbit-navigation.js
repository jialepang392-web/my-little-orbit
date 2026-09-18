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
  // Only reset a restored back/forward page. An initial pageshow may arrive
  // after a visitor opens the menu while large artwork images are still loading.
  window.addEventListener('pageshow',event=>{if(event.persisted)picker.open=false;sync();});
}
// A named gallery anchor restores the visitor to the work they just left.
if(!document.body.dataset.orbitWorld&&location.hash.startsWith('#world-')){
  const target=document.getElementById(location.hash.slice(1));
  if(target){requestAnimationFrame(()=>target.focus({preventScroll:true}));}
}
// The exhibition entry does not animate page departures or alter browser history.
// Make chapter jumps keyboard-readable without coupling them to any renderer.
for(const link of document.querySelectorAll('.collection-route a,.exhibition-entry')){
  link.addEventListener('click',()=>{
    const id=link.getAttribute('href')?.slice(1),target=id&&document.getElementById(id);
    if(target&&!target.matches('a,button')){target.setAttribute('tabindex','-1');requestAnimationFrame(()=>target.focus({preventScroll:true}));}
  });
}
