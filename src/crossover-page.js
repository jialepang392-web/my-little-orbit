const canvas=document.querySelector('#crossover-canvas'),status=document.querySelector('#model-status'),stage=document.querySelector('#concept-stage');
let viewer=null,auto=false,separated=false;
function message(text){status.textContent=text;}
function fail(){stage.classList.remove('is-ready');message('三维加载暂不可用；这里保留了同一模型的静态概念图。');for(const b of document.querySelectorAll('[data-scene-action]'))b.disabled=true;}
function save(blob,name){if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
try{
  const {createCrossoverViewer}=await import('./crossover/viewer.js?v=060');
  viewer=createCrossoverViewer(canvas,{onReady(){stage.classList.add('is-ready');message('真实三维 · 拖动旋转 / 滚轮缩放');},onError:fail});
  document.querySelector('#rotate-toggle').addEventListener('click',e=>{auto=!auto;viewer.setTurn(auto);e.currentTarget.setAttribute('aria-pressed',String(auto));e.currentTarget.textContent=auto?'停止转动':'缓慢转动';});
  document.querySelector('#layers-toggle').addEventListener('click',e=>{separated=!separated;viewer.setSeparated(separated);e.currentTarget.setAttribute('aria-pressed',String(separated));e.currentTarget.textContent=separated?'合拢拼贴':'展开层次';});
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{viewer.setView(button.dataset.view);auto=false;document.querySelector('#rotate-toggle').setAttribute('aria-pressed','false');document.querySelector('#rotate-toggle').textContent='缓慢转动';});
  document.querySelector('#capture-image').addEventListener('click',async e=>{
    const button=e.currentTarget;button.disabled=true;
    try{save(await viewer.capture(),'crossover-02-concept.png');}
    catch{message('这次保存未完成，请重试。');}
    finally{button.disabled=false;}
  });
  // Development-time build/export uses the same viewer, not a separate fake scene.
  if(new URLSearchParams(location.search).get('build')==='1')window.conceptBuild=viewer;
}catch(error){console.warn('Concept scene unavailable:',error.message);fail();}
window.addEventListener('pagehide',e=>{if(!e.persisted)viewer?.dispose();else viewer?.setTurn(false);});
