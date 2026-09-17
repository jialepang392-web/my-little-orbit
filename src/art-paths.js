// Shared by reading, postcards and the gallery. No WebGL dependency.
const params=new URLSearchParams(globalThis.location?.search??'');
const original=params.get('assets')==='original';
const archive=globalThis.location?.pathname?.endsWith('art-studio.html')||globalThis.location?.pathname?.endsWith('blender-preview.html')||params.get('edition')==='blender';
export const ART_EDITION=original?'original':archive?'blender':'garden';
export const artImage=(id)=>`./assets/renders/${original?'':`${ART_EDITION}/`}${id}.webp`;
export const artModel=(id)=>`./assets/models/${original?'original':'blender'}/${id}.glb`;
