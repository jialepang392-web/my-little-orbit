import * as T from 'three';

const materials = new Map();
function material(color, extra = {}) {
  const key = color + JSON.stringify(extra);
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness: .88, flatShading: true, ...extra }));
  return materials.get(key);
}
export function mesh(geometry, color, position = [0, 0, 0], extra = {}) {
  const object = new T.Mesh(geometry, material(color, extra));
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}
const box = (x,y,z,color,pos) => mesh(new T.BoxGeometry(x,y,z),color,pos);
const cylinder = (top,bottom,height,color,pos,sides=8) => mesh(new T.CylinderGeometry(top,bottom,height,sides),color,pos);
const cone = (radius,height,color,pos,sides=4) => mesh(new T.ConeGeometry(radius,height,sides),color,pos);
const ball = (radius,color,pos,detail=1) => mesh(new T.IcosahedronGeometry(radius,detail),color,pos);

function cottage(color, style = 'house') {
  const g = new T.Group();
  g.add(box(.74,.63,.6,'#f0e4cc',[0,.36,0]));
  const roof = cone(.65,.38,color,[0,.86,0]); roof.rotation.y = Math.PI / 4; g.add(roof);
  g.add(box(.19,.35,.025,'#5e7660',[0,.22,-.314]));
  for (const x of [-.24,.24]) g.add(box(.13,.16,.025,'#e2ba79',[x,.44,-.315]));
  g.add(box(.84,.045,.14,'#b9a68b',[0,.035,-.32]));
  g.add(box(.12,.4,.13,'#dbcfb9',[.2,.9,.16]));
  if (style === 'studio') {
    const side = box(.42,.38,.55,'#d6c799',[.46,.22,.05]); g.add(side);
    g.add(box(.5,.08,.61,color,[.46,.45,.05]));
    g.add(mesh(new T.TorusGeometry(.13,.035,5,12),'#9e8256',[.46,.24,-.245]));
  }
  if (style === 'library') {
    for (let i=0;i<4;i++) g.add(box(.07,.22+i*.02,.07,['#9aaf8c','#d39c7b','#899fb6','#dfc695'][i],[-.11+i*.07,.43,-.342]));
  }
  if (style === 'mail') {
    g.add(box(.21,.33,.2,'#ad6f57',[.58,.3,-.15]));
    g.add(box(.03,.24,.03,'#6f795d',[.58,.08,-.15]));
    g.add(box(.14,.025,.01,'#f6e5c7',[.58,.38,-.257]));
  }
  return g;
}

function garden() {
  const g = new T.Group();
  const arch = mesh(new T.TorusGeometry(.38,.032,5,20,Math.PI),'#ac9674',[0,.4,.12]);
  g.add(arch);
  for (const x of [-.38,.38]) g.add(cylinder(.03,.03,.44,'#ac9674',[x,.21,.12]));
  for (let i=0;i<8;i++) {
    const angle = i/8*Math.PI*2, x=Math.cos(angle)*.4,z=Math.sin(angle)*.34;
    g.add(cylinder(.012,.014,.19,'#7e9666',[x,.12,z]));
    g.add(ball(.07,['#e7b6a0','#c69a91','#ebd4a5'][i%3],[x,.24,z]));
  }
  const book = new T.Group();
  for (const side of [-1,1]) { const page=box(.25,.035,.29,'#f6eccf',[side*.12,.23,-.21]);page.rotation.z=side*.18;book.add(page); }
  g.add(book,box(.36,.04,.27,'#b7976d',[0,.12,-.22]));
  return g;
}

function lighthouse() {
  const g = new T.Group();
  for (let i=0;i<4;i++) g.add(cylinder(.18-i*.017,.2-i*.017,.3,i%2?'#d6b89a':'#eee8d1',[0,.16+i*.3,0],10));
  g.add(cylinder(.27,.27,.045,'#687e75',[0,1.24,0],12));
  g.add(cylinder(.14,.14,.21,'#e5be77',[0,1.37,0],8));
  g.add(cone(.25,.17,'#82988a',[0,1.57,0],8));
  g.add(box(.13,.24,.024,'#657b69',[0,.14,-.207]));
  return g;
}

function observatory(color) {
  const g = new T.Group();
  g.add(cylinder(.41,.46,.38,'#e9dfcd',[0,.22,0],12));
  g.add(mesh(new T.SphereGeometry(.42,12,6,0,Math.PI*2,0,Math.PI/2),color,[0,.41,0]));
  const scope = cylinder(.07,.09,.43,'#698080',[.19,.7,-.3]); scope.rotation.x=-.65;g.add(scope);
  g.add(box(.2,.26,.03,'#7d8c83',[0,.17,-.442]));
  return g;
}

