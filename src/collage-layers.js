/** Curved, layered physical collage. Generated imagery is used only as material texture. */
import * as T from 'three';
import { fromLatLon, seededRandom } from './math.js';
import { part, ball, mergeStatic } from './garden-models.js';
const R=5.4,Z=new T.Vector3(0,0,1),atlasUrl=new URL('../assets/textures/collage-atlas.png',import.meta.url).href;
const supportLayers=[
  [8,99,3.35,3.9,-.22,5.57],[-29,62,2.1,2.4,.65,5.57],[38,58,1.8,2.3,-.3,5.57],[-10,-104,3.2,3.4,.23,5.57],[30,-56,2,2.7,-.5,5.57],
  [17,103,2.45,2.85,-.32,5.66],[12,112,1.7,2.45,-.12,5.62],[-26,63,1.4,1.9,.65,5.62],[-19,-108,2.05,2.6,.4,5.62],[22,-54,1.5,2.2,-.5,5.62]
].map(([lat,lon,w,h,angle,height])=>({w,h,height,inverse:new T.Quaternion().setFromUnitVectors(Z,new T.Vector3(...fromLatLon(lat,lon))).multiply(new T.Quaternion().setFromAxisAngle(Z,angle)).invert()}));
export function collageSurface(n){let height=0;for(const layer of supportLayers){const v=n.clone().applyQuaternion(layer.inverse);if(v.z>.8&&Math.abs(v.x*R)<layer.w/2&&Math.abs(v.y*R)<layer.h/2)height=Math.max(height,layer.height);}return height;}
function atlasMap(kind){
  const texture=new T.TextureLoader().load(atlasUrl);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  const xy={paper:[0,.5],stone:[.5,.5],foil:[0,0],moss:[.5,0]}[kind];texture.repeat.set(.486,.486);texture.offset.set(xy[0]+.007,xy[1]+.007);return texture;
}
const cached=new Map();
function material(kind,color='#ffffff'){
  const key=kind+color;if(cached.has(key))return cached.get(key);
  const map=atlasMap(kind),m=new T.MeshStandardMaterial({color,map,bumpMap:map,bumpScale:kind==='paper'?.015:.026,roughness:kind==='foil'?.3:.94,metalness:kind==='foil'?.67:0,side:T.DoubleSide});
  if(kind==='moss'){m.emissive.set('#506b32');m.emissiveIntensity=.35;}
  cached.set(key,m);return m;
}
function orient(root,lat,lon,angle=0){root.quaternion.setFromUnitVectors(Z,new T.Vector3(...fromLatLon(lat,lon)));root.rotateZ(angle);}
function patch(w,h,radius,kind,seed,ragged=true){
  const random=seededRandom(seed),geo=new T.PlaneGeometry(w,h,36,42),pos=geo.attributes.position;
  const nx=37,ny=43,left=Array.from({length:ny},()=>random()*.11),right=Array.from({length:ny},()=>random()*.11),top=Array.from({length:nx},()=>random()*.08),bottom=Array.from({length:nx},()=>random()*.08);
  for(let i=0;i<pos.count;i++){
    const row=Math.floor(i/nx),col=i%nx;let x=pos.getX(i),y=pos.getY(i);
    if(ragged){x+=col<3?left[row]*(1-col/3):col>33?-right[row]*(col-33)/3:0;y+=row<3?-top[col]*(1-row/3):row>39?bottom[col]*(row-39)/3:0;}
    const n=new T.Vector3(x,y,R).normalize(),curl=(kind==='paper'?.008:.012)*Math.sin(x*6+seed)*Math.sin(y*7);
    pos.setXYZ(i,...n.multiplyScalar(radius+curl).toArray());
  }geo.computeVertexNormals();const m=new T.Mesh(geo,material(kind));m.castShadow=true;m.receiveShadow=true;return m;
}
function inkText(text,width=1.2,height=1.7){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;const c=canvas.getContext('2d');c.clearRect(0,0,512,768);c.fillStyle='#35413aec';c.font='124px "Songti SC", "STSong", serif';c.textAlign='center';
  [...text].forEach((ch,i)=>c.fillText(ch,270+(i%2)*8,140+i*153));
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const geo=new T.PlaneGeometry(width,height,12,16),p=geo.attributes.position;for(let i=0;i<p.count;i++){const n=new T.Vector3(p.getX(i),p.getY(i),R).normalize();p.setXYZ(i,...n.multiplyScalar(5.68).toArray());}geo.computeVertexNormals();
  return new T.Mesh(geo,new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));
}
function curve(points,r,color,extra={}){return part(new T.TubeGeometry(new T.CatmullRomCurve3(points),points.length*2,r,4,false),color,[0,0,0],extra);}
export function makeCollageLayers(){
  const root=new T.Group();root.name='layered-paper-foil-and-lace';let patchCount=0;
  function sheet(lat,lon,w,h,angle,kind,radius,seed){const m=patch(w,h,radius,kind,seed);orient(m,lat,lon,angle);root.add(m);patchCount++;return m;}
  // Strata show through between the papers; irregular edges reveal the layer below.
  for(const [i,a] of [[8,99,3.35,3.9,-.22],[-29,62,2.1,2.4,.65],[38,58,1.8,2.3,-.3],[-10,-104,3.2,3.4,.23],[30,-56,2.0,2.7,-.5]].entries()){
    const [lat,lon,w,h,angle]=a;sheet(lat,lon,w,h,angle,'foil',5.50,40+i);sheet(lat+.7,lon+.3,w*.96,h*.96,angle+.025,'stone',5.53,80+i);
  }
  for(const [i,a] of [[17,103,2.45,2.85,-.32],[12,112,1.7,2.45,-.12],[-26,63,1.4,1.9,.65],[-19,-108,2.05,2.6,.4],[22,-54,1.5,2.2,-.5]].entries()){
    const [lat,lon,w,h,angle]=a;sheet(lat,lon,w,h,angle,'paper',i===0?5.64:5.60,11+i);
  }
  const poem=inkText('思念',.68,1.05);orient(poem,24,111,-.3);root.add(poem);
  const verse=inkText('一首诗',.52,1.18);orient(verse,-19,-107,.35);root.add(verse);
  // Fine red manuscript rules float only a few millimeters above the paper surface.
  const ruled=new T.Group();for(let x=-1.03;x<1.1;x+=.21){const pts=[];for(let j=0;j<=24;j++){const y=-1.23+j/24*2.46;pts.push(new T.Vector3(x,y,R).normalize().multiplyScalar(5.66));}ruled.add(curve(pts,.0028,'#a6584c'));}orient(ruled,17,103,-.32);root.add(mergeStatic(ruled));
  // Embroidered wire mesh uses tiny crossings and bead accents instead of a solid ring.
  const lace=new T.Group();
  for(const [lat,lon,angle] of [[42,94,-.3],[-46,75,.25],[7,-118,.5]]){
    const panel=new T.Group();
    for(const slope of [-1,1])for(let row=-13;row<=13;row++){
      const pts=[];for(let j=0;j<=24;j++){const x=-1.55+j/24*3.1,y=row*.092+slope*x*.20;if(Math.abs(y)>.28)continue;pts.push(new T.Vector3(x,y,R).normalize().multiplyScalar(5.69+.02*Math.sin(x*8+row)));}
      if(pts.length>2)panel.add(curve(pts,.0055,'#c6cfc0',{roughness:.32,metalness:.5}));
    }
    for(let i=0;i<19;i++){const x=-1.45+i*.16,y=Math.sin(i*2.3)*.14,p=new T.Vector3(x,y,R).normalize().multiplyScalar(5.72);panel.add(ball(.023,i%3?'#92aa9b':'#b89599',p.toArray()));}
    orient(panel,lat,lon,angle);lace.add(panel);
  }root.add(mergeStatic(lace));
  root.userData.patchCount=patchCount;return root;
}
export function texturedStoneMaterial(){return material('stone','#bdc5bc');}
export function mossMaterial(){return material('moss','#a9b393');}
export function clearCollageMaterialCache(){cached.clear();}
