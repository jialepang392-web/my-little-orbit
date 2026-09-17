import { LANDMARKS, landmarkById } from './data.js?v=070';
import { addDiscovery, readProgress, writeProgress } from './storage.js?v=070';
import { escapeHtml, renderMarkdown } from './markdown.js?v=070';
import { downloadPostcard } from './postcard.js?v=070';
import { artImage } from './art-paths.js?v=070';
import { iconSvg } from './illustrations.js?v=070';

const $=(selector)=>document.querySelector(selector);
let storage=null;try{storage=window.localStorage;}catch{/* Private/blocked storage: session-only progress. */}
let progress=readProgress(storage),world=null,reading=false,worldState='idle',nearby=null,contentRequest=null,toastTimer=0,saveWarning=false;
let pendingDestination=null,lastJourney='';
const dialog=$('#content-dialog'),body=$('#dialog-content'),canvas=$('#world-canvas');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function setLabels(value){$('#world-stage').classList.toggle('show-landmarks',value);$('#landmark-labels').inert=!value;$('#landmark-labels').setAttribute('aria-hidden',String(!value));$('#labels-toggle').setAttribute('aria-pressed',String(value));$('#labels-toggle').textContent=value?'收起八景':'显示八景';}
$('#labels-toggle').addEventListener('click',()=>setLabels($('#labels-toggle').getAttribute('aria-pressed')!=='true'));

function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;},4200);}
function pauseWorld(){world?.setPaused(reading||dialog.open||document.hidden);}
function openDialog(title,kicker='EXPLORER’S JOURNAL'){
  contentRequest?.abort();contentRequest=null;$('#dialog-title').textContent=title;$('#dialog-kicker').textContent=kicker;body.replaceChildren();
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;pauseWorld();$('#close-dialog').focus({preventScroll:true});
}
function closeDialog(){
  // Clear the deep link synchronously: the native 'close' event is queued and
  // can lose a race to a reload, reopening the article and pausing the scene.
  if(location.hash.startsWith('#post/'))history.replaceState(null,'',location.pathname+location.search);
  dialog.close();
}
$('#close-dialog').addEventListener('click',closeDialog);
dialog.addEventListener('cancel',(event)=>{event.preventDefault();closeDialog();});
dialog.addEventListener('click',(event)=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog();}});
dialog.addEventListener('close',()=>{if(dialog.open)return;contentRequest?.abort();contentRequest=null;pauseWorld();if(location.hash.startsWith('#post/'))history.replaceState(null,'',location.pathname+location.search);});
document.addEventListener('visibilitychange',pauseWorld);

