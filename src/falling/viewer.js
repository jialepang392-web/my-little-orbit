import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {makeFalling} from './model.js?v=0280';
import {createRenderPerformance} from '../render-performance.js?v=0260';

const PAPER='#eeece6';
function environment(renderer){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
  const grad=x.createLinearGradient(0,0,0,512);grad.addColorStop(0,'#cecfce');grad.addColorStop(.4,'#777575');grad.addColorStop(.53,'#333139');grad.addColorStop(1,'#a7a29c');x.fillStyle=grad;x.fillRect(0,0,1024,512);
  for(const [a,b,w,h]of [[125,65,140,245],[612,68,215,110],[870,85,70,210]]){const g=x.createRadialGradient(a+w/2,b+h/2,0,a+w/2,b+h/2,w);g.addColorStop(0,'#fffaf0');g.addColorStop(.55,'#eeeae7aa');g.addColorStop(1,'#eeeae700');x.fillStyle=g;x.fillRect(a-w,b-h,w*3,h*3);}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.mapping=T.EquirectangularReflectionMapping;const pm=new T.PMREMGenerator(renderer),env=pm.fromEquirectangular(map);map.dispose();pm.dispose();return env;
}
export function createFallingViewer(canvas,{onReady=()=>{},onError=()=>{}}={}){
  const build=new URLSearchParams(location.search).get('build')==='1',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:build,powerPreference:'low-power'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(PAPER,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,.1,70),world=makeFalling();scene.add(world.root);
  const env=environment(renderer);scene.environment=env.texture;scene.environmentIntensity=.78;
  scene.add(new T.HemisphereLight('#f9f6ed','#747079',.92));
  const key=new T.DirectionalLight('#fff7ed',2.60);key.position.set(-4,6,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.normalBias=.008;key.shadow.bias=-.00012;key.shadow.radius=3;Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:1,far:23});scene.add(key);
  const fill=new T.DirectionalLight('#dce2ed',.70);fill.position.set(4,3,3);scene.add(fill);
  const edge=new T.DirectionalLight('#f8e6da',.34);edge.position.set(-3,-2,-5);scene.add(edge);
  const reverse=new T.DirectionalLight('#e2e7f0',1.15);reverse.position.set(3.5,3.0,-5);scene.add(reverse);
  const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=!reduced;controls.dampingFactor=.11;controls.rotateSpeed=.62;controls.minDistance=build?.65:1.45;controls.maxDistance=35;
  const clay=new T.MeshStandardMaterial({color:'#b6b0a8',roughness:.9,side:T.DoubleSide});
  const abort=new AbortController(),fitCache=new Map();
  let raf=0,disposed=false,lost=false,suspended=false,inView=true,ready=false,turn=false,moment=false,separated=false,amount=0,fitDistance=0,detail=null,view='front',light='studio',frames=0,last=performance.now(),time=0;
  const policy=createRenderPerformance({canvas,renderer,build,maxDpr:1.6,mobileMaxDpr:1.3,buildDpr:2,onChange:()=>{resize();invalidate();}});
  function visible(){return inView||Boolean(canvas.closest('.exhibit-immersive[open]'));}
  function diagnostics(now,force=false){if(!policy.shouldWriteDiagnostics(now,force))return;Object.assign(canvas.dataset,{ready:String(ready),title:'在坠落时',version:'0.28.0',view,detail:detail||'',frames:String(frames),solidCore:'true',bodyRadius:String(world.root.userData.bodyRadius),bodyAxes:'1,1,1',layers:String(world.groups.length),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),modelMeshes:String(world.root.userData.meshCount),modelTriangles:String(world.root.userData.triangleCount),beads:String(world.root.userData.beadCount),petals:String(world.root.userData.petalCount),autoRotate:String(turn),moment:String(moment),separated:String(separated),separation:amount.toFixed(4),camera:camera.position.toArray().map(x=>x.toFixed(4)).join(','),worldRotation:world.root.rotation.y.toFixed(5),study:String(scene.overrideMaterial===clay),light,suspended:String(suspended),visibleSurface:String(visible())});}
  function invalidate(){if(!raf&&!disposed&&!lost&&!suspended&&!document.hidden)raf=requestAnimationFrame(render);}
  function render(now){
    raf=0;if(disposed||lost||suspended||document.hidden)return;const dt=Math.min((now-last)/1000,.08);last=now;time+=dt;
    const animate=visible()&&!reduced;if(turn&&animate)world.root.rotation.y+=dt*.10;
    const goal=+separated,previousAmount=amount;amount=reduced?goal:T.MathUtils.damp(amount,goal,9,dt);if(Math.abs(amount-goal)<.001)amount=goal;
    if(amount!==previousAmount)policy.invalidateShadow();
    world.setSeparated(amount);world.setMoment(moment&&animate?time:0);
    const changed=controls.update();if(changed)policy.noteInteraction();policy.beforeRender(now,changed||turn||moment||amount!==goal);renderer.render(scene,camera);frames++;diagnostics(now,amount!==previousAmount&&amount===goal);
    if((animate&&(turn||moment))||changed||amount!==goal)invalidate();
  }
  function fit(preserve=false){
    if(detail){camera.updateProjectionMatrix();return;}
    const relative=preserve&&fitDistance?camera.position.distanceTo(controls.target)/fitDistance:1;
    const dir=camera.position.clone().sub(controls.target).normalize(),right=new T.Vector3().crossVectors(camera.up,dir).normalize(),up=new T.Vector3().crossVectors(dir,right).normalize(),tan=Math.tan(T.MathUtils.degToRad(camera.fov)/2);
    const k=[camera.aspect,...dir.toArray(),world.root.rotation.y,amount].map(x=>x.toFixed(5)).join('/');let distance=fitCache.get(k);
    if(distance===undefined){distance=0;const p=new T.Vector3();world.root.updateMatrixWorld(true);world.root.traverse(o=>{if(!o.isMesh||!o.visible)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i+=2){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).sub(controls.target);const near=p.dot(dir);distance=Math.max(distance,near+Math.abs(p.dot(up))*1.075/tan,near+Math.abs(p.dot(right))*1.075/(tan*camera.aspect));}});if(fitCache.size>=20)fitCache.clear();fitCache.set(k,distance);}
    fitDistance=Math.max(3,distance);camera.position.copy(controls.target).addScaledVector(dir,fitDistance*relative);camera.updateProjectionMatrix();
  }
  function stop(){const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;turn=false;}
  function setView(name){stop();view=['front','side','back'].includes(name)?name:'front';detail=null;world.root.rotation.set(0,0,0);controls.target.set(0,0,0);const p=view==='front'?[.15,.66,12]:view==='side'?[12,.6,.7]:[-.6,.55,-12];camera.position.set(...p);camera.fov=33;fit();controls.update();policy.invalidateShadow();invalidate();diagnostics(performance.now(),true);}
  function resize(){const b=canvas.getBoundingClientRect();if(!b.width||!b.height)return;const changed=policy.resize(b.width,b.height),aspect=b.width/b.height;const aspectChanged=Math.abs(camera.aspect-aspect)>1e-6;if(!changed&&!aspectChanged)return;camera.aspect=aspect;fit(true);controls.update();invalidate();}
  controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>policy.beginInteraction());controls.addEventListener('end',()=>{policy.endInteraction();invalidate();});
  const ro=new ResizeObserver(resize);ro.observe(canvas);const io=new IntersectionObserver(([e])=>{inView=e.isIntersecting;if(inView)invalidate();});io.observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();invalidate();}},{signal:abort.signal});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))return;e.preventDefault();const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.theta+=(e.code==='ArrowRight'?.12:0)-(e.code==='ArrowLeft'?.12:0);s.phi+=(e.code==='ArrowDown'?.12:0)-(e.code==='ArrowUp'?.12:0);s.makeSafe();camera.position.setFromSpherical(s).add(controls.target);controls.update();invalidate();},{signal:abort.signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;controls.enabled=false;cancelAnimationFrame(raf);raf=0;onError(new Error('WebGL context lost'));},{signal:abort.signal});
  canvas.addEventListener('webglcontextrestored',()=>{if(disposed)return;lost=false;controls.enabled=true;policy.invalidateShadow();onReady();invalidate();},{signal:abort.signal});
  setView('front');resize();policy.beforeRender(performance.now());renderer.render(scene,camera);ready=true;diagnostics(performance.now(),true);onReady();invalidate();
  return {
    ready:Promise.resolve(),
    setView,
    setTurn(value){turn=Boolean(value);last=performance.now();diagnostics(last,true);invalidate();},
    setMoment(value){moment=Boolean(value);last=performance.now();diagnostics(last,true);invalidate();},
    setSeparated(value){separated=Boolean(value);last=performance.now();invalidate();},
    setStudy(value){scene.overrideMaterial=value?clay:null;policy.invalidateShadow();diagnostics(performance.now(),true);invalidate();},
    setLight(value){light=value?'silver':'studio';key.color.set(value?'#e5edff':'#fff7ed');scene.environmentIntensity=value?.94:.78;policy.invalidateShadow();diagnostics(performance.now(),true);invalidate();},
    setDetail(name){stop();detail=Object.hasOwn(world.root.userData.detailTargets,name)?name:'threads';world.root.rotation.set(0,0,0);controls.target.fromArray(world.root.userData.detailTargets[detail]);const offsets={threads:[-.20,.13,2.18],flowers:[-.10,.18,2.05],fault:[.44,.14,2.16]};camera.position.copy(controls.target).add(new T.Vector3(...offsets[detail]));camera.fov=33;camera.updateProjectionMatrix();controls.update();diagnostics(performance.now(),true);invalidate();},
    reset(){moment=false;separated=false;amount=0;world.setSeparated(0);world.setMoment(0);scene.overrideMaterial=null;light='studio';key.color.set('#fff7ed');scene.environmentIntensity=.78;setView('front');},
    suspend(value){suspended=Boolean(value);if(suspended){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();invalidate();}diagnostics(performance.now(),true);},
    stats(){diagnostics(performance.now(),true);return {...canvas.dataset,...world.root.userData};},
    async capture({background=true}={}){if(lost||disposed)throw new Error('Renderer unavailable');policy.invalidateShadow();policy.beforeRender(performance.now());renderer.render(scene,camera);let target=canvas;if(background){target=document.createElement('canvas');target.width=canvas.width;target.height=canvas.height;const x=target.getContext('2d');x.fillStyle=PAPER;x.fillRect(0,0,target.width,target.height);x.drawImage(canvas,0,0);}return new Promise((resolve,reject)=>target.toBlob(b=>b?resolve(b):reject(new Error('Capture failed')),'image/png'));},
    async exportGLB(){const{GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const rot=world.root.rotation.clone();try{world.root.rotation.set(0,0,0);world.setSeparated(0);world.setMoment(0);world.root.updateMatrixWorld(true);return await new GLTFExporter().parseAsync(world.root,{binary:true,onlyVisible:true,maxTextureSize:1024});}finally{world.root.rotation.copy(rot);world.setSeparated(amount);invalidate();}},
    dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);abort.abort();ro.disconnect();io.disconnect();policy.dispose();controls.dispose();world.dispose();clay.dispose();key.shadow.dispose();env.dispose();scene.clear();renderer.dispose();}
  };
}
