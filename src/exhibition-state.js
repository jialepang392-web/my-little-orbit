/** Resolve entry mode once; the UI and lazy scene loader share the same state. */
export function chooseStillView(search,{compactTouch=false,saveData=false}={}){
  const query=new URLSearchParams(search);
  if(query.get('build')==='1'||query.get('view')==='live')return false;
  if(query.get('view')==='still')return true;
  return compactTouch||saveData;
}
export const initialStillView=chooseStillView(location.search,{
  compactTouch:matchMedia('(max-width: 900px) and (pointer: coarse)').matches,
  saveData:Boolean(navigator.connection?.saveData)
});
let liveRequested=!initialStillView;
const pending=new Set();
document.addEventListener('orbit:live',()=>{
  liveRequested=true;
  for(const resolve of pending)resolve();
  pending.clear();
});
export function waitForLiveView(stage){
  // A live request may arrive before the entry module reaches this function.
  if(liveRequested)return Promise.resolve();
  stage.classList.add('scene-still');stage.setAttribute('aria-busy','false');
  const status=document.querySelector('#model-status, #scene-status');
  if(status)status.textContent='高清图版 · 选择「三维互动」转动作品';
  document.body.dataset.exhibitPaused='true';
  return new Promise(resolve=>pending.add(resolve));
}
