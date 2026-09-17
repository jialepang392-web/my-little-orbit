import { LANDMARKS, landmarkById } from './data.js';
import { addDiscovery, readProgress, writeProgress } from './storage.js';
import { escapeHtml, renderMarkdown } from './markdown.js';
import { downloadPostcard } from './postcard.js';
import { artImage } from './art-paths.js';
import { iconSvg } from './illustrations.js';

const $=(selector)=>document.querySelector(selector);
let storage=null;try{storage=window.localStorage;}catch{/* Private/blocked storage: session-only progress. */}
let progress=readProgress(storage),world=null,reading=false,worldState='idle',nearby=null,contentRequest=null,toastTimer=0,saveWarning=false;
const dialog=$('#content-dialog'),body=$('#dialog-content'),canvas=$('#world-canvas');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>{$('#toast').hidden=true;},4200);}
function pauseWorld(){world?.setPaused(reading||dialog.open||document.hidden);}
function openDialog(title,kicker='EXPLORER’S JOURNAL'){
  contentRequest?.abort();contentRequest=null;$('#dialog-title').textContent=title;$('#dialog-kicker').textContent=kicker;body.replaceChildren();
  if(!dialog.open)dialog.showModal();pauseWorld();$('#close-dialog').focus({preventScroll:true});
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
dialog.addEventListener('close',()=>{contentRequest?.abort();contentRequest=null;pauseWorld();if(location.hash.startsWith('#post/'))history.replaceState(null,'',location.pathname+location.search);});
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
  panel.innerHTML=`<img class="postcard-art" src="${artImage(item.id)}" width="960" height="720" alt="${escapeHtml(item.name)}的三维手作场景"><span class="stamp" aria-hidden="true">✦</span><small>POSTCARD NO. ${String(LANDMARKS.indexOf(item)+1).padStart(2,'0')}</small><h3>${escapeHtml(item.treasure)}</h3><p>${escapeHtml(item.message)}</p>`;
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
  if(!arrived&&!reading&&world)actions.append(actionButton('让小精灵带我去 ↗',()=>{closeDialog();navigate(id);},'primary'));
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
  openDialog('把沿途的发现，装进口袋。','COLLECTION / 我的旅行收藏');
  const intro=document.createElement('p');intro.textContent=`已发现 ${progress.visited.length} / 8 个地标。${saveWarning?'当前浏览器无法保存进度，本次会话内仍然有效。':'探索进度只保存在这个浏览器，不上传服务器，也不跨设备同步。'}`;body.append(intro);
  const grid=document.createElement('div');grid.className='collection-grid';
  for(const item of LANDMARKS){const unlocked=progress.visited.includes(item.id);const card=document.createElement('div');card.className=`collection-item${unlocked?'':' locked'}`;card.innerHTML=`<img src="${artImage(`treasure-${item.id}`)}" width="960" height="720" alt="${unlocked?escapeHtml(item.treasure):'未解锁的收藏品'}"><strong>${unlocked?escapeHtml(item.treasure):'尚未发现'}</strong><small>${escapeHtml(item.name)}</small>`;if(unlocked)card.append(actionButton('明信片 ↓',()=>downloadPostcard(item)));grid.append(card);}
  body.append(grid);
}
function showGuide(){
  openDialog('今天，想去哪里？','LITTLE GUIDE / 小精灵导航');
  const intro=document.createElement('p');intro.textContent='选一站，我会沿着星球表面带你过去。途中按任意方向键，可以取消带路、自由漫游。';body.append(intro);
  const actions=document.createElement('div');actions.className='dialog-actions';
  for(const item of LANDMARKS)actions.append(actionButton(`${item.icon} ${item.name}`,()=>{closeDialog();navigate(item.id);}));body.append(actions);
}
function showHelp(){
  openDialog('慢慢探索，就很好。','HOW TO WANDER / 操作说明');
  body.innerHTML='<p><strong>移动：</strong>WASD 或方向键；手机使用左下角方向按钮。点画布后再操作，可以避免浏览器抢占键盘。</p><p><strong>视角：</strong>在画布上左右拖动调整方向，上下拖动调整俯视角，滚轮缩放。</p><p><strong>互动：</strong>走近地标，按 E 或点击绿色提示。底部地标按钮和场景标签会让小精灵带路，不是直接瞬移。</p><p><strong>阅读：</strong>右上角可切到纯阅读模式。阅读不会自动获得探索收藏。</p><p><strong>收藏：</strong>到达地标后获得纪念物，并可下载含 Blender 渲染图的 SVG 明信片。进度保存在当前浏览器。</p><p><strong>美术：</strong>右下角可切换日光与黄昏。美术资产室提供 .blend 工程、完整资产包和骨骼动作预览。</p><p class="note">v0.3 Blender 开发版：旅行者采用 16 骨加权蒙皮，支持 Idle / Walk / Wave；小精灵支持 Float。原始造型保留为模型加载失败时的回退。尚无复杂碰撞、账号或留言上传。</p>';
}