function camp(color) {
  const g = new T.Group();
  const tent = cone(.49,.65,color,[0,.34,.05],3);tent.rotation.y=Math.PI/3;g.add(tent);
  const door = cone(.19,.38,'#647b5b',[0,.2,-.205],3);door.rotation.y=Math.PI/3;g.add(door);
  for (let i=0;i<6;i++) g.add(ball(.055,'#9c9f83',[.48+Math.cos(i)*.11,.05,-.33+Math.sin(i)*.1]));
  g.add(cone(.06,.16,'#d59856',[.48,.12,-.33],5));
  return g;
}

export function makeLandmark(item) {
  const root = new T.Group();
  const radius = item.model === 'studio' ? .65 : .58;
  root.add(cylinder(radius,radius+.02,.055,'#dbceb0',[0,.012,0],20));
  let building;
  switch(item.model) {
    case 'garden': building = garden(); break;
    case 'lighthouse': building = lighthouse(); break;
    case 'observatory': building = observatory(item.color); break;
    case 'camp': building = camp(item.color); break;
    default: building = cottage(item.color,item.model);
  }
  building.rotation.y = Math.PI;
  root.add(building);
  const ornament = mesh(new T.OctahedronGeometry(.065),'#e4ba68',[.55,.3,.3],{ metalness: .18 });
  root.add(ornament);
  return { root, building, ornament };
}

export function makeTree(size = 1, variant = 0) {
  const g = new T.Group();
  g.add(cylinder(.035,.055,.36,'#9a8460',[0,.18,0],5));
  if (variant%3===0) {
    g.add(cone(.24,.52,'#7f936f',[0,.51,0],7));
    g.add(cone(.18,.41,'#92a47f',[0,.72,0],7));
  } else {
    const crown = ball(.25,variant%2?'#b7bc8c':'#98aa80',[0,.48,0]);crown.scale.y=1.3;g.add(crown);
  }
  g.scale.setScalar(size);
  return g;
}

export function makeAvatar() {
  const root = new T.Group(), visual = new T.Group(); root.add(visual);
  const body = new T.Group(); visual.add(body);
  body.add(box(.24,.27,.18,'#c17b52',[0,.38,0]));
  body.add(ball(.185,'#e8cbaa',[0,.69,-.015],2));
  const hair = ball(.186,'#5c6550',[0,.77,.013],1);hair.scale.set(1,.54,.92);body.add(hair);
  for (const x of [-.063,.063]) body.add(ball(.018,'#3f5045',[x,.69,-.187],1));
  body.add(box(.19,.21,.12,'#b5c3a2',[0,.4,.135]));
  const leftLeg = new T.Group(), rightLeg = new T.Group();
  for (const [joint,x] of [[leftLeg,-.068],[rightLeg,.068]]) {
    joint.position.set(x,.26,0);joint.add(box(.095,.21,.11,'#eee4cf',[0,-.095,0]));
    joint.add(box(.105,.065,.16,'#697663',[0,-.208,-.025]));body.add(joint);
  }
  const arms = [];
  for (const x of [-.16,.16]) { const joint = new T.Group();joint.position.set(x,.49,0);joint.add(box(.065,.2,.075,'#c17b52',[0,-.09,0]));joint.add(ball(.04,'#e8cbaa',[0,-.19,0]));body.add(joint);arms.push(joint); }
  return { root, visual, body, animate(time,moving,reduced) { const swing=moving&&!reduced?Math.sin(time*11)*.58:0;leftLeg.rotation.x=swing;rightLeg.rotation.x=-swing;arms[0].rotation.x=-swing*.7;arms[1].rotation.x=swing*.7; } };
}

export function makeGuide() {
  const root = new T.Group(), visual = new T.Group();root.add(visual);
  const head=ball(.19,'#b7d4ba',[0,.12,0],2);head.scale.y=1.1;visual.add(head);
  for(const x of [-.065,.065])visual.add(ball(.022,'#49745d',[x,.15,-.17]));
  visual.add(cone(.075,.16,'#9aba93',[0,.4,0],5));
  const ring = mesh(new T.TorusGeometry(.23,.014,5,24),'#e7c787',[0,.11,0]);ring.rotation.x=Math.PI/2;visual.add(ring);
  return { root, visual };
}
