import {waitForLiveView} from './exhibition-state.js?v=0260';
const stage=document.querySelector('#my-view-stage'),canvas=document.querySelector('#my-view-canvas'),status=document.querySelector('#model-status'),buttons=[...document.querySelectorAll('[data-scene-action]')];
let viewer,turn=false,separated=false,study=false,light=false;
function fail(error){stage.classList.remove('is-ready');stage.setAttribute('aria-busy','false');canvas.dataset.ready='false';status.textContent='三维暂未展开，高清图版与创作说明仍可查看。';buttons.forEach(b=>b.disabled=true);if(error)console.warn('The Way I See:',error.message);}
function toggle(id,value,active,inactive){const b=document.querySelector(id);b.setAttribute('aria-pressed',String(value));b.textContent=value?active:inactive;}
function stopTurn(){turn=false;viewer.setTurn(false);toggle('#rotate-toggle',false,'停止转动','缓慢转动');}
document.addEventListener('orbit:pause',e=>viewer?.suspend(Boolean(e.detail.paused)));
await waitForLiveView(stage);stage.setAttribute('aria-busy','true');
const notice=setTimeout(()=>{if(canvas.dataset.ready!=='true')status.textContent='正在展开纸墨与山河，高清图版可以先看。';},12000);
try{
  const {createMyViewViewer}=await import('./my-view/viewer.js?v=0340');
  viewer=createMyViewViewer(canvas,{onReady(){stage.classList.add('is-ready');stage.setAttribute('aria-busy','false');canvas.dataset.ready='true';buttons.forEach(b=>b.disabled=false);status.textContent='拖动旋转 · 滚轮靠近 · 方向键调整视角';},onError:fail});await viewer.ready;
  document.querySelector('#rotate-toggle').addEventListener('click',()=>{turn=!turn;viewer.setTurn(turn);toggle('#rotate-toggle',turn,'停止转动','缓慢转动');});
  document.querySelector('#layers-toggle').addEventListener('click',()=>{separated=!separated;viewer.setSeparated(separated);toggle('#layers-toggle',separated,'合拢材料','展开材料');});
  document.querySelector('#study-toggle').addEventListener('click',()=>{study=!study;viewer.setStudy(study);toggle('#study-toggle',study,'回到展览','结构观察');});
  document.querySelector('#light-toggle').addEventListener('click',()=>{light=!light;viewer.setLight(light);toggle('#light-toggle',light,'恢复展室光','冷光观察');});
  document.querySelectorAll('button[data-view],button[data-detail]').forEach(b=>b.addEventListener('click',()=>{stopTurn();if(b.dataset.view)viewer.setView(b.dataset.view);else viewer.setDetail(b.dataset.detail);document.querySelectorAll('button[data-view],button[data-detail]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
  document.querySelector('#reset-view').addEventListener('click',()=>{turn=separated=study=light=false;viewer.reset();toggle('#rotate-toggle',false,'停止转动','缓慢转动');toggle('#layers-toggle',false,'合拢材料','展开材料');toggle('#study-toggle',false,'回到展览','结构观察');toggle('#light-toggle',false,'恢复展室光','冷光观察');document.querySelectorAll('button[data-view],button[data-detail]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view==='front')));status.textContent='已复位 · 完整作品';});
  document.querySelector('#capture-image').addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;try{const blob=await viewer.capture(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='the-way-i-see-view.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch{status.textContent='保存未完成，请重试。';}finally{b.disabled=false;}});
  if(new URLSearchParams(location.search).get('build')==='1')window.myViewBuild=viewer;
  viewer.suspend(document.body.dataset.exhibitPaused==='true');
}catch(error){fail(error);}finally{clearTimeout(notice);}
window.addEventListener('pagehide',e=>{if(e.persisted)viewer?.suspend(true);else viewer?.dispose();});window.addEventListener('pageshow',e=>{if(e.persisted)viewer?.suspend(document.body.dataset.exhibitPaused==='true');});
