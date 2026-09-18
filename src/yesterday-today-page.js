import { waitForLiveView } from './exhibition-state.js?v=0123';
const canvas=document.querySelector('#yesterday-canvas'),stage=document.querySelector('#yesterday-stage'),status=document.querySelector('#model-status');
const buttons=[...document.querySelectorAll('[data-scene-action]')];
let viewer=null,turn=false,separated=false,cool=false;
buttons.forEach(b=>b.disabled=true);stage.setAttribute('aria-busy','true');
function fail(){stage.classList.remove('is-ready');stage.setAttribute('aria-busy','false');buttons.forEach(b=>b.disabled=true);status.textContent='三维暂不可用；已保留同一作品的静态封面与细节图。';}
function sync(){for(const [id,value,text,onText] of [['rotate-toggle',turn,'缓慢转动','停止转动'],['layers-toggle',separated,'展开叠层','合拢叠层'],['light-toggle',cool,'珠光冷调','恢复展览光']]){const b=document.getElementById(id);b.setAttribute('aria-pressed',String(value));b.textContent=value?onText:text;}}
document.addEventListener('orbit:pause',e=>viewer?.suspend(Boolean(e.detail.paused)));
await waitForLiveView(stage);
try{
  let timer;
  const {createYesterdayViewer}=await Promise.race([
    import('./yesterday-today/viewer.js?v=0123'),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Viewer loading timed out')),22000);})
  ]).finally(()=>clearTimeout(timer));
  viewer=createYesterdayViewer(canvas,{onReady(){stage.classList.add('is-ready');stage.setAttribute('aria-busy','false');buttons.forEach(b=>b.disabled=false);status.textContent='真实三维 · 拖动旋转，滚轮靠近，方向键查看';},onError:fail});
  document.getElementById('rotate-toggle').addEventListener('click',()=>{turn=!turn;viewer.setTurn(turn);sync();});
  document.getElementById('layers-toggle').addEventListener('click',()=>{separated=!separated;viewer.setSeparated(separated);sync();});
  document.getElementById('light-toggle').addEventListener('click',()=>{cool=!cool;viewer.setLight(cool);sync();});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{turn=false;viewer.setView(b.dataset.view);sync();}));
  document.getElementById('capture-image').addEventListener('click',async e=>{
    const b=e.currentTarget;b.disabled=true;
    try{const blob=await viewer.capture({background:true}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='yesterday-today-view.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
    catch{status.textContent='这次保存未完成，请稍后重试。';}finally{if(stage.classList.contains('is-ready'))b.disabled=false;}
  });
  if(new URLSearchParams(location.search).get('build')==='1')window.yesterdayBuild=viewer;
  viewer.suspend(document.body.dataset.exhibitPaused==='true');
}catch(error){console.warn('Yesterday, Today:',error.message);fail();}
window.addEventListener('pagehide',e=>{if(e.persisted)viewer?.suspend(true);else viewer?.dispose();});
window.addEventListener('pageshow',e=>{if(e.persisted)viewer?.suspend(document.body.dataset.exhibitPaused==='true');});
