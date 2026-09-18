/** Common exhibition tools. Native navigation and images remain usable without JS. */
const world=document.body.dataset.orbitWorld;
const names={'yesterday-today':'昨天，今天',crossover:'删了一百遍',poem:'思念若是一首诗','rain-finale':'雨终曲'};
const stage=document.querySelector('#yesterday-stage,#concept-stage,#world-stage,#rain-stage');
const controls=document.querySelector('.time-controls,.model-controls,.world-controls,.rain-controls');
const edition=(document.querySelector('meta[name="orbit-version"]')?.content||'0.12.0').replaceAll('.','');
if(world==='poem'){
  const target=document.querySelector('.garden-visit-tools');
  if(target)for(const node of document.querySelectorAll('.intro .guide-teaser,.intro .travel-log'))target.append(node);
}
const reasons=new Set();let still=new URLSearchParams(location.search).get('view')==='still';
function pause(reason,value){if(value)reasons.add(reason);else reasons.delete(reason);const paused=reasons.size>0;document.body.dataset.exhibitPaused=String(paused);document.dispatchEvent(new CustomEvent('orbit:pause',{detail:{paused}}));}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
function button(text,fn,cls){const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;}
function modal(kind,title){const d=el('dialog','exhibit-dialog '+kind);const header=el('header','exhibit-dialog-header');const h=el('h2','',title);h.id=kind+'-title';d.setAttribute('aria-labelledby',h.id);const close=button('关闭 ×',()=>d.close(),'exhibit-close');close.setAttribute('aria-label','关闭查看器');header.append(h,close);d.append(header);document.body.append(d);return d;}
let staticButton,immersive,options,saved=[];
function setStill(value){still=value;stage.classList.toggle('scene-still',still);staticButton.setAttribute('aria-pressed',String(still));staticButton.textContent=still?'三维互动':'静态欣赏';pause('still',still);const url=new URL(location.href);if(still)url.searchParams.set('view','still');else{url.searchParams.delete('view');document.dispatchEvent(new Event('orbit:live'));}history.replaceState(null,'',url.pathname+url.search+url.hash);if(!still)stage.querySelector('canvas')?.focus({preventScroll:true});}
if(stage&&controls){
  options=el('div','exhibit-options');options.setAttribute('aria-label','作品查看方式');
  const hint=el('small','',matchMedia('(pointer:coarse)').matches?'左右拖动看另一面 · 上下滑动阅读':'拖动旋转 · 点击下方近景放大');
  staticButton=button('静态欣赏',()=>setStill(!still));staticButton.setAttribute('aria-pressed',String(still));
  const enter=button('沉浸观看 ↗',()=>{
    if(!immersive){immersive=modal('exhibit-immersive',names[world]+' / 拖动查看');const host=el('div','exhibit-scene-host');immersive.append(host);immersive.addEventListener('close',()=>{for(const {node,marker} of saved){marker.replaceWith(node);}saved=[];document.body.classList.remove('exhibit-modal-open');enter.focus({preventScroll:true});});}
    for(const node of [stage,controls]){const marker=document.createComment('exhibition-return');node.before(marker);saved.push({node,marker});}
    immersive.querySelector('.exhibit-scene-host').append(stage);immersive.append(controls);document.body.classList.add('exhibit-modal-open');immersive.showModal();immersive.querySelector('.exhibit-close').focus();
  });options.append(hint,staticButton,enter);controls.before(options);
  if(still)setStill(true);
  const canvas=stage.querySelector('canvas');
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
const items=figures.map(figure=>({figure,img:figure.querySelector('img'),caption:figure.querySelector('figcaption')?.textContent?.trim()||''})).filter(x=>x.img);
let lightbox,current=0,trigger=null;
function displayItem(i){current=(i+items.length)%items.length;const item=items[current];const target=lightbox.querySelector('.exhibit-image-main img');target.src=item.img.dataset.originalSrc||item.img.src;target.alt=item.img.alt;lightbox.querySelector('.exhibit-image-footer p').textContent=`${String(current+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')} — ${item.caption}`;lightbox.querySelector('.exhibit-image-footer a').href=target.src;}
function openItem(i,opener){
  if(!lightbox){lightbox=modal('exhibit-lightbox',names[world]+' / 材料近景');const main=el('div','exhibit-image-main');main.append(el('img'));const footer=el('footer','exhibit-image-footer'),caption=el('p'),link=el('a','','打开原图 ↗'),nav=el('nav');link.target='_blank';link.rel='noopener';nav.setAttribute('aria-label','切换细节');nav.append(button('← 上一张',()=>displayItem(current-1)),button('下一张 →',()=>displayItem(current+1)));footer.append(caption,link,nav);lightbox.append(main,footer);lightbox.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();displayItem(current+(e.key==='ArrowRight'?1:-1));}});lightbox.addEventListener('close',()=>{pause('image',false);document.body.classList.remove('exhibit-modal-open');trigger?.focus({preventScroll:true});});}
  trigger=opener;displayItem(i);pause('image',true);document.body.classList.add('exhibit-modal-open');lightbox.showModal();lightbox.querySelector('.exhibit-close').focus();
}
items.forEach((item,i)=>{const open=button('',()=>openItem(i,open),'detail-open');open.setAttribute('aria-label','放大查看：'+(item.caption||item.img.alt));item.img.before(open);open.append(item.img);});
// Hidden navigation gets genuinely small thumbnails instead of 1600px covers.
for(const image of document.querySelectorAll('.orbit-choice img,.orbit-neighbour img')){
  const link=image.closest('a'),id=link?.dataset.orbitChoice||link?.dataset.orbitNext||link?.dataset.orbitPrev;
  if(names[id]){image.src=`./assets/exhibition/${id}-192.webp?v=${edition}`;image.srcset=`./assets/exhibition/${id}-192.webp?v=${edition} 192w, ./assets/exhibition/${id}-480.webp?v=${edition} 480w`;image.sizes='(max-width:700px) 125px, 155px';image.decoding='async';}
}
window.addEventListener('pageshow',()=>{document.dispatchEvent(new CustomEvent('orbit:pause',{detail:{paused:reasons.size>0}}));});