function setNearby(id){nearby=id;const item=landmarkById(id);$('#nearby-prompt').hidden=!item;if(item)$('#nearby-name').textContent=`探索${item.name}`;for(const button of document.querySelectorAll('[data-destination]'))button.classList.toggle('active',button.dataset.destination===id);}
function interact(){if(!dialog.open&&!reading&&nearby)void openLocation(nearby,true);}
window.addEventListener('keydown',(event)=>{if(event.code==='KeyE'&&!event.repeat&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.target?.closest('input,textarea,select,[contenteditable="true"]'))interact();});
$('#nearby-prompt').addEventListener('click',interact);
function navigate(id){
  if(reading){void openLocation(id);return;}
  if(!world){toast(worldState==='failed'?'3D 场景未就绪，已为你打开文章。':'小星球正在加载，可以先阅读文章。');void openLocation(id);return;}
  world.navigateTo(id);
}

function setReading(value){
  reading=value;$('#app-shell').classList.toggle('reading',reading);$('#reading-shelf').hidden=!reading;
  $('#reading-toggle').setAttribute('aria-pressed',String(reading));$('#reading-toggle').innerHTML=reading?'返回星球漫游 <span>↗</span>':'纯阅读模式 <span>↗</span>';
  pauseWorld();if(!reading&&worldState==='idle')void bootWorld();
  if(!reading&&worldState==='failed'){$('#scene-status').hidden=false;}
}
async function bootWorld(){
  if(worldState!=='idle')return;worldState='loading';let timeout;
  try{
    const module=await Promise.race([import('./world.js'),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('3D 依赖下载超时，文章仍可阅读。')),15000);})]);
    world=module.createWorld({canvas,labelLayer:$('#landmark-labels'),reducedMotion,onNearby:setNearby,onNotice:toast,
      onArrival:(id)=>{void openLocation(id,true);},
      onError:(message)=>{worldState='failed';world?.dispose();world=null;setNearby(null);toast(message);setReading(true);}
    });
    worldState='ready';$('#scene-status').hidden=true;world.setDusk(document.documentElement.dataset.dusk==='true');
    if(matchMedia('(max-width: 720px)').matches){world.setLowPower(true);$('#quality-toggle').setAttribute('aria-pressed','true');}
    pauseWorld();
  }catch(error){worldState='failed';$('#scene-status').classList.add('error');$('#scene-status').textContent=error.message||'3D 场景加载失败，请使用纯阅读模式。';toast('星球场景未能加载，已切换到仍可使用的文章列表。');setReading(true);}
  finally{clearTimeout(timeout);}
}

for(const item of LANDMARKS){
  const button=document.createElement('button');button.className='destination';button.dataset.destination=item.id;button.innerHTML=`<span class="destination-icon">${iconSvg(item.id)}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.english)}</small></span>`;button.addEventListener('click',()=>navigate(item.id));$('#destinations').append(button);
  const card=document.createElement('button');card.className='reading-card';card.innerHTML=`<img class="card-art" src="${artImage(item.id)}" width="960" height="720" alt="" loading="lazy"><span class="card-number">${String(LANDMARKS.indexOf(item)+1).padStart(2,'0')}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.summary)}</p><small>${escapeHtml(item.english)} <span aria-hidden="true">↗</span></small>`;card.addEventListener('click',()=>{void openLocation(item.id);});$('#reading-cards').append(card);
}
for(const button of document.querySelectorAll('[data-open]'))button.addEventListener('click',()=>{void openLocation(button.dataset.open);});
for(const button of document.querySelectorAll('[data-move]')){
  button.addEventListener('pointerdown',(event)=>{event.preventDefault();button.setPointerCapture(event.pointerId);world?.setDirection(button.dataset.move,true);});
  for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,()=>world?.setDirection(button.dataset.move,false));
}
$('#reading-toggle').addEventListener('click',()=>setReading(!reading));
$('#guide-button').addEventListener('click',showGuide);$('#collection-button').addEventListener('click',showCollection);$('#help-button').addEventListener('click',showHelp);
$('#meet-guide').addEventListener('click',showGuide);
$('#theme-toggle').innerHTML=`${iconSvg('moon')} 黄昏`;
$('#theme-toggle').addEventListener('click',()=>{const enabled=$('#theme-toggle').getAttribute('aria-pressed')!=='true';$('#theme-toggle').setAttribute('aria-pressed',String(enabled));$('#theme-toggle').innerHTML=`${iconSvg(enabled?'sun':'moon')} ${enabled?'日光':'黄昏'}`;document.documentElement.dataset.dusk=String(enabled);world?.setDusk(enabled);});
$('#start-explore').addEventListener('click',()=>{setReading(false);navigate('home');});
$('#reset-view').addEventListener('click',()=>{world?.reset();toast('已回到起点，已获得的收藏不会丢失。');});
$('#quality-toggle').addEventListener('click',()=>{const enabled=$('#quality-toggle').getAttribute('aria-pressed')!=='true';$('#quality-toggle').setAttribute('aria-pressed',String(enabled));world?.setLowPower(enabled);});
window.addEventListener('pagehide',()=>{world?.dispose();contentRequest?.abort();});
function openHash(){const id=location.hash.startsWith('#post/')?location.hash.slice(6):null;if(landmarkById(id))void openLocation(id);}
window.addEventListener('hashchange',openHash);
renderProgress();
if(new URLSearchParams(location.search).get('mode')==='read')setReading(true);else void bootWorld();
openHash();
