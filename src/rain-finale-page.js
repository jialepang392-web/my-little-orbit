const canvas=document.querySelector('#rain-canvas'),stage=document.querySelector('#rain-stage'),status=document.querySelector('#model-status');
const buttons=[...document.querySelectorAll('[data-scene-action]')];
let viewer=null,turn=false,rain=false,separated=false,silver=false;
buttons.forEach(b=>b.disabled=true);stage.setAttribute('aria-busy','true');
function fail(){stage.classList.remove('is-ready');stage.setAttribute('aria-busy','false');status.textContent='三维画面暂不可用，已保留同一模型的静态实景。';buttons.forEach(b=>b.disabled=true);}
function toggle(id,value,active,inactive){const b=document.querySelector(id);b.setAttribute('aria-pressed',String(value));b.textContent=value?active:inactive;}
try{
  let timeout;
  const load=Promise.all([import('./rain-finale/viewer.js?v=070'),fetch('./assets/rain-finale/title-glyphs.json').then(r=>{if(!r.ok)throw new Error('Title outlines missing');return r.json();})]);
  const [{createRainViewer},title]=await Promise.race([load,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Scene load timeout')),25000);})]).finally(()=>clearTimeout(timeout));
  viewer=createRainViewer(canvas,{glyphs:title.glyphs,onReady(){stage.classList.add('is-ready');stage.setAttribute('aria-busy','false');buttons.forEach(b=>b.disabled=false);status.textContent='真实三维 / 拖动旋转 · 滚轮缩放 · 方向键亦可';},onError:fail});
  document.querySelector('#rotate-toggle').addEventListener('click',()=>{turn=!turn;viewer.setTurn(turn);toggle('#rotate-toggle',turn,'停止转动','缓慢转动');});
  document.querySelector('#rain-toggle').addEventListener('click',()=>{rain=!rain;viewer.setRain(rain);toggle('#rain-toggle',rain,'让雨停下','让雨落下');});
  document.querySelector('#layers-toggle').addEventListener('click',()=>{separated=!separated;viewer.setSeparated(separated);toggle('#layers-toggle',separated,'合拢叠层','展开叠层');});
  document.querySelector('#light-toggle').addEventListener('click',()=>{silver=!silver;viewer.setLight(silver?'silver':'blue');toggle('#light-toggle',silver,'恢复蓝夜','银光观察');});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{viewer.setView(b.dataset.view);turn=false;toggle('#rotate-toggle',false,'停止转动','缓慢转动');}));
  document.querySelector('#capture-image').addEventListener('click',async e=>{
    const b=e.currentTarget;b.disabled=true;
    try{const blob=await viewer.capture(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rain-finale-view.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
    catch{status.textContent='视角保存未完成，请重试。';}finally{b.disabled=false;}
  });
  if(new URLSearchParams(location.search).get('build')==='1')window.rainBuild=viewer;
}catch(error){console.warn('Rain Finale:',error.message);fail();}
window.addEventListener('pagehide',e=>{if(e.persisted)viewer?.suspend(true);else viewer?.dispose();});
window.addEventListener('pageshow',e=>{if(e.persisted)viewer?.suspend(false);});
