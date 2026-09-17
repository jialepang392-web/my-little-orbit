// Shared by reading, postcards and the gallery. No WebGL dependency.
const original=new URLSearchParams(globalThis.location?.search??'').get('assets')==='original';
export const ART_EDITION=original?'original':'blender';
export const artImage=(id)=>`./assets/renders/${original?'':'blender/'}${id}.webp`;
export const artModel=(id)=>`./assets/models/${ART_EDITION}/${id}.glb`;
