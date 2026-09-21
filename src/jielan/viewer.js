import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {makeJielan} from './model.js?v=0180';

function studio(renderer){
  const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#eeeade');g.addColorStop(.46,'#767b72');g.addColorStop(.6,'#393d3c');g.addColorStop(1,'#99958b');x.fillStyle=g;x.fillRect(0,0,512,256);
  for(const [a,b,r] of [[95,55,105],[337,65,94],[475,105,55]]){const soft=x.createRadialGradient(a,b,0,a,b,r);soft.addColorStop(0,'#fff9ec');soft.addColorStop(.45,'#f0eadcc9');soft.addColorStop(1,'#f0eadc00');x.fillStyle=soft;x.fillRect(a-r,b-r,r*2,r*2);}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.mapping=T.EquirectangularReflectionMapping;const pm=new T.PMREMGenerator(renderer),e=pm.fromEquirectangular(t);t.dispose();pm.dispose();return e;
}
export function createJielanViewer(canvas,{onReady=()=>{},onError=()=>{}}={}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,build=new URLSearchParams(location.search).get('build')==='1';
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,build?2:innerWidth<600?1.3:1.65));renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor('#f3f0e7',0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,.1,60),world=makeJielan();scene.add(world.root);
  const env=studio(renderer);scene.environment=env.texture;scene.environmentIntensity=.72;scene.add(new T.HemisphereLight('#f8f1df','#858975',1.4));
  const key=new T.DirectionalLight('#fff4df',1.85);key.position.set(-4,7,8);key.castShadow=true;key.shadow.mapSize.set(build?2048:1024,build?2048:1024);key.shadow.radius=3.5;Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:24});key.shadow.normalBias=.014;key.shadow.bias=-.00012;scene.add(key);
  const fill=new T.DirectionalLight('#e5ebef',1.1);fill.position.set(5,3,-5);scene.add(fill);
  const front=new T.DirectionalLight('#ffeadc',.45);front.position.set(2,-3,6);scene.add(front);
  const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=!reduced;controls.dampingFactor=.1;controls.minDistance=build?1:2;controls.maxDistance=20;controls.rotateSpeed=.6;
  const box=new T.Box3().setFromObject(world.root),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
  const clay=new T.MeshStandardMaterial({color:'#c6c2b4',roughness:.92,side:T.DoubleSide});
  let raf=0,disposed=false,lost=false,suspended=false,turn=false,inView=true,separated=false,amount=0,last=performance.now(),frames=0,settle=0,light='studio',view='front',detail=null;
  const abort=new AbortController();
  function metrics(){Object.assign(canvas.dataset,{ready:'true',title:'芥兰',version:'0.18.0',frames:String(++frames),layers:String(world.groups.length),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),autoRotate:String(turn),separated:String(separated),separation:amount.toFixed(3),light,view,detail:detail||'',camera:camera.position.toArray().map(n=>n.toFixed(4)).join(','),bounds:size.toArray().join(','),leafCount:'11'});}
  function invalidate(){if(!raf&&!disposed&&!lost&&!suspended&&!document.hidden)raf=requestAnimationFrame(render);}
  function render(now){raf=0;if(disposed||lost||suspended||document.hidden)return;const dt=Math.min(Math.max((now-last)/1000,.001),.1);last=now;if(turn&&inView)world.root.rotation.y+=dt*.105;const goal=Number(separated);amount=reduced?goal:T.MathUtils.damp(amount,goal,9,dt);if(Math.abs(amount-goal)<.001)amount=goal;world.setSeparated(amount);controls.update();renderer.render(scene,camera);metrics();if((turn&&inView)||amount!==goal||settle-->0)invalidate();}
  function frame(){if(detail)return;const distance=camera.position.distanceTo(controls.target),height=Math.max(size.y*1.13,(Math.max(size.x,size.z)*1.13)/camera.aspect);camera.fov=T.MathUtils.radToDeg(2*Math.atan(height/(2*distance)));camera.updateProjectionMatrix();}
  function setView(name){view=['front','side','back'].includes(name)?name:'front';detail=null;turn=false;world.root.rotation.set(0,0,0);controls.target.copy(center);const p=view==='back'?[-1.1,.5,-11]:view==='side'?[11,.5,.25]:[.35,.32,11];camera.position.copy(center).add(V(p));frame();controls.update();settle=reduced?0:18;invalidate();}
  function resize(){const b=canvas.getBoundingClientRect();if(!b.width||!b.height)return;renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;frame();invalidate();}
  controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>{settle=20;});controls.addEventListener('end',()=>{settle=20;invalidate();});
  const sizes=new ResizeObserver(resize);sizes.observe(canvas);const visibility=new IntersectionObserver(([e])=>{inView=e.isIntersecting;if(inView)invalidate();});visibility.observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();invalidate();}},{signal:abort.signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;controls.enabled=false;onError(new Error('WebGL context lost'));},{signal:abort.signal});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))return;e.preventDefault();const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.theta+=(e.code==='ArrowRight'?.13:0)-(e.code==='ArrowLeft'?.13:0);s.phi+=(e.code==='ArrowDown'?.13:0)-(e.code==='ArrowUp'?.13:0);s.makeSafe();camera.position.setFromSpherical(s).add(controls.target);controls.update();invalidate();},{signal:abort.signal});
  setView('front');resize();renderer.render(scene,camera);metrics();onReady();
  return {
    setTurn(value){turn=Boolean(value);last=performance.now();invalidate();},
    setSeparated(value){separated=Boolean(value);last=performance.now();invalidate();},
    setLight(cool){light=cool?'cool':'studio';key.color.set(cool?'#e4ecff':'#fff4df');scene.environmentIntensity=cool?.8:.72;invalidate();},
    setView,
    setDetail(name){detail=['leaves','linen','glass'].includes(name)?name:'leaves';turn=false;world.root.rotation.set(0,0,0);const views={leaves:[[-.95,1.24,.15],[-1.2,1.75,4.5]],linen:[[1.1,.74,.05],[3,1.3,4.5]],glass:[[.95,-.65,.6],[2,-.15,3.6]]};const [target,position]=views[detail];controls.target.set(...target);camera.position.set(...position);camera.fov=33;camera.updateProjectionMatrix();controls.update();invalidate();},
    setStudy(value){scene.overrideMaterial=value?clay:null;invalidate();},
    suspend(value){suspended=Boolean(value);if(suspended){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();invalidate();}},
    async capture({background=false}={}){if(lost||disposed)throw new Error('Renderer unavailable');renderer.render(scene,camera);let target=canvas;if(background){target=document.createElement('canvas');target.width=canvas.width;target.height=canvas.height;const ctx=target.getContext('2d');ctx.fillStyle='#f3f0e7';ctx.fillRect(0,0,target.width,target.height);ctx.drawImage(canvas,0,0);}return new Promise((resolve,reject)=>target.toBlob(b=>b?resolve(b):reject(new Error('Capture failed')),'image/png'));},
    async exportGLB(){const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const rotation=world.root.rotation.clone();try{world.root.rotation.set(0,0,0);world.setSeparated(0);world.root.updateMatrixWorld(true);return await new GLTFExporter().parseAsync(world.root,{binary:true,onlyVisible:true,maxTextureSize:512});}finally{world.root.rotation.copy(rotation);world.setSeparated(amount);invalidate();}},
    stats(){return {...canvas.dataset};},
    dispose(){disposed=true;cancelAnimationFrame(raf);abort.abort();sizes.disconnect();visibility.disconnect();controls.dispose();world.dispose();clay.dispose();env.dispose();renderer.dispose();}
  };
}
function V(p){return new T.Vector3(...p);}
