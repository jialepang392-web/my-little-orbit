import { waitForLiveView } from './exhibition-state.js?v=0130';

const canvas=document.querySelector('#jielan-canvas');
const stage=document.querySelector('#jielan-stage');
const status=document.querySelector('#model-status');
const buttons=[...document.querySelectorAll('[data-scene-action]')];
let viewer,turn=false,separated=false,study=false,light=false;
function fail(){canvas.dataset.ready='false';stage.classList.remove('is-ready');stage.setAttribute('aria-busy','false');status.textContent='三维暂未展开，可以继续欣赏高清图版。';buttons.forEach(button=>button.disabled=true);}
function toggle(id,value,on,off){const button=document.querySelector(id);button.setAttribute('aria-pressed',String(value));button.textContent=value?on:off;}
function stopTurn(){turn=false;viewer.setTurn(false);toggle('#rotate-toggle',false,'停止转动','缓慢转动');}
document.addEventListener('orbit:pause',event=>viewer?.suspend(Boolean(event.detail.paused)));
await waitForLiveView(stage);
stage.setAttribute('aria-busy','true');
try{
  let timer;
  const {createJielanViewer}=await Promise.race([
    import('./jielan/viewer.js?v=0190'),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Scene load timeout')),25000);})
  ]).finally(()=>clearTimeout(timer));
  viewer=createJielanViewer(canvas,{onReady(){
    canvas.dataset.ready='true';stage.classList.add('is-ready');stage.setAttribute('aria-busy','false');
    buttons.forEach(button=>button.disabled=false);status.textContent='拖动旋转 · 滚轮缩放 · 方向键亦可调整视角';
  },onError:fail});
  document.querySelector('#rotate-toggle').addEventListener('click',()=>{turn=!turn;viewer.setTurn(turn);toggle('#rotate-toggle',turn,'停止转动','缓慢转动');});
  document.querySelector('#layers-toggle').addEventListener('click',()=>{separated=!separated;viewer.setSeparated(separated?1:0);toggle('#layers-toggle',separated,'合拢材料','展开材料');});
  document.querySelector('#light-toggle').addEventListener('click',()=>{light=!light;viewer.setLight(light);toggle('#light-toggle',light,'恢复暖光','银光观察');});
  document.querySelector('#study-toggle').addEventListener('click',()=>{study=!study;viewer.setStudy(study);toggle('#study-toggle',study,'回到展览','结构观察');});
  document.querySelectorAll('[data-view],[data-detail]').forEach(button=>button.addEventListener('click',()=>{
    stopTurn();if(button.dataset.view)viewer.setView(button.dataset.view);else viewer.setDetail(button.dataset.detail);
    document.querySelectorAll('[data-view],[data-detail]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  }));
  document.querySelector('#capture-image').addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;
    try{const blob=await viewer.capture({background:true});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='jielan-view.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
    catch{status.textContent='视角保存未完成，请重试。';}finally{button.disabled=false;}
  });
  if(new URLSearchParams(location.search).get('build')==='1')window.jielanBuild=viewer;
  viewer.suspend(document.body.dataset.exhibitPaused==='true');
}catch(error){console.warn('Jie Lan:',error.message);fail();}
window.addEventListener('pagehide',event=>{if(event.persisted)viewer?.suspend(true);else viewer?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted)viewer?.suspend(document.body.dataset.exhibitPaused==='true');});
