import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LANDMARKS } from './data.js';
import { ART_EDITION, artImage, artModel } from './art-paths.js';
import { PALETTE, makeArtLandmark, makeArtAvatar, makeArtGuide, makeArtTree, makeTreasure, makeMeadow, cyl, mergeStatic } from './art-models.js';

const assetDefinitions=[...LANDMARKS.map(item=>({id:item.id,name:item.name,kind:'landmark'})),{id:'traveller',name:'林间旅行者',kind:'character'},{id:'guide-sprout',name:'芽芽 · 森林向导',kind:'guide'},{id:'guide-petal',name:'花花 · 花园住客',kind:'guide'},{id:'guide-ember',name:'暖暖 · 灯塔住客',kind:'guide'},{id:'guide-droplet',name:'点点 · 观测站住客',kind:'guide'},...LANDMARKS.map(item=>({id:`treasure-${item.id}`,name:item.treasure,kind:'collectible'}))];
const bgColors=['#eee4cf','#f2e2d9','#ece5c9','#dce7e0','#e1e7d3','#dce3e9','#ede0d5','#e9dfca'];
function makeAsset(id){const definition=assetDefinitions.find(a=>a.id===id);if(!definition)throw new Error('Unknown art asset');const item=LANDMARKS.find(a=>a.id===id);let model,clips=[];
  if(item)model=makeArtLandmark(item).root;
  else if(id==='traveller'){const avatar=makeArtAvatar();model=avatar.root;clips=avatar.clips;}
  else if(id.startsWith('guide-'))model=makeArtGuide(id.slice(6)).root;
  else model=makeTreasure(id.slice(9));
  return {definition,model,clips};
}
function toBase64(buffer){let s='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
function meshStats(root){let meshes=0,triangles=0;root.traverse(n=>{if(n.isMesh){meshes++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;}});return {meshes,triangles:Math.round(triangles)};}
async function build(id){
  const {definition,model,clips}=makeAsset(id);
  // Validate the exported binary by loading it through the same GLTFLoader used by the site.
  const binary=await new GLTFExporter().parseAsync(model,{binary:true,animations:clips,onlyVisible:true});
  const roundTrip=await new GLTFLoader().parseAsync(binary,'');const bounds=new T.Box3().setFromObject(roundTrip.scene);
  if(bounds.isEmpty()||![...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite))throw new Error('GLB validation failed');
  if(id==='traveller'&&!['Idle','Walk'].every(name=>roundTrip.animations.some(c=>c.name===name)))throw new Error('Missing character animation');
  const canvas=document.createElement('canvas'),renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(960,720);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),index=LANDMARKS.findIndex(a=>a.id===id),background=bgColors[index<0?4:index];scene.background=new T.Color(background);scene.add(new T.HemisphereLight('#fff7e6','#737c70',1.65));const sun=new T.DirectionalLight('#ffedce',2.7);sun.position.set(-3,6,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-3;sun.shadow.camera.right=3;sun.shadow.camera.top=3;sun.shadow.camera.bottom=-3;sun.shadow.normalBias=.018;scene.add(sun);
  if(definition.kind!=='landmark')model.rotation.y=Math.PI;
  const group=new T.Group();group.add(model);
  if(definition.kind==='landmark'){
    group.add(cyl(1.07,1.02,.17,'#b4bb88',[0,-.1,0],40),cyl(1.03,1.035,.025,'#c9c698',[0,-.012,0],40));
    for(const [i,x] of [-.8,.81].entries()){const tree=makeArtTree(.82,i);tree.position.set(x,-.02,-.36);group.add(tree);}for(let i=0;i<5;i++){const grass=makeMeadow(i);grass.position.set(Math.cos(i*1.7)*.88,.007,Math.sin(i*1.7)*.8);group.add(grass);}
  }else{const isGuide=definition.kind==='guide';const isCollectible=definition.kind==='collectible';const s=isGuide?2.4:isCollectible?1.8:1.35;model.scale.setScalar(s);if(isGuide)model.position.y=.26;group.add(cyl(.68,.71,.11,'#c6bb9b',[0,-.07,0],40));}
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:background,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.195;floor.receiveShadow=true;scene.add(floor,group);
  const cam=new T.OrthographicCamera(-1.75,1.75,1.3125,-1.3125,.1,100);cam.position.set(3.4,2.5,4.5);cam.lookAt(0,.47,0);renderer.render(scene,cam);
  const image=canvas.toDataURL('image/webp',.93);renderer.dispose();
  return {definition,glb:toBase64(binary),image,bytes:binary.byteLength,animations:roundTrip.animations.map(c=>c.name),...meshStats(roundTrip.scene)};
}
window.artStudio={definitions:assetDefinitions,build};
const gallery=document.querySelector('#asset-gallery');
for(const a of assetDefinitions){const card=document.createElement('article');card.className='asset-card';const image=document.createElement('img');image.src=artImage(a.id);image.alt=a.name;image.loading='lazy';image.width=960;image.height=720;card.append(image);const title=document.createElement('h2');title.textContent=a.name;card.append(title);const link=document.createElement('a');link.href=artModel(a.id);link.download=`${a.id}.glb`;link.textContent='下载 GLB 模型 ↗';card.append(link);gallery.append(card);}
document.querySelector('#studio-status').textContent=`${assetDefinitions.length} 件原创模型 · ${ART_EDITION==='blender'?'Blender 精修、骨骼绑定与 Cycles 渲染':'v0.2 原始程序化资产'}`;
