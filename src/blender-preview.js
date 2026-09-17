import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { disposeTree } from './assets.js?v=050';

const canvas=document.querySelector('#rig-canvas'),status=document.querySelector('#rig-status');
const renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new T.Scene();scene.background=new T.Color('#eee6d6');
scene.add(new T.HemisphereLight('#fff3dc','#7b8270',2.0));
const key=new T.DirectionalLight('#ffe6c7',2.5);key.position.set(-3,4,-4);scene.add(key);
const fill=new T.DirectionalLight('#dcecff',.8);fill.position.set(3,2,3);scene.add(fill);
const camera=new T.PerspectiveCamera(35,1,.01,50),controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.minDistance=.55;controls.maxDistance=5;
let model=null,mixer=null,helper=null,current=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,controller=null;
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
const observer=new ResizeObserver(resize);observer.observe(canvas);
async function load(id){
  controller?.abort();const request=new AbortController();controller=request;
  status.textContent='正在加载 Blender 模型…';canvas.dataset.ready='false';
  try{
    const response=await fetch(`./assets/models/blender/${id}.glb`,{signal:request.signal});
    if(!response.ok)throw new Error('模型未找到');
    const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
    if(controller!==request){disposeTree(gltf.scene);return;}
    if(helper){scene.remove(helper);helper.dispose();}
    if(model){mixer?.stopAllAction();scene.remove(model);disposeTree(model);}
    model=gltf.scene;scene.add(model);mixer=new T.AnimationMixer(model);current=null;
    const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),height=bounds.max.y-bounds.min.y;
    controls.target.copy(center);camera.position.copy(center).add(new T.Vector3(height*1.6,height*.85,-height*2.8));controls.update();
    helper=new T.SkeletonHelper(model);helper.visible=document.querySelector('#show-skeleton').getAttribute('aria-pressed')==='true';helper.material.depthTest=false;helper.renderOrder=100;scene.add(helper);
    const actions=document.querySelector('#rig-actions');actions.replaceChildren();
    for(const clip of gltf.animations){const button=document.createElement('button');button.textContent=clip.name;button.dataset.action=clip.name;button.setAttribute('aria-pressed','false');button.onclick=()=>play(clip);actions.append(button);}
    function play(clip){const next=mixer.clipAction(clip);current?.fadeOut(.15);next.reset().fadeIn(.15).play();current=next;canvas.dataset.action=clip.name;for(const b of actions.children)b.setAttribute('aria-pressed',String(b.dataset.action===clip.name));}
    play(gltf.animations.find(a=>a.name==='Idle')??gltf.animations[0]);
    let bones=0,skins=0;model.traverse(o=>{if(o.isBone)bones++;if(o.isSkinnedMesh)skins++;});
    document.querySelector('#rig-meta').textContent=`${bones} 根骨骼 · ${skins} 个蒙皮网格 · ${gltf.animations.length} 个动作`;
    document.querySelector('#rig-download').href=`./assets/models/blender/${id}.glb`;
    canvas.dataset.bones=String(bones);canvas.dataset.ready='true';status.textContent='Blender 加权骨骼 · 实时动作预览';
  }catch(error){if(error.name!=='AbortError')status.textContent='预览加载失败：'+error.message;}
}
document.querySelector('#rig-select').onchange=e=>load(e.target.value);
document.querySelector('#show-skeleton').onclick=e=>{const active=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(active));if(helper)helper.visible=active;};
document.querySelector('#pause-animation').onclick=e=>{paused=!paused;e.currentTarget.setAttribute('aria-pressed',String(paused));e.currentTarget.textContent=paused?'继续动画':'暂停动画';};
document.querySelector('#pause-animation').setAttribute('aria-pressed',String(paused));
document.querySelector('#pause-animation').textContent=paused?'继续动画':'暂停动画';
let last=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(!paused)mixer?.update(dt);controls.update();renderer.render(scene,camera);});
window.addEventListener('pagehide',()=>{controller?.abort();renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();if(model)disposeTree(model);helper?.dispose();renderer.dispose();});
void load('traveller');
