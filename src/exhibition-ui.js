/** Common exhibition tools. Native navigation and images remain usable without JS. */
import { initialStillView } from './exhibition-state.js?v=0130';
import { createImageZoom } from './exhibition-zoom.js?v=0130';
import { showExhibitDialog } from './exhibition-dialog.js?v=0150';
const world=document.body.dataset.orbitWorld;
const names={'yesterday-today':'昨天，今天',crossover:'删了一百遍',poem:'思念若是一首诗','rain-finale':'雨终曲',jielan:'芥兰'};
const stage=document.querySelector('#yesterday-stage,#concept-stage,#world-stage,#rain-stage,#jielan-stage');
const controls=document.querySelector('.time-controls,.model-controls,.world-controls,.rain-controls');
const edition=(document.querySelector('meta[name="orbit-version"]')?.content||'0.12.0').replaceAll('.','');
if(world==='poem'){
  const target=document.querySelector('.garden-visit-tools');
  if(target)for(const node of document.querySelectorAll('.intro .guide-teaser,.intro .travel-log'))target.append(node);
}
const reasons=new Set();let still=initialStillView;
document.body.dataset.orbitView=still?'still':'live';
function pause(reason,value){if(value)reasons.add(reason);else reasons.delete(reason);const paused=reasons.size>0;document.body.dataset.exhibitPaused=String(paused);document.dispatchEvent(new CustomEvent('orbit:pause',{detail:{paused}}));}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
function button(text,fn,cls){const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;}
function modal(kind,title){const d=el('dialog','exhibit-dialog '+kind);const header=el('header','exhibit-dialog-header');const h=el('h2','',title);h.id=kind+'-title';d.setAttribute('aria-labelledby',h.id);const close=button('关闭 ×',()=>d.close(),'exhibit-close');close.setAttribute('aria-label','关闭查看器');header.append(h,close);d.append(header);document.body.append(d);return d;}
let staticButton,liveButton,immersive,options,hint,adjustments,loadTimer,saved=[];
const touchInput=matchMedia('(pointer:coarse)');
function updateHint(){
  if(!hint)return;
  clearTimeout(loadTimer);
  const ready=stage.querySelector('canvas')?.dataset.ready==='true';
  hint.textContent=still?(touchInput.matches?'轻触作品放大 · 上下滑动浏览展室':'点击高清放大 · 向下浏览近景与背面'):
    ready?(touchInput.matches?'左右拖动旋转 · 全屏后可双指靠近':'拖动旋转 · 全屏观看可更从容地调整视角'):'正在展开三维作品，高清图版可随时查看…';
  options.dataset.loading=String(!still&&!ready);
  if(!still&&!ready)loadTimer=setTimeout(()=>{hint.textContent='三维加载较慢，可以先切回高清图版欣赏。';},12000);
}
touchInput.addEventListener('change',updateHint);
function setStill(value,{updateURL=true}={}){
  still=value;stage.classList.toggle('scene-still',still);document.body.dataset.orbitView=still?'still':'live';
  staticButton.setAttribute('aria-pressed',String(still));liveButton.setAttribute('aria-pressed',String(!still));
  updateHint();
  pause('still',still);
  if(updateURL){const url=new URL(location.href);url.searchParams.set('view',still?'still':'live');history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
  if(!still){document.dispatchEvent(new Event('orbit:live'));stage.querySelector('canvas')?.focus({preventScroll:true});}
}
if(stage&&controls){
  options=el('div','exhibit-options');options.setAttribute('aria-label','作品查看方式');
  hint=el('small','exhibit-mode-hint');hint.setAttribute('role','status');
  const modes=el('div','exhibit-view-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','选择观看方式');
  staticButton=button('高清图版',()=>setStill(true),'view-still');
  liveButton=button('三维互动',()=>setStill(false),'view-live');
  staticButton.setAttribute('aria-pressed',String(still));liveButton.setAttribute('aria-pressed',String(!still));modes.append(staticButton,liveButton);
  const enter=button('全屏三维 ↗',()=>{
    if(still)setStill(false);
    if(!immersive){immersive=modal('exhibit-immersive',names[world]+' / 拖动查看');const host=el('div','exhibit-scene-host');immersive.append(host);immersive.addEventListener('close',()=>{for(const {node,marker} of saved){marker.replaceWith(node);}saved=[];document.body.classList.remove('exhibit-modal-open');enter.focus({preventScroll:true});});}
    showExhibitDialog(immersive,enter,()=>{
      for(const node of [stage,controls]){const marker=document.createComment('exhibition-return');node.before(marker);saved.push({node,marker});}
      immersive.querySelector('.exhibit-scene-host').append(stage);immersive.append(controls);
    });
  },'exhibit-enter-live');
  const inspect=button('高清放大',()=>openItem(0,inspect),'exhibit-inspect');
  options.append(modes,inspect,enter,hint);controls.before(options);
  adjustments=el('details','exhibit-adjustments');const summary=el('summary','',world==='poem'?'园林操作与视角':'调整视角与画质');
  controls.before(adjustments);adjustments.append(summary,controls);
  updateHint();
  const heroInspect=button('点按放大 · 高清图版',()=>openItem(0,heroInspect),'hero-inspect');
  heroInspect.setAttribute('aria-label','放大查看'+names[world]+'高清完整作品');stage.append(heroInspect);
  if(still)setStill(true,{updateURL:false});
  // Garden navigation may be requested from the art-first section below the
  // photographs. Starting a route must reveal the live scene, not run it hidden.
  document.addEventListener('orbit:explore',()=>{if(still)setStill(false);adjustments.open=true;});
  const canvas=stage.querySelector('canvas');
  if(canvas)new MutationObserver(updateHint).observe(canvas,{attributes:true,attributeFilter:['data-ready']});
  if(world==='poem'&&canvas){const observer=new MutationObserver(()=>{if(canvas.dataset.ready==='true')stage.classList.add('is-ready');});observer.observe(canvas,{attributes:true,attributeFilter:['data-ready']});if(canvas.dataset.ready==='true')stage.classList.add('is-ready');}
  // Actions always return to the real scene, keeping native button state intact.
  controls.addEventListener('click',event=>{if(still&&event.target.closest('button'))setStill(false);},true);
  // Garden rendering correctly sleeps offscreen. A profile/verso command
  // below the artwork must bring that artwork back into view, so its pending
  // camera update is actually visible rather than waiting for a manual scroll.
  controls.addEventListener('click',event=>{
    if(event.target.closest('[data-garden-view],#reset-view')&&!immersive?.open){
      requestAnimationFrame(()=>canvas?.scrollIntoView({block:'center',behavior:'instant'}));
    }
  });
}
const figures=[...document.querySelectorAll('.time-details figure,.time-verso figure,.detail-strip figure,.rain-details figure,.garden-detail-grid figure,.exhibit-verso figure')];
const detailItems=figures.map(figure=>({figure,img:figure.querySelector('img'),caption:figure.querySelector('figcaption')?.textContent?.trim()||''})).filter(x=>x.img);
const front=stage?.querySelector('.time-poster,.concept-poster,.rain-poster,.garden-poster');
const items=front?[{img:front,caption:'完整作品 / '+names[world]},...detailItems]:detailItems;
let lightbox,current=0,trigger=null,imageZoom,loadSerial=0;
function plateLabel(item,index){
  if(index===0&&front)return '全貌';
  const path=item.img.getAttribute('src')||'';
  if(path.includes('poster.'))return '海报';
  if(path.includes('side.'))return '侧面';
  if(path.includes('back.'))return '背面';
  return '近景 '+index;
}
function originalImage(item){
  if(world==='yesterday-today'){
    if(item.img===front)return `./assets/mobile/yesterday-today-front-2048.webp?v=${edition}`;
    const match=item.img.src.match(/detail-(record|conduit|feather)\.webp/);
    if(match)return `./assets/mobile/yesterday-today-${match[1]}-2048.webp?v=${edition}`;
  }
  return item.img.dataset.originalSrc||item.img.src;
}
function displayItem(i){
  current=(i+items.length)%items.length;const item=items[current],target=lightbox.querySelector('.exhibit-image-main img');
  const request=++loadSerial;
  imageZoom.reset();target.src=originalImage(item);target.alt=item.img.alt;
  const status=lightbox.querySelector('.exhibit-image-status');
  status.textContent='正在加载高清图版…';status.hidden=false;
  lightbox.querySelector('.exhibit-image-main').setAttribute('aria-busy','true');
  lightbox.querySelector('.exhibit-image-footer p').textContent=item.caption;
  lightbox.querySelector('.exhibit-plate-counter').textContent=`${String(current+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')} · ${plateLabel(item,current)}`;
  lightbox.querySelector('.exhibit-image-footer a').href=target.src;
  lightbox.querySelectorAll('.exhibit-filmstrip button').forEach((b,index)=>b.setAttribute('aria-pressed',String(index===current)));
  const selected=lightbox.querySelector('.exhibit-filmstrip button[aria-pressed="true"]');
  selected?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  target.decode().then(()=>{if(request!==loadSerial)return;status.hidden=true;lightbox.querySelector('.exhibit-image-main').setAttribute('aria-busy','false');imageZoom.fit();}).catch(()=>{});
}
function openItem(i,opener){
  if(!lightbox){
    lightbox=modal('exhibit-lightbox',names[world]+' / 高清图版');
    const main=el('div','exhibit-image-main'),image=el('img');main.append(image);
    imageZoom=createImageZoom(main,image,{onSwipe:direction=>displayItem(current+direction)});
    const instructions=el('small','exhibit-zoom-hint',touchInput.matches?'双指或双击放大 · 放大后拖动 · 完整图版左右滑动换图':'滚轮或双击放大 · 拖动看细节 · ← → 换图 · Esc 返回');
    const status=el('div','exhibit-image-status');status.setAttribute('role','status');
    const counter=el('span','exhibit-plate-counter');counter.setAttribute('aria-live','polite');
    lightbox.querySelector('.exhibit-dialog-header').append(counter);
    const strip=el('nav','exhibit-filmstrip');strip.setAttribute('aria-label','选择图版');
    items.forEach((item,index)=>{
      const thumb=button('',()=>displayItem(index));thumb.setAttribute('aria-label','查看'+plateLabel(item,index));
      const photo=el('img');photo.src=item.img.currentSrc||item.img.src;photo.alt='';photo.loading='lazy';photo.decoding='async';photo.width=56;photo.height=56;
      thumb.append(photo,el('span','',plateLabel(item,index)));strip.append(thumb);
    });
    const footer=el('footer','exhibit-image-footer'),caption=el('p'),link=el('a','','打开原图 ↗'),nav=el('nav');
    link.target='_blank';link.rel='noopener';nav.setAttribute('aria-label','切换细节');
    nav.append(button('← 上一张',()=>displayItem(current-1)),button('下一张 →',()=>displayItem(current+1)));
    const description=el('details','exhibit-caption');description.append(el('summary','','图版说明'),caption);
    footer.append(description,link,nav);lightbox.append(instructions,main,status,strip,imageZoom.toolbar,footer);
    const previous=button('←',()=>displayItem(current-1),'exhibit-edge-arrow exhibit-edge-prev');previous.setAttribute('aria-label','上一张图版');
    const next=button('→',()=>displayItem(current+1),'exhibit-edge-arrow exhibit-edge-next');next.setAttribute('aria-label','下一张图版');
    lightbox.append(previous,next);
    lightbox.addEventListener('keydown',e=>{imageZoom.key(e);if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();displayItem(current+(e.key==='ArrowRight'?1:-1));}});
    lightbox.addEventListener('close',()=>{imageZoom.reset();pause('image',false);document.body.classList.remove('exhibit-modal-open');trigger?.focus({preventScroll:true});});
    image.addEventListener('error',()=>{
      const fallback=items[current].img.src;
      if(image.src!==fallback){image.src=fallback;link.href=fallback;image.decode().then(()=>{status.hidden=true;main.setAttribute('aria-busy','false');imageZoom.fit();}).catch(()=>{});}
      else{status.replaceChildren(el('span','','这张图暂未加载，请重试或切换另一张。'),button('重新加载',()=>displayItem(current)));main.setAttribute('aria-busy','false');status.hidden=false;}
    });
  }
  showExhibitDialog(lightbox,opener,()=>{trigger=opener;pause('image',true);displayItem(i);});
}
detailItems.forEach((item,i)=>{const open=button('',()=>openItem(i+(front?1:0),open),'detail-open');open.setAttribute('aria-label','放大查看：'+(item.caption||item.img.alt));item.img.before(open);open.append(item.img);});
document.addEventListener('orbit:inspect',event=>openItem(event.detail?.index||0,event.detail?.opener));
// Hidden navigation gets genuinely small thumbnails instead of 1600px covers.
for(const image of document.querySelectorAll('.orbit-choice img,.orbit-neighbour img')){
  const link=image.closest('a'),id=link?.dataset.orbitChoice||link?.dataset.orbitNext||link?.dataset.orbitPrev;
  if(id==='jielan'){image.src='./assets/jielan/cover-768.webp?v=0180';image.decoding='async';}
  else if(names[id]){const artworkEdition=new URL(image.getAttribute('src'),location.href).searchParams.get('v')||edition;image.src=`./assets/exhibition/${id}-192.webp?v=${artworkEdition}`;image.srcset=`./assets/exhibition/${id}-192.webp?v=${artworkEdition} 192w, ./assets/exhibition/${id}-480.webp?v=${artworkEdition} 480w`;image.sizes='(max-width:700px) 125px, 155px';image.decoding='async';}
}
window.addEventListener('pageshow',()=>{document.dispatchEvent(new CustomEvent('orbit:pause',{detail:{paused:reasons.size>0}}));});