function renderProgress(){
  const count=progress.visited.length;$('#progress-count').textContent=String(count).padStart(2,'0');$('#progress-fill').style.width=`${count/LANDMARKS.length*100}%`;
  for(const button of document.querySelectorAll('[data-destination]'))button.classList.toggle('visited',progress.visited.includes(button.dataset.destination));
}
function discover(id){
  if(progress.visited.includes(id))return false;
  progress=addDiscovery(progress,id);renderProgress();
  const saved=writeProgress(storage,progress);
  toast(`发现 ${landmarkById(id).name} · 获得「${landmarkById(id).treasure}」${saved?'':'（本次会话有效）'}`);
  if(!saved)saveWarning=true;
  return true;
}
function actionButton(text,handler,style='outline'){
  const button=document.createElement('button');button.className=`button ${style}`;button.textContent=text;button.addEventListener('click',handler);return button;
}
function postcardPanel(item){
  const panel=document.createElement('section');panel.className='postcard';
  panel.innerHTML=`<img class="postcard-art" src="${artImage(item.id)}" width="960" height="720" alt="${escapeHtml(item.name)}的园林场景"><span class="stamp" aria-hidden="true">山水</span><small>POSTCARD NO. ${String(LANDMARKS.indexOf(item)+1).padStart(2,'0')}</small><h3>${escapeHtml(item.treasure)}</h3><p>${escapeHtml(item.message)}</p>`;
  panel.append(actionButton('下载这张明信片 ↓',()=>downloadPostcard(item)));return panel;
}
async function openLocation(id,arrived=false){
  const item=landmarkById(id);if(!item)return;
  // Only world interaction / actual guide arrival awards discovery. Reading never does.
  if(arrived)discover(id);
  openDialog(item.name,`${item.english} / ${arrived?'已抵达地标':'内容预览'}`);
  history.replaceState(null,'',`${location.pathname}${location.search}#post/${item.id}`);
  const cover=document.createElement('div');cover.className='article-cover';const image=document.createElement('img');image.src=artImage(item.id);image.alt=`${item.name} · 原创三维场景`;image.width=960;image.height=720;image.addEventListener('error',()=>cover.remove());cover.append(image);body.append(cover);
  const article=document.createElement('article');article.innerHTML='<p>正在展开这页故事…</p>';body.append(article);
  const actions=document.createElement('div');actions.className='dialog-actions';
  if(!arrived&&!reading&&world)actions.append(actionButton('随纸鹤去这里 ↗',()=>{closeDialog();navigate(id);},'primary'));
  if(!progress.visited.includes(id)){
    const note=document.createElement('p');note.className='note';note.textContent='这是内容预览。到星球上的这个地标走一走，才能解锁收藏和明信片。';body.append(note);
  }else body.append(postcardPanel(item));
  body.append(actions);
  const controller=new AbortController();contentRequest=controller;const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch(`./content/${item.article}`,{signal:controller.signal});if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const markdown=await response.text();if(contentRequest===controller)article.innerHTML=renderMarkdown(markdown);
  }catch(error){if(contentRequest===controller)article.innerHTML='<p>这篇文章暂时未能读取。请检查文件是否存在，关闭后重新打开即可重试。</p>';}
  finally{clearTimeout(timeout);if(contentRequest===controller)contentRequest=null;}
}

function showCollection(){
  openDialog('沿途拾藏。','COLLECTION / 游园拾记');
  const intro=document.createElement('p');intro.textContent=`已发现 ${progress.visited.length} / 8 个地标。${saveWarning?'当前浏览器无法保存进度，本次会话内仍然有效。':'探索进度只保存在这个浏览器，不上传服务器，也不跨设备同步。'}`;body.append(intro);
  const grid=document.createElement('div');grid.className='collection-grid';
  for(const item of LANDMARKS){const unlocked=progress.visited.includes(item.id);const card=document.createElement('div');card.className=`collection-item${unlocked?'':' locked'}`;card.innerHTML=`<img src="${artImage(`treasure-${item.id}`)}" width="960" height="720" alt="${unlocked?escapeHtml(item.treasure):'未解锁的收藏品'}"><strong>${unlocked?escapeHtml(item.treasure):'尚未发现'}</strong><small>${escapeHtml(item.name)}</small>`;if(unlocked)card.append(actionButton('明信片 ↓',()=>downloadPostcard(item)));grid.append(card);}
  body.append(grid);
}
function showGuide(){
  openDialog('随纸鹤，赴一处风景。','A PAPER CRANE / 园中引路');
  const intro=document.createElement('p');intro.textContent='八处风景分布在星球各面。选一处，纸鹤会沿球面带你走过去；途中按 WASD、方向键或触屏方向按钮，即可取消目标、自由行走。';body.append(intro);
  const actions=document.createElement('div');actions.className='dialog-actions';
  for(const item of LANDMARKS)actions.append(actionButton(`${item.icon} ${item.name}`,()=>{closeDialog();navigate(item.id);}));body.append(actions);
}
function showHelp(){
  openDialog('一份游园说明。','HOW TO WANDER / 操作说明');
  body.innerHTML='<p><strong>点一处，走过去：</strong>点击星球表面，旅人会沿球面走到那里。WASD、方向键和场景下方的触屏按钮可以自由移动，也会取消当前目标。</p><p><strong>看看另一面：</strong>拖动转动完整星球，滚轮调整远近；拖动不会触发行走。按「回到起点」恢复位置与视角。</p><p><strong>随纸鹤赴约：</strong>点击「显示八景」或底部地标，纸鹤会沿途引路。走近后按 E 或点击互动提示，可以阅读并收下纪念物。</p><p><strong>坐下读一页：</strong>右上角可进入纯阅读，直接阅读不增加探索收藏。到达地标后，可以下载场景明信片。</p><p><strong>其他星球：</strong>点击页首的「全部星球」返回作品集。每一颗保留独立的美术风格。</p><p class="note">本园林使用实时几何与关节动画。当前尚无复杂碰撞、地形脚部 IK、账号或留言上传。</p>';
}

