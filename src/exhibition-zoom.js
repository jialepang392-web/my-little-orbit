/** Dependency-free photograph inspection. Page gestures remain native outside it. */
export function createImageZoom(viewport,image,{onSwipe=()=>{}}={}){
  let scale=1,x=0,y=0,fitW=1,fitH=1,gesture=null,lastTap=null,lastPointerType='mouse';
  const pointers=new Map();
  image.draggable=false;
  const toolbar=document.createElement('div');toolbar.className='exhibit-zoom-tools';
  toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','图版缩放');
  const makeButton=(text,label,action)=>{
    const b=document.createElement('button');b.type='button';b.textContent=text;
    b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;
  };
  const minus=makeButton('−','缩小图版',()=>zoom(scale/1.5));
  const plus=makeButton('＋','放大图版',()=>zoom(scale*1.5));
  const resetButton=makeButton('适应画面','恢复完整图版',()=>reset());
  const value=document.createElement('output');value.setAttribute('aria-label','缩放比例');
  toolbar.append(minus,value,plus,resetButton);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  function paint(){
    const mx=Math.max(0,(fitW*scale-viewport.clientWidth)/2);
    const my=Math.max(0,(fitH*scale-viewport.clientHeight)/2);
    x=clamp(x,-mx,mx);y=clamp(y,-my,my);
    image.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
    viewport.dataset.zoom=scale.toFixed(3);viewport.dataset.pan=`${x.toFixed(1)},${y.toFixed(1)}`;
    viewport.classList.toggle('is-zoomed',scale>1.01);
    value.value=`${Math.round(scale*100)}%`;value.textContent=value.value;
    minus.disabled=scale<=1;plus.disabled=scale>=4;
  }
  function zoom(next,point={x:0,y:0}){
    const old=scale;scale=clamp(next,1,4);const ratio=scale/old;
    x=point.x-(point.x-x)*ratio;y=point.y-(point.y-y)*ratio;paint();
  }
  function reset(){scale=1;x=y=0;pointers.clear();gesture=null;lastTap=null;paint();}
  function fit(){
    if(!image.naturalWidth||!viewport.clientWidth||!viewport.clientHeight)return;
    const ratio=Math.min(viewport.clientWidth/image.naturalWidth,viewport.clientHeight/image.naturalHeight);
    fitW=image.naturalWidth*ratio;fitH=image.naturalHeight*ratio;
    image.style.width=fitW+'px';image.style.height=fitH+'px';paint();
  }
  const relative=e=>{const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2};};
  function start(){
    const pts=[...pointers.values()];if(!pts.length){gesture=null;return;}
    gesture={scale,x,y,points:pts.map(p=>({...p})),time:performance.now(),moved:false,pinch:pts.length>1};
  }
  viewport.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    lastPointerType=e.pointerType;
    pointers.set(e.pointerId,relative(e));viewport.setPointerCapture(e.pointerId);start();
  });
  viewport.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)||!gesture)return;
    pointers.set(e.pointerId,relative(e));const pts=[...pointers.values()],a=gesture.points;
    if(pts.length>1&&a.length>1){
      const dist=p=>Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);
      const mid=p=>({x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2});
      const before=mid(a),now=mid(pts);
      scale=clamp(gesture.scale*dist(pts)/Math.max(1,dist(a)),1,4);
      const ratio=scale/gesture.scale;
      x=now.x-(before.x-gesture.x)*ratio;y=now.y-(before.y-gesture.y)*ratio;
      gesture.moved=true;paint();
    }else{
      const dx=pts[0].x-a[0].x,dy=pts[0].y-a[0].y;
      if(Math.hypot(dx,dy)>8)gesture.moved=true;
      if(scale>1){x=gesture.x+dx;y=gesture.y+dy;paint();}
    }
  });
  function finish(e,cancelled=false){
    if(!pointers.has(e.pointerId))return;
    if(cancelled)lastTap=null;
    const g=gesture,p=relative(e),wasSingle=pointers.size===1;
    pointers.delete(e.pointerId);
    if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);
    if(!cancelled&&g&&wasSingle&&!g.pinch){
      const dx=p.x-g.points[0].x,dy=p.y-g.points[0].y;
      if(scale===1&&Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.6&&performance.now()-g.time<650){
        lastTap=null;onSwipe(dx<0?1:-1);
      }else if(!g.moved&&e.pointerType!=='mouse'){
        const now=performance.now();
        if(lastTap&&now-lastTap.time<320&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<30){
          zoom(scale>1?1:2.5,p);lastTap=null;
        }else lastTap={...p,time:now};
      }
    }
    const wasPinch=g?.pinch;start();if(wasPinch&&gesture)gesture.pinch=true;
  }
  viewport.addEventListener('pointerup',e=>finish(e));
  viewport.addEventListener('pointercancel',e=>finish(e,true));
  viewport.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId)){pointers.delete(e.pointerId);start();}});
  viewport.addEventListener('dblclick',e=>{if(lastPointerType==='mouse'){e.preventDefault();zoom(scale>1?1:2.5,relative(e));}});
  viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(scale*Math.exp(-e.deltaY*.002),relative(e));},{passive:false});
  image.addEventListener('load',()=>{reset();fit();});
  const observer=new ResizeObserver(()=>{reset();fit();});observer.observe(viewport);
  paint();
  return {toolbar,reset,fit,key(e){
    if(e.key==='+'||e.key==='='){e.preventDefault();zoom(scale*1.5);}
    if(e.key==='-'){e.preventDefault();zoom(scale/1.5);}
    if(e.key==='0'){e.preventDefault();reset();}
  }};
}
