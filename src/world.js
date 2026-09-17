import * as T from 'three';
import { LANDMARKS, landmarkById } from './data.js?v=091';
import { fromLatLon, seededRandom, clamp } from './math.js?v=091';
import { orbitFrame, dragOrbit, surfaceStep } from './navigation.js?v=091';
import { frameSeconds, shouldAnimate } from './runtime.js?v=091';
import { Stars } from './vendor/stars.js?v=091';
import { makeArtAvatar as makeOriginalAvatar, makeArtGuide as makeOriginalGuide, makeArtLandmark as makeOriginalLandmark, part as mesh } from './art-models.js?v=091';
import { makeArtAvatar as makeGardenAvatar, makeArtGuide as makeGardenGuide, makeArtLandmark as makeGardenLandmark } from './garden-models.js?v=091';
import { makeLandscape, surfaceRadius, placeSurface } from './landscape.js?v=091';
import { AssetSlots, disposeTree } from './assets.js?v=091';
import { makeCollageLight } from './collage-light.js?v=091';

const R=5.4,UP=new T.Vector3(0,1,0);
const initialNormal=new T.Vector3(...fromLatLon(-24,84));
function placeOnSurface(object,normal,height=R){object.position.copy(normal).multiplyScalar(height);object.quaternion.setFromUnitVectors(UP,normal);}
export function createWorld({canvas,labelLayer,onNearby=()=>{},onArrival=()=>{},onError=()=>{},onNotice=()=>{},onNavigation=()=>{},reducedMotion=false}) {
  // Forest is archived, not an undocumented public query-parameter mode.
  const blenderEdition=false,originalEdition=false;
  const historicalEdition=blenderEdition||originalEdition;
  const makeAvatar=historicalEdition?makeOriginalAvatar:makeGardenAvatar,makeGuide=historicalEdition?makeOriginalGuide:makeGardenGuide,makeLandmark=historicalEdition?makeOriginalLandmark:makeGardenLandmark;
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}
  catch(error){throw new Error('此浏览器无法启动 WebGL2。纯阅读模式仍可使用。',{cause:error});}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setClearColor(0xdde6dd,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,1,.1,180);
  const studioLight=makeCollageLight(renderer);scene.environment=studioLight.texture;scene.environmentIntensity=.67;
  const hemisphere=new T.HemisphereLight('#f0efe3','#414b3a',1.15);scene.add(hemisphere);
  const sun=new T.DirectionalLight('#fff5df',2.75);sun.position.set(-9,11,12);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-8;sun.shadow.camera.right=8;sun.shadow.camera.top=8;sun.shadow.camera.bottom=-8;sun.shadow.normalBias=.035;
  scene.add(sun,new T.AmbientLight('#edf3ed',.2));
  const random=seededRandom(9162026);
  const stars=new Stars({particleCount:180,minimumDistance:13,maximumDistance:36,size:.045,seed:916});stars.visible=false;scene.add(stars);
  const normals=new Map(LANDMARKS.map((item)=>[item.id,new T.Vector3(...fromLatLon(item.lat,item.lon))]));
  const landscape=makeLandscape(normals);scene.add(landscape.root);
  canvas.dataset.botanicalClumps=String(landscape.root.userData.botanicalClumps??0);
  canvas.dataset.collageLayers=String(landscape.root.getObjectByName('layered-paper-foil-and-lace')?.userData.patchCount??0);
  let dusk=false;
  const landmarks=[],labels=[],slots={};
  for(const item of LANDMARKS){
    const model=makeLandmark(item),normal=normals.get(item.id);placeSurface(model.root,normal);scene.add(model.root);
    landmarks.push({...model,item,normal});slots[item.id]={parent:model.root,placeholder:model.building,placeholders:[...model.root.children]};
    const label=document.createElement('button');label.className='landmark-label';label.textContent=item.name;label.dataset.landmark=item.id;label.setAttribute('aria-label',`前往${item.name}`);
    labelLayer.append(label);labels.push({element:label,normal,point:normal.clone().multiplyScalar(R+1.05),id:item.id});
  }
  const clouds=new T.Group();clouds.visible=historicalEdition;scene.add(clouds);
  for(let i=0;i<7;i++){
    const n=new T.Vector3(...fromLatLon(-45+i*16,i*53));const cloud=new T.Group();
    for(let j=0;j<4;j++){const puff=mesh(new T.IcosahedronGeometry(.29,2),'#faf5e7',[(j-1.5)*.27,.04+(j%2)*.08,0]);puff.scale.set(1.1,.52,.85);puff.castShadow=false;cloud.add(puff);}
    placeOnSurface(cloud,n,R+1.5+random()*.4);clouds.add(cloud);
  }
  const avatar=makeAvatar();scene.add(avatar.root);slots.avatar={parent:avatar.visual,placeholder:avatar.body};
  const guide=makeGuide();scene.add(guide.root);slots.guide={parent:guide.root,placeholder:guide.visual};
  const residents=[];
  for(const [i,id] of ['journal','lab','observatory','camp'].entries()){const pet=makeGuide(['petal','ember','droplet','sprout'][i]);const petN=normals.get(id).clone().add(new T.Vector3(.045,0,.035)).normalize();placeSurface(pet.root,petN,.26);pet.root.rotateY(Math.PI);pet.root.scale.setScalar(.8);scene.add(pet.root);slots[`resident-${id}`]={parent:pet.root,placeholder:pet.visual};residents.push({pet,base:pet.root.position.clone(),normal:petN});}
  const assets=new AssetSlots(onNotice);
  canvas.dataset.edition=originalEdition?'original':blenderEdition?'blender':'garden';canvas.dataset.assetsExpected=blenderEdition&&!originalEdition?'14':'0';canvas.dataset.assetsLoaded='0';canvas.dataset.assetFailures='';
  if(blenderEdition&&!originalEdition)void assets.load(slots).then(()=>{if(disposed)return;canvas.dataset.assetsLoaded=String(assets.entries.length);canvas.dataset.assetFailures=assets.failures.join(',');invalidate();});
  let normal=initialNormal.clone(),forward=UP.clone().addScaledVector(normal,-UP.dot(normal)).normalize();
  let target=null,nearbyId=null,paused=false,disposed=false,frame=0,lastTime=performance.now(),elapsed=0,zoom=1,width=1,height=1,followTraveller=true;
  let inViewport=true,dirty=true,renderedFrames=0,navigationKey='';
  canvas.dataset.textureStatus='loading';
  void landscape.ready.then(loaded=>{if(disposed)return;canvas.dataset.textureStatus=loaded?'ready':'fallback';if(!loaded)onNotice('纸石纹理暂未加载，已保留园林造型和全部游园功能。');invalidate();});
  // Art-directed front view is independent of where the traveller starts.
  const initialOrbit=orbitFrame([0,.055589,.998454],[0,.998454,-.055589]);
  let orbit=initialOrbit;
  const cameraOutward=new T.Vector3(...orbit.outward),cameraUp=new T.Vector3(...orbit.up);
  const cameraDistance=22,raycaster=new T.Raycaster(),pointer=new T.Vector2();
  const ground=landscape.ground??landscape.surface??landscape.root.children.find(object=>object.isMesh);
  const targetMarker=new T.Mesh(new T.TorusGeometry(.19,.015,6,36),new T.MeshBasicMaterial({color:'#a53d36',depthWrite:false}));
  targetMarker.geometry.rotateX(Math.PI/2);targetMarker.visible=false;targetMarker.renderOrder=2;scene.add(targetMarker);
  let surfaceClicks=0,orbitDrags=0;
  const input={up:false,down:false,left:false,right:false};
  const abort=new AbortController(),signal=abort.signal;
  const right=new T.Vector3(),movement=new T.Vector3(),axis=new T.Vector3(),rotation=new T.Quaternion(),basis=new T.Matrix4(),projected=new T.Vector3(),guideN=new T.Vector3(),screenForward=new T.Vector3();
  let drag=null;
  const on=(element,type,handler,options={})=>element.addEventListener(type,handler,{...options,signal});
  const clearInput=()=>{for(const key of Object.keys(input))input[key]=false;drag=null;};
  const keyMap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
  on(window,'keydown',(event)=>{
    if(paused||event.altKey||event.ctrlKey||event.metaKey||event.target?.closest('input,textarea,select,[contenteditable="true"]'))return;
    const key=keyMap[event.code];if(key){event.preventDefault();if(!input[key])startManualMovement();input[key]=true;target=null;invalidate();}
  });
  on(window,'keyup',(event)=>{const key=keyMap[event.code];if(key){input[key]=false;invalidate();}});
  on(window,'blur',()=>{clearInput();invalidate();});
  on(document,'visibilitychange',()=>{clearInput();if(!document.hidden&&!paused&&!disposed){lastTime=performance.now();schedule();}});
  on(canvas,'pointerdown',(event)=>{if(event.button!==0||paused||drag)return;drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false};canvas.setPointerCapture(event.pointerId);canvas.focus({preventScroll:true});});
  on(canvas,'pointermove',(event)=>{
    if(!drag||drag.id!==event.pointerId||paused)return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6)return;
    if(!drag.moved){drag.moved=true;orbitDrags++;}
    orbit=dragOrbit(orbit,event.clientX-drag.x,event.clientY-drag.y);drag.x=event.clientX;drag.y=event.clientY;followTraveller=false;invalidate();
  });
  on(canvas,'pointerup',(event)=>{
    if(!drag||drag.id!==event.pointerId)return;
    const clicked=!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6;drag=null;
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    if(clicked&&!paused)navigateToSurface(event.clientX,event.clientY);else invalidate();
  });
  for(const type of ['pointercancel','lostpointercapture'])on(canvas,type,()=>{drag=null;});
  on(canvas,'wheel',(event)=>{if(paused)return;event.preventDefault();zoom=clamp(zoom+event.deltaY*.0006,.8,1.4);invalidate();},{passive:false});
  on(canvas,'webglcontextlost',(event)=>{event.preventDefault();setPaused(true);onError('3D 图形上下文已丢失。可以继续阅读文章，刷新页面可重试场景。');});
  for(const label of labels)on(label.element,'click',()=>navigateTo(label.id));

  function resize(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width/height<.9?43:34.5;camera.updateProjectionMatrix();invalidate();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const visibilityObserver=new IntersectionObserver(([entry])=>{inViewport=entry.isIntersecting;canvas.dataset.inViewport=String(inViewport);invalidate();});visibilityObserver.observe(canvas);
  function focusTraveller(){
    const view=new T.Vector3(...orbit.outward);
    if(view.dot(normal)<.3)orbit=orbitFrame(normal.clone().multiplyScalar(R+9.7).addScaledVector(forward,-10.5).toArray(),normal.toArray());
  }
  function startManualMovement(){target=null;followTraveller=true;focusTraveller();}
  function setDirection(direction,active){if(direction in input){if(active&&!input[direction])startManualMovement();input[direction]=active;invalidate();}}
  function navigateToSurface(clientX,clientY){
    if(!ground||disposed)return false;
    const rect=canvas.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    scene.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObject(ground,true)[0];
    if(!hit)return false;
    const destination=hit.point.clone().normalize();clearInput();target={id:null,kind:'surface',normal:destination};followTraveller=false;surfaceClicks++;
    target.startAngle=Math.acos(clamp(normal.dot(destination),-1,1));invalidate();
    canvas.dataset.lastSurfaceClick=destination.toArray().map(value=>value.toFixed(6)).join(',');
    onNotice('已选好落脚处，旅人正沿球面前往。按方向键可取消。');return true;
  }
  function navigateTo(id){if(!normals.has(id)||disposed)return false;target={id,kind:'landmark',normal:normals.get(id)};target.startAngle=Math.acos(clamp(normal.dot(target.normal),-1,1));clearInput();followTraveller=true;focusTraveller();invalidate();onNotice(`纸鹤正在带你前往${landmarkById(id).name}，按方向键可取消。`);return true;}
  function cancelNavigation(){target=null;clearInput();targetMarker.visible=false;invalidate();}
  function reset(){normal.copy(initialNormal);forward.copy(UP).addScaledVector(normal,-UP.dot(normal)).normalize();target=null;zoom=1;orbit=initialOrbit;followTraveller=true;clearInput();nearbyId=null;onNearby(null);invalidate();}
  function setPaused(value){paused=Boolean(value);clearInput();canvas.dataset.paused=String(paused);if(paused){cancelAnimationFrame(frame);frame=0;}else{lastTime=performance.now();invalidate();}}
  function setLowPower(value){renderer.setPixelRatio(value?1:Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=!value;clouds.visible=historicalEdition&&!value;landscape.setLowPower?.(value);resize();}
  function setDusk(value){dusk=Boolean(value);sun.color.set(dusk?'#edc9ad':'#fff8e5');sun.intensity=dusk?1.5:2.65;hemisphere.color.set(dusk?'#bac8d2':'#eef3e5');hemisphere.intensity=dusk?.9:1.3;stars.visible=dusk;canvas.dataset.dusk=String(dusk);invalidate();}
  function invalidate(){dirty=true;if(!frame)lastTime=performance.now();schedule();}
  function schedule(){
    const active=Boolean(target||drag||Object.values(input).some(Boolean));
    if(!frame&&!disposed&&shouldAnimate({paused,hidden:document.hidden,inViewport:inViewport||renderedFrames===0,reducedMotion,active,dirty}))frame=requestAnimationFrame(animate);
  }
  function animate(now){
    frame=0;if(disposed||paused||document.hidden)return;
    const delta=frameSeconds(now,lastTime);lastTime=now;elapsed+=delta;dirty=false;
    cameraOutward.fromArray(orbit.outward);cameraUp.fromArray(orbit.up);
    right.crossVectors(forward,normal).normalize();movement.set(0,0,0);
    const x=Number(input.right)-Number(input.left),y=Number(input.up)-Number(input.down);
    let arrival=null,step=0;
    if(x||y){
      screenForward.copy(cameraUp).addScaledVector(normal,-cameraUp.dot(normal));
      if(screenForward.lengthSq()>1e-5)forward.copy(screenForward).normalize();
      right.crossVectors(forward,normal).normalize();movement.addScaledVector(right,x).addScaledVector(forward,y).normalize();step=delta*.44;
    }
    else if(target){
      const planned=surfaceStep(normal.toArray(),target.normal.toArray(),delta*.8,target.kind==='landmark'?.13:.008);
      if(planned.reached){arrival=target.id;target=null;}
      else {movement.fromArray(planned.tangent);step=planned.step;}
    }
    const moving=step>0;
    if(moving){
      const yaw=-Math.atan2(movement.dot(right),movement.dot(forward));avatar.visual.rotation.y=yaw;
      axis.crossVectors(normal,movement).normalize();rotation.setFromAxisAngle(axis,step);normal.applyQuaternion(rotation).normalize();forward.applyQuaternion(rotation).normalize();
      if(followTraveller){cameraOutward.applyQuaternion(rotation).normalize();cameraUp.applyQuaternion(rotation).normalize();orbit=orbitFrame(cameraOutward.toArray(),cameraUp.toArray());}
    }
    right.crossVectors(forward,normal).normalize();basis.makeBasis(right,normal,forward.clone().negate());
    avatar.root.position.copy(normal).multiplyScalar(surfaceRadius(normal)+.015);avatar.root.quaternion.setFromRotationMatrix(basis);avatar.animate(elapsed,moving,reducedMotion);assets.update(reducedMotion?0:delta,moving&&!reducedMotion);
    guideN.copy(normal).addScaledVector(target?movement:right,.10).normalize();placeOnSurface(guide.root,guideN,surfaceRadius(guideN)+.62+(!reducedMotion?Math.sin(elapsed*2.6)*.06:0));
    guide.root.quaternion.copy(avatar.root.quaternion);
    guide.animate?.(elapsed,reducedMotion);landscape.animate(elapsed,reducedMotion,dusk);
    for(const [i,resident] of residents.entries()){resident.pet.animate?.(elapsed+i,reducedMotion);resident.pet.root.position.copy(resident.base).addScaledVector(resident.normal,reducedMotion?0:Math.sin(elapsed*2+i)*.035);}
    camera.position.fromArray(orbit.outward).multiplyScalar(cameraDistance*zoom);camera.up.fromArray(orbit.up);camera.lookAt(0,0,0);camera.updateMatrixWorld();
    targetMarker.visible=target?.kind==='surface';
    if(targetMarker.visible){placeSurface(targetMarker,target.normal,.055);targetMarker.scale.setScalar(reducedMotion?1:1+Math.sin(elapsed*4)*.08);}
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
    const remaining=target?Math.acos(clamp(normal.dot(target.normal),-1,1)):0;
    const completion=target?Math.round(clamp(1-Math.max(0,remaining-(target.kind==='landmark'?.13:.008))/Math.max(.001,target.startAngle-(target.kind==='landmark'?.13:.008)),0,1)*100):0;
    const nextKey=target?`${target.kind}/${target.id}/${completion}`:'idle';
    if(nextKey!==navigationKey){navigationKey=nextKey;onNavigation(target?{id:target.id,kind:target.kind,completion}:null);}
    if(!reducedMotion)clouds.rotation.y=elapsed*.008;
    renderer.render(scene,camera);
    canvas.dataset.frame=String(++renderedFrames);
    canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);
    canvas.dataset.avatarAction=assets.entries.find(a=>a.id==='avatar')?.active?.getClip().name??(moving?'Walk':'Idle');
    canvas.dataset.ready='true';canvas.dataset.position=normal.toArray().map((v)=>v.toFixed(4)).join(',');
    canvas.dataset.camera=orbit.outward.map(value=>value.toFixed(6)).join(',');canvas.dataset.cameraUp=orbit.up.map(value=>value.toFixed(6)).join(',');
    canvas.dataset.zoom=zoom.toFixed(3);canvas.dataset.navigation=target?.kind??(moving?'manual':'idle');canvas.dataset.target=target?.normal.toArray().map(value=>value.toFixed(6)).join(',')??'';
    canvas.dataset.targetLandmark=target?.id??'';canvas.dataset.surfaceClicks=String(surfaceClicks);canvas.dataset.orbitDrags=String(orbitDrags);canvas.dataset.cameraFollow=String(followTraveller);
    if(arrival)onArrival(arrival);
    schedule();
  }
  schedule();
  return { navigateTo,cancelNavigation,setDirection,reset,setPaused,setLowPower,setDusk,
    getNearby:()=>nearbyId,
    dispose(){disposed=true;cancelAnimationFrame(frame);abort.abort();observer.disconnect();visibilityObserver.disconnect();assets.dispose();disposeTree(scene);studioLight.dispose();labels.forEach((label)=>label.element.remove());renderer.dispose();}
  };
}