function setNearby(id){nearby=id;const item=landmarkById(id);$('#nearby-prompt').hidden=!item;if(item)$('#nearby-name').textContent=`探索${item.name}`;for(const button of document.querySelectorAll('[data-destination]'))button.classList.toggle('active',button.dataset.destination===id);}
function interact(){if(!dialog.open&&!reading&&nearby)void openLocation(nearby,true);}
window.addEventListener('keydown',(event)=>{if(event.code==='KeyE'&&!event.repeat&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.target?.closest('input,textarea,select,[contenteditable="true"]'))interact();});
$('#nearby-prompt').addEventListener('click',interact);
function navigate(id){
  setLabels(true);
  if(reading){void openLocation(id);return;}
  if(!world){
    if(worldState==='failed'){toast('3D 场景未就绪，已为你打开文章。');void openLocation(id);}
    else{pendingDestination=id;toast('已记下目的地，场景展开后纸鹤就会带路。');if(worldState==='idle')void bootWorld();}
    return;
  }
  world.navigateTo(id);
  const stage=$('#world-stage'),rect=stage.getBoundingClientRect();
  if(rect.bottom<0||rect.top>innerHeight*.65)stage.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});
}

function setReading(value){
  reading=value;$('#app-shell').classList.toggle('reading',reading);$('#reading-shelf').hidden=!reading;
  const url=new URL(location.href);if(reading){url.searchParams.set('mode','read');pendingDestination=null;}else url.searchParams.delete('mode');
  history.replaceState(null,'',url.pathname+url.search+url.hash);
  $('#reading-toggle').setAttribute('aria-pressed',String(reading));$('#reading-toggle').innerHTML=reading?'返回星球漫游 <span>↗</span>':'纯阅读模式 <span>↗</span>';
  pauseWorld();if(!reading&&worldState==='idle')void bootWorld();
  if(!reading&&worldState==='failed'){$('#scene-status').hidden=false;}
}
async function bootWorld(){
  if(worldState!=='idle')return;worldState='loading';let timeout;
  try{
    const module=await Promise.race([import('./world.js?v=070'),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('3D 依赖下载超时，文章仍可阅读。')),15000);})]);
    world=module.createWorld({canvas,labelLayer:$('#landmark-labels'),reducedMotion,onNearby:setNearby,onNotice:toast,
      onNavigation:updateJourney,
      onArrival:(id)=>{void openLocation(id,true);},
      onError:(message)=>{worldState='failed';world?.dispose();world=null;setNearby(null);toast(message);setReading(true);}
    });
    worldState='ready';$('#scene-status').hidden=true;world.setDusk(document.documentElement.dataset.dusk==='true');
    if(matchMedia('(max-width: 720px)').matches){world.setLowPower(true);$('#quality-toggle').setAttribute('aria-pressed','true');}
    pauseWorld();
    if(pendingDestination&&!reading&&!dialog.open){const id=pendingDestination;pendingDestination=null;navigate(id);}
  }catch(error){worldState='failed';$('#scene-status').classList.add('error');$('#scene-status').textContent=error.message||'3D 场景加载失败，请使用纯阅读模式。';toast('星球场景未能加载，已切换到仍可使用的文章列表。');setReading(true);}
  finally{clearTimeout(timeout);}
}

