import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeCrossover } from './model.js?v=060';

function studioEnvironment(renderer){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d');
  const fill=c.createLinearGradient(0,0,0,512);fill.addColorStop(0,'#e1dfd9');fill.addColorStop(.45,'#8a8790');fill.addColorStop(.51,'#302e32');fill.addColorStop(1,'#65636a');c.fillStyle=fill;c.fillRect(0,0,1024,512);
  for(const [x,y,w,h] of [[110,36,100,207],[560,83,210,118],[900,31,30,248]]){c.fillStyle='#f6f4e9';c.fillRect(x,y,w,h);}
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.mapping=T.EquirectangularReflectionMapping;
  const pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(tex);tex.dispose();pmrem.dispose();return target;
}

export function createCrossoverViewer(canvas,{onReady=()=>{},onError=()=>{}}={}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xe8e6e0,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,80);camera.position.set(.0,.24,17.2);
  const world=makeCrossover();scene.add(world.root);
  const environment=studioEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.72;
  scene.add(new T.HemisphereLight('#f3efe5','#46444b',1.65));
  const key=new T.DirectionalLight('#fff7e8',3.3);key.position.set(-6,8,10);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.camera.near=1;key.shadow.camera.far=30;key.shadow.normalBias=.025;scene.add(key);
  const rim=new T.DirectionalLight('#d6deef',1.15);rim.position.set(6,-1,-4);scene.add(rim);
  const control=new OrbitControls(camera,canvas);control.target.set(0,.15,0);control.enablePan=false;control.enableDamping=!reduced;control.dampingFactor=.09;control.minDistance=10;control.maxDistance=25;control.rotateSpeed=.62;
  let frame=0,disposed=false,turn=false,separated=false,inView=true,renderCount=0,frameTime=performance.now(),lastAngle=0,settle=0;
  const signal=new AbortController();
  function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.fov=camera.aspect<.83?48:38;camera.updateProjectionMatrix();invalidate();}
  function metrics(){canvas.dataset.ready='true';canvas.dataset.frames=String(++renderCount);canvas.dataset.triangles=String(renderer.info.render.triangles);canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.layers=String(world.root.userData.layers);canvas.dataset.autoRotate=String(turn);canvas.dataset.separated=String(separated);canvas.dataset.camera=camera.position.toArray().map(n=>n.toFixed(4)).join(',');}
  function render(now){frame=0;if(disposed||document.hidden)return;const dt=Math.min((now-frameTime)/1000,.1);frameTime=now;
    if(turn){world.root.rotation.y+=dt*.13;lastAngle=world.root.rotation.y;}
    control.update();renderer.render(scene,camera);metrics();
    if((turn&&inView)||settle-->0)invalidate(false);
  }
  function invalidate(restart=false){if(disposed)return;if(restart)settle=30;if(!frame&&!document.hidden){frameTime=performance.now();frame=requestAnimationFrame(render);}}
  control.addEventListener('change',()=>invalidate());control.addEventListener('start',()=>{settle=30;});control.addEventListener('end',()=>{settle=reduced?1:30;invalidate();});
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(canvas);
  const visibility=new IntersectionObserver(([e])=>{inView=e.isIntersecting;if(inView)invalidate();});visibility.observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)invalidate();},{signal:signal.signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onError('三维画面暂时不可用，已保留概念实景图。');},{signal:signal.signal});
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))return;e.preventDefault();
    const spherical=new T.Spherical().setFromVector3(camera.position.clone().sub(control.target));
    if(e.code==='ArrowLeft')spherical.theta-=.14;if(e.code==='ArrowRight')spherical.theta+=.14;
    if(e.code==='ArrowUp')spherical.phi-=.14;if(e.code==='ArrowDown')spherical.phi+=.14;spherical.makeSafe();camera.position.setFromSpherical(spherical).add(control.target);control.update();invalidate();
  },{signal:signal.signal});
  resize();renderer.render(scene,camera);metrics();onReady();
  return {
    setTurn(value){turn=Boolean(value);settle=1;invalidate();},
    setSeparated(value){separated=Boolean(value);world.setSeparated(separated);settle=1;invalidate();},
    setView(kind){world.root.rotation.set(0,0,0);turn=false;control.target.set(0,.15,0);camera.position.set(...(kind==='back'?[0,.24,-17.2]:kind==='side'?[12,2,12]:[0,.24,17.2]));control.update();settle=reduced?1:30;invalidate();},
    async exportGLB(){const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');return await new GLTFExporter().parseAsync(world.root,{binary:true,onlyVisible:true});},
    async capture(){renderer.render(scene,camera);return await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));},
    stats(){return {...canvas.dataset};},
    dispose(){disposed=true;cancelAnimationFrame(frame);signal.abort();sizeObserver.disconnect();visibility.disconnect();control.dispose();world.dispose();environment.dispose();renderer.dispose();}
  };
}
