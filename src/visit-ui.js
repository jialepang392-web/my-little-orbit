/** Exhibition wayfinding adapted to pointer input and available space.
 * Reference principles: Rijksmuseum artwork/story entry, PhotoSwipe explicit
 * viewing controls, W3C APG focus-returning dialogs. No reference code copied.
 */
import { showExhibitDialog } from './exhibition-dialog.js?v=0150';
const ids=['yesterday-today','crossover','poem','rain-finale'];
const names=['昨天，今天','删了一百遍','思念若是一首诗','雨终曲'];
const world=document.body.dataset.orbitWorld,index=ids.indexOf(world);
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;};
const link=(text,href,cls)=>{const node=make('a',cls,text);node.href=href;return node;};
const action=(text,fn,cls)=>{const node=make('button',cls,text);node.type='button';node.addEventListener('click',fn);return node;};
try{
  if(index>=0&&!new URLSearchParams(location.search).has('build'))sessionStorage.setItem('orbit-last-work',world);
  else if(index<0){
    const previous=sessionStorage.getItem('orbit-last-work'),last=ids.indexOf(previous);
    if(last>=0)document.querySelector('.opening-note')?.append(link('接着看 · '+names[last]+' ↗','./'+previous+'.html?v=0150','visit-resume'));
  }
}catch{/* Private browsing or blocked storage must not block entry. */}

if(index>=0){
  document.body.classList.add('visit-room');
  const picker=document.querySelector('.orbit-picker'),summary=picker?.querySelector('summary');
  let directory;
  function openDirectory(opener){
    if(!directory){
      directory=make('dialog','exhibit-dialog visit-directory');directory.id='visit-directory';
      const heading=make('header','exhibit-dialog-header'),title=make('h2','','四件作品，四种心情');title.id='visit-directory-title';
      directory.setAttribute('aria-labelledby',title.id);
      const close=action('关闭 ×',()=>directory.close(),'exhibit-close');close.setAttribute('aria-label','关闭作品目录');
      heading.append(title,close);
      const note=make('p','visit-directory-note','留下的形状 / 01—04');
      const nav=make('nav','visit-directory-grid');nav.setAttribute('aria-label','选择作品');
      ids.forEach((id,n)=>{
        const a=link('','./'+id+'.html?v=0150','visit-directory-item');
        if(id===world)a.setAttribute('aria-current','page');
        const photo=make('img');photo.src='./assets/exhibition/'+id+'-192.webp?v=0130';photo.alt='';photo.width=192;photo.height=192;photo.decoding='async';
        const text=make('span');text.append(make('small','',String(n+1).padStart(2,'0')+' / '+(id===world?'正在观看':'进入展室')),make('strong','',names[n]));
        a.append(photo,text,make('span','visit-directory-arrow',id===world?'·':'↗'));
        if(id===world)a.addEventListener('click',event=>{event.preventDefault();directory.close();});
        nav.append(a);
      });
      directory.append(heading,note,nav,link('返回纸封套作品集 ↗','./#world-'+world,'visit-directory-home'));document.body.append(directory);
    }
    showExhibitDialog(directory,opener);
  }
  if(summary){
    summary.setAttribute('aria-haspopup','dialog');summary.setAttribute('aria-controls','visit-directory');
    summary.addEventListener('click',event=>{event.preventDefault();picker.open=false;openDirectory(summary);});
  }
  // Sticky local chapters keep long pages navigable, without scroll hijacking.
  const stage=document.querySelector('#yesterday-stage,#concept-stage,#world-stage,#rain-stage');
  const studies=document.querySelector('.time-details,.detail-strip,.garden-details,.rain-details');
  const verso=document.querySelector('.time-verso,.exhibit-verso');
  const chapters=make('nav','visit-chapters');chapters.setAttribute('aria-label','本件作品的章节');
  const sections=[[stage,'作品'],[studies,'近景'],[verso,'侧背面']];
  if(world==='poem')sections.push([document.querySelector('#poem-explore'),'入园']);
  sections.forEach(([node,label],n)=>{
    if(!node)return;if(!node.id)node.id='visit-section-'+n;
    const a=link(label,'#'+node.id);chapters.append(a);
    a.addEventListener('click',()=>{node.tabIndex=-1;requestAnimationFrame(()=>node.focus({preventScroll:true}));});
  });
  document.querySelector('.orbit-wayfinder')?.append(chapters);
  const dock=make('nav','visit-dock');dock.setAttribute('aria-label','手机观看快捷操作');
  const inspect=action('高清放大',()=>document.dispatchEvent(new CustomEvent('orbit:inspect',{detail:{index:0,opener:inspect}})),'visit-dock-primary');
  const catalogue=action('作品目录',()=>openDirectory(catalogue));catalogue.setAttribute('aria-haspopup','dialog');
  dock.append(link('作品集','./#world-'+world),catalogue,inspect,link(index===3?'回到开篇 ↗':'下一件 ↗','./'+ids[(index+1)%4]+'.html?v=0150'));
  document.body.append(dock);
  // Reuse the same scene and viewer. No extra renderer, image carousel library,
  // network prefetch, analytics or automatic tour is started by these controls.
}
