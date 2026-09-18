/** Explicit still-view URLs never start a WebGL download until requested. */
export function waitForLiveView(stage){
  if(new URLSearchParams(location.search).get('view')!=='still')return Promise.resolve();
  stage.classList.add('scene-still');stage.setAttribute('aria-busy','false');
  const status=document.querySelector('#model-status, #scene-status');
  if(status)status.textContent='静态欣赏 · 选择「三维互动」展开作品';
  document.body.dataset.exhibitPaused='true';
  return new Promise(resolve=>document.addEventListener('orbit:live',resolve,{once:true}));
}
