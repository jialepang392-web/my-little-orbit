/** Native modal focus with Back-to-close, without leaving the artwork.
 * Closings and history traversals settle before another opening is allowed.
 * W3C APG is a behavioral reference; this implementation has no dependency.
 */
let active=null, traversing=null, queued=null, restoring=false, serial=0;
const registered=new WeakSet();
const key='orbitOverlay';
function clearOverlayState(){
  if(!history.state?.[key])return;
  const state={...history.state};delete state[key];history.replaceState(state,'');
}
clearOverlayState();
function restore(cycle){
  restoring=true;
  // Overlay entries must not restore an earlier viewport position. Keep manual
  // restoration until the traversal and native dialog close have both finished.
  scrollTo({left:cycle.x,top:cycle.y,behavior:'instant'});
  if(cycle.opener?.isConnected)cycle.opener.focus({preventScroll:true});
  requestAnimationFrame(()=>{
    if(cycle.restoration)history.scrollRestoration=cycle.restoration;
    restoring=false;
    const next=queued;queued=null;
    if(next)showExhibitDialog(next.dialog,next.opener,next.prepare);
  });
}
window.addEventListener('popstate',()=>{
  if(traversing){
    const finished=traversing;traversing=null;clearOverlayState();restore(finished);
  }else if(active && history.state?.[key]!==active.token){
    active.fromBack=true;active.dialog.close();
  }else if(!active)clearOverlayState();
});
window.addEventListener('pageshow',event=>{
  if(event.persisted&&!active){traversing=null;queued=null;restoring=false;clearOverlayState();}
});
export function showExhibitDialog(dialog,opener,prepare=()=>{}){
  if(dialog.open&&active?.dialog===dialog)return;
  if(active||traversing||restoring){
    queued={dialog,opener,prepare};
    if(active?.dialog.open)active.dialog.close();
    return;
  }
  if(!registered.has(dialog)){
    registered.add(dialog);
    dialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const candidates=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]')]
        .filter(node=>node.tabIndex>=0&&node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden');
      if(!candidates.length){event.preventDefault();return;}
      const first=candidates[0],last=candidates[candidates.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    dialog.addEventListener('close',()=>{
      const cycle=active;
      if(!cycle||cycle.dialog!==dialog)return;
      active=null;
      document.body.classList.toggle('exhibit-modal-open',!!document.querySelector('dialog[open]'));
      if(!cycle.fromBack&&cycle.token&&history.state?.[key]===cycle.token){
        traversing=cycle;history.back();
      }else restore(cycle);
    });
    let outside=false;
    const isOutside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
    dialog.addEventListener('pointerdown',e=>{outside=e.target===dialog&&isOutside(e);});
    dialog.addEventListener('pointerup',e=>{if(outside&&e.target===dialog&&isOutside(e))dialog.close();outside=false;});
    dialog.addEventListener('pointercancel',()=>{outside=false;});
  }
  const cycle={dialog,opener:opener||document.activeElement,x:scrollX,y:scrollY,
    restoration:history.scrollRestoration,fromBack:false,token:Date.now().toString(36)+'-'+(++serial)};
  prepare();
  try{history.scrollRestoration='manual';history.pushState({...history.state,[key]:cycle.token},'');}catch{cycle.token=null;}
  active=cycle;
  document.body.classList.add('exhibit-modal-open');dialog.showModal();
  dialog.querySelector('.exhibit-close')?.focus({preventScroll:true});
}