for(const item of LANDMARKS){
  const button=document.createElement('button');button.className='destination';button.dataset.destination=item.id;button.innerHTML=`<span class="destination-icon">${iconSvg(item.id)}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.english)}</small></span>`;button.addEventListener('click',()=>navigate(item.id));$('#destinations').append(button);
  const card=document.createElement('button');card.className='reading-card';card.innerHTML=`<img class="card-art" src="${artImage(item.id)}" width="960" height="720" alt="" loading="lazy"><span class="card-number">${String(LANDMARKS.indexOf(item)+1).padStart(2,'0')}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.summary)}</p><small>${escapeHtml(item.english)} <span aria-hidden="true">↗</span></small>`;card.addEventListener('click',()=>{void openLocation(item.id);});$('#reading-cards').append(card);
  if(['journal','studio','library'].includes(item.id)){
    const preview=document.createElement('button');preview.className='journal-preview-card';preview.innerHTML=`<span class="journal-category">${escapeHtml(item.english)}</span><h3>${escapeHtml(item.name)} <span aria-hidden="true">↗</span></h3><p>${escapeHtml(item.summary)}</p>`;preview.addEventListener('click',()=>{void openLocation(item.id);});$('#journal-preview-cards').append(preview);
  }
}
for(const button of document.querySelectorAll('[data-open]'))button.addEventListener('click',()=>{void openLocation(button.dataset.open);});
for(const button of document.querySelectorAll('[data-move]')){
  button.addEventListener('pointerdown',(event)=>{event.preventDefault();button.setPointerCapture(event.pointerId);world?.setDirection(button.dataset.move,true);});
  for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,()=>world?.setDirection(button.dataset.move,false));
}
$('#reading-toggle').addEventListener('click',()=>setReading(!reading));
$('#browse-stories').addEventListener('click',()=>{setReading(true);$('#reading-title').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});});
$('#guide-button').addEventListener('click',showGuide);$('#collection-button').addEventListener('click',showCollection);$('#help-button').addEventListener('click',showHelp);
$('#meet-guide').addEventListener('click',showGuide);
$('#theme-toggle').innerHTML=`${iconSvg('moon')} 黄昏`;
$('#theme-toggle').addEventListener('click',()=>{const enabled=$('#theme-toggle').getAttribute('aria-pressed')!=='true';$('#theme-toggle').setAttribute('aria-pressed',String(enabled));$('#theme-toggle').setAttribute('aria-label',enabled?'切换日光光线':'切换黄昏光线');$('#theme-toggle').innerHTML=`${iconSvg(enabled?'sun':'moon')} ${enabled?'日光':'黄昏'}`;document.documentElement.dataset.dusk=String(enabled);world?.setDusk(enabled);});
$('#start-explore').addEventListener('click',()=>{setReading(false);navigate('home');});
$('#reset-view').addEventListener('click',()=>{world?.reset();toast('已回到起点，已获得的收藏不会丢失。');});
$('#quality-toggle').addEventListener('click',()=>{const enabled=$('#quality-toggle').getAttribute('aria-pressed')!=='true';$('#quality-toggle').setAttribute('aria-pressed',String(enabled));world?.setLowPower(enabled);});
function updateJourney(journey){
  $('#journey-status').dataset.state=journey?'travelling':'idle';$('#journey-cancel').disabled=!journey;
  if(!journey){lastJourney='';$('#journey-description').textContent='点一处风景，让旅人走过去。';$('#journey-progress').value=0;return;}
  const key=journey.id??'surface';
  if(key!==lastJourney){lastJourney=key;$('#journey-description').textContent=journey.id?`随纸鹤前往 · ${landmarkById(journey.id).name}`:'正走向你选中的风景';}
  $('#journey-progress').value=journey.completion;
}
$('#journey-cancel').addEventListener('click',()=>{pendingDestination=null;world?.cancelNavigation();updateJourney(null);toast('已停在这里，可以继续散步。');});
// Preserve the live scene when the browser caches this document for Back/Forward.
// Disposing a cached renderer would restore a permanently frozen planet.
window.addEventListener('pagehide',(event)=>{if(event.persisted)world?.setPaused(true);else{world?.dispose();contentRequest?.abort();clearTimeout(toastTimer);}});
window.addEventListener('pageshow',(event)=>{if(event.persisted)pauseWorld();});
function openHash(){const id=location.hash.startsWith('#post/')?location.hash.slice(6):null;if(landmarkById(id))void openLocation(id);}
window.addEventListener('hashchange',openHash);
renderProgress();
if(new URLSearchParams(location.search).get('mode')==='read')setReading(true);else void bootWorld();
openHash();
