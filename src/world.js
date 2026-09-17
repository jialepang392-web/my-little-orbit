import * as T from 'three';
import { LANDMARKS, landmarkById } from './data.js';
import { fromLatLon, seededRandom, clamp } from './math.js';
import { Stars } from './vendor/stars.js';
import { makeArtAvatar as makeAvatar, makeArtGuide as makeGuide, makeArtLandmark as makeLandmark, part as mesh } from './art-models.js';
import { makeLandscape, surfaceRadius, placeSurface } from './landscape.js';
import { AssetSlots, disposeTree } from './assets.js';

const R=5.4,UP=new T.Vector3(0,1,0);
const initialNormal=new T.Vector3(...fromLatLon(38,90));
function placeOnSurface(object,normal,height=R){object.position.copy(normal).multiplyScalar(height);object.quaternion.setFromUnitVectors(UP,normal);}
export function createWorld({canvas,labelLayer,onNearby=()=>{},onArrival=()=>{},onError=()=>{},onNotice=()=>{},reducedMotion=false}) {
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}
  catch(error){throw new Error('此浏览器无法启动 WebGL2。纯阅读模式仍可使用。',{cause:error});}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setClearColor(0xf3f1e9,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,1,.1,180);
  const hemisphere=new T.HemisphereLight('#fff4df','#65796b',1.65);scene.add(hemisphere);
  const sun=new T.DirectionalLight('#fff0d5',2.7);sun.position.set(-8,14,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;sun.shadow.normalBias=.035;
  scene.add(sun,new T.AmbientLight('#ffffff',.2));
  const random=seededRandom(9162026);
  const stars=new Stars({particleCount:180,minimumDistance:13,maximumDistance:36,size:.045,seed:916});stars.visible=false;scene.add(stars);
  const normals=new Map(LANDMARKS.map((item)=>[item.id,new T.Vector3(...fromLatLon(item.lat,item.lon))]));
  const landscape=makeLandscape(normals);scene.add(landscape.root);
  let dusk=false;
  const landmarks=[],labels=[],slots={};
  for(const item of LANDMARKS){
    const model=makeLandmark(item),normal=normals.get(item.id);placeSurface(model.root,normal);scene.add(model.root);
    landmarks.push({...model,item,normal});slots[item.id]={parent:model.root,placeholder:model.building,placeholders:[...model.root.children]};
    const label=document.createElement('button');label.className='landmark-label';label.textContent=item.name;label.dataset.landmark=item.id;label.setAttribute('aria-label',`前往${item.name}`);
    labelLayer.append(label);labels.push({element:label,normal,point:normal.clone().multiplyScalar(R+1.05),id:item.id});
  }
  const clouds=new T.Group();scene.add(clouds);
  for(let i=0;i<7;i++){
    const n=new T.Vector3(...fromLatLon(-45+i*16,i*53));const cloud=new T.Group();
    for(let j=0;j<4;j++){const puff=mesh(new T.IcosahedronGeometry(.29,2),'#faf5e7',[(j-1.5)*.27,.04+(j%2)*.08,0]);puff.scale.set(1.1,.52,.85);puff.castShadow=false;cloud.add(puff);}
    placeOnSurface(cloud,n,R+1.5+random()*.4);clouds.add(cloud);
  }
  const avatar=makeAvatar();scene.add(avatar.root);slots.avatar={parent:avatar.visual,placeholder:avatar.body};
  const guide=makeGuide();scene.add(guide.root);slots.guide={parent:guide.root,placeholder:guide.visual};
  const residents=[];
  for(const [i,id] of ['journal','lab','observatory','camp'].entries()){const pet=makeGuide(['petal','ember','droplet','sprout'][i]);const petN=normals.get(id).clone().add(new T.Vector3(.045,0,.035)).normalize();placeSurface(pet.root,petN,.26);pet.root.rotateY(Math.PI);pet.root.scale.setScalar(.8);scene.add(pet.root);slots[`resident-${id}`]={parent:pet.root,placeholder:pet.visual};residents.push({pet,base:pet.root.position.clone(),normal:petN});}
  const assets=new AssetSlots(onNotice);void assets.load(slots).then(()=>{canvas.dataset.assetsLoaded=String(assets.entries.length);canvas.dataset.assetFailures=assets.failures.join(',');});
  let normal=initialNormal.clone(),forward=UP.clone().addScaledVector(normal,-UP.dot(normal)).normalize();
  let target=null,nearbyId=null,paused=false,disposed=false,frame=0,lastTime=performance.now(),elapsed=0,zoom=1,elevation=R+9.7,width=1,height=1,hasCamera=false;
  const input={up:false,down:false,left:false,right:false};
  const abort=new AbortController(),signal=abort.signal;
  const right=new T.Vector3(),movement=new T.Vector3(),axis=new T.Vector3(),rotation=new T.Quaternion(),basis=new T.Matrix4(),cameraPosition=new T.Vector3(),lookTarget=new T.Vector3(),projected=new T.Vector3(),guideN=new T.Vector3();
  let drag=null;
  const on=(element,type,handler,options={})=>element.addEventListener(type,handler,{...options,signal});
  const clearInput=()=>{for(const key of Object.keys(input))input[key]=false;drag=null;};
  const keyMap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  on(window,'keydown',(event)=>{
    if(paused||event.altKey||event.ctrlKey||event.metaKey||event.target?.closest('input,textarea,select,[contenteditable="true"]'))return;
    const key=keyMap[event.code];if(key){event.preventDefault();input[key]=true;target=null;}
  });
  on(window,'keyup',(event)=>{const key=keyMap[event.code];if(key)input[key]=false;});
  on(window,'blur',clearInput);
  on(document,'visibilitychange',()=>{clearInput();if(!document.hidden&&!paused&&!disposed){lastTime=performance.now();schedule();}});
  on(canvas,'pointerdown',(event)=>{if(event.button!==0||paused)return;drag={x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});});
  on(canvas,'pointermove',(event)=>{
    if(!drag||paused)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;forward.applyAxisAngle(normal,-dx*.004).normalize();elevation=clamp(elevation+dy*.025,R+6,R+16);drag={x:event.clientX,y:event.clientY};
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])on(canvas,type,()=>{drag=null;});
  on(canvas,'wheel',(event)=>{if(paused)return;event.preventDefault();zoom=clamp(zoom+event.deltaY*.0006,.8,1.4);},{passive:false});
  on(canvas,'webglcontextlost',(event)=>{event.preventDefault();setPaused(true);onError('3D 图形上下文已丢失。可以继续阅读文章，刷新页面可重试场景。');});
  for(const label of labels)on(label.element,'click',()=>navigateTo(label.id));

  function resize(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width/height<.9?50:43;camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function setDirection(direction,active){if(direction in input){input[direction]=active;if(active)target=null;}}
  function navigateTo(id){if(!normals.has(id)||disposed)return false;target={id,normal:normals.get(id)};clearInput();onNotice(`小精灵正在带你前往${landmarkById(id).name}，按方向键可取消。`);return true;}
  function reset(){normal.copy(initialNormal);forward.copy(UP).addScaledVector(normal,-UP.dot(normal)).normalize();target=null;zoom=1;elevation=R+9.7;hasCamera=false;clearInput();nearbyId=null;onNearby(null);}
  function setPaused(value){paused=Boolean(value);clearInput();if(paused){cancelAnimationFrame(frame);frame=0;}else{lastTime=performance.now();schedule();}}
  function setLowPower(value){renderer.setPixelRatio(value?1:Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=!value;clouds.visible=!value;resize();}
  function setDusk(value){dusk=Boolean(value);sun.color.set(dusk?'#ffc489':'#fff0d5');sun.intensity=dusk?1.5:2.7;hemisphere.color.set(dusk?'#b8bedb':'#fff4df');hemisphere.intensity=dusk?.85:1.65;stars.visible=dusk;canvas.dataset.dusk=String(dusk);}
  function schedule(){if(!frame&&!disposed&&!paused&&!document.hidden)frame=requestAnimationFrame(animate);}
  function animate(now){
    frame=0;if(disposed||paused||document.hidden)return;
    const delta=clamp((now-lastTime)/1000,0,.05);lastTime=now;elapsed+=delta;
    right.crossVectors(forward,normal).normalize();movement.set(0,0,0);
    const x=Number(input.right)-Number(input.left),y=Number(input.up)-Number(input.down);
    let arrival=null,step=0;
    if(x||y){movement.addScaledVector(right,x).addScaledVector(forward,y).normalize();step=delta*.44;}
    else if(target){
      const angle=Math.acos(clamp(normal.dot(target.normal),-1,1));
      if(angle<.145){arrival=target.id;target=null;}
      else {movement.copy(target.normal).addScaledVector(normal,-target.normal.dot(normal));if(movement.lengthSq()<1e-10)movement.copy(forward);movement.normalize();step=Math.min(delta*.8,angle-.13);}
    }
    const moving=step>0;
    if(moving){
      const yaw=-Math.atan2(movement.dot(right),movement.dot(forward));avatar.visual.rotation.y=yaw;
      axis.crossVectors(normal,movement).normalize();rotation.setFromAxisAngle(axis,step);normal.applyQuaternion(rotation).normalize();forward.applyQuaternion(rotation).normalize();
    }
    right.crossVectors(forward,normal).normalize();basis.makeBasis(right,normal,forward.clone().negate());
    avatar.root.position.copy(normal).multiplyScalar(surfaceRadius(normal)+.015);avatar.root.quaternion.setFromRotationMatrix(basis);avatar.animate(elapsed,moving,reducedMotion);assets.update(reducedMotion?0:delta,moving&&!reducedMotion);
    guideN.copy(normal).addScaledVector(target?movement:right,.10).normalize();placeOnSurface(guide.root,guideN,R+.67+(!reducedMotion?Math.sin(elapsed*2.6)*.06:0));
    guide.root.quaternion.copy(avatar.root.quaternion);
    guide.animate?.(elapsed,reducedMotion);landscape.animate(elapsed,reducedMotion,dusk);
    for(const [i,resident] of residents.entries()){resident.pet.animate?.(elapsed+i,reducedMotion);resident.pet.root.position.copy(resident.base).addScaledVector(resident.normal,reducedMotion?0:Math.sin(elapsed*2+i)*.035);}
    cameraPosition.copy(normal).multiplyScalar(elevation*zoom).addScaledVector(forward,-10.5*zoom);
    if(!hasCamera){camera.position.copy(cameraPosition);hasCamera=true;}else camera.position.lerp(cameraPosition,1-Math.exp(-delta*8));
    camera.up.copy(normal);lookTarget.copy(normal).multiplyScalar(.5);camera.lookAt(lookTarget);camera.updateMatrixWorld();
    for(const label of labels){
      const facing=label.normal.dot(camera.position.clone().sub(label.normal.clone().multiplyScalar(R)));
      projected.copy(label.point).project(camera);
      const visible=facing>.9&&projected.z<1&&Math.abs(projected.x)<1&&Math.abs(projected.y)<.95;
      label.element.hidden=!visible;
      if(visible){label.element.style.left=`${(projected.x*.5+.5)*width}px`;label.element.style.top=`${(-projected.y*.5+.5)*height}px`;}
    }
    let closest=null,distance=.215;
    for(const landmark of landmarks){const angle=Math.acos(clamp(normal.dot(landmark.normal),-1,1));if(angle<distance){distance=angle;closest=landmark.item.id;}if(!reducedMotion){landmark.ornament.rotation.y=elapsed*.75;landmark.ornament.position.y=.3+Math.sin(elapsed*2+landmark.item.lon)*.025;}}
    if(closest!==nearbyId){nearbyId=closest;onNearby(closest);}
    if(!reducedMotion)clouds.rotation.y=elapsed*.008;
    renderer.render(scene,camera);
    canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);
    canvas.dataset.avatarAction=assets.entries.find(a=>a.id==='avatar')?.active?.getClip().name??'procedural';
    canvas.dataset.ready='true';canvas.dataset.position=normal.toArray().map((v)=>v.toFixed(4)).join(',');
    if(arrival)onArrival(arrival);
    schedule();
  }
  schedule();
  return { navigateTo,setDirection,reset,setPaused,setLowPower,setDusk,
    getNearby:()=>nearbyId,
    dispose(){disposed=true;cancelAnimationFrame(frame);abort.abort();observer.disconnect();assets.dispose();disposeTree(scene);labels.forEach((label)=>label.element.remove());renderer.dispose();}
  };
}
