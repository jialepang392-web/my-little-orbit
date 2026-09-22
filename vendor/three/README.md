# Three.js 0.180.0

This directory contains the exact browser modules used by the published work pages.

- Project: Three.js
- Version: 0.180.0
- Source package: `three@0.180.0` from the npm registry
- Upstream: https://github.com/mrdoob/three.js/tree/r180
- License: MIT, see `LICENSE`
- Integrity: exact package-file SHA-256 values are recorded in `manifest.json`

Included dependency closure:

- `build/three.module.js`
- `build/three.core.js`
- `examples/jsm/geometries/RoundedBoxGeometry.js`
- `examples/jsm/controls/OrbitControls.js`
- `examples/jsm/utils/BufferGeometryUtils.js`
- `examples/jsm/exporters/GLTFExporter.js`
- `examples/jsm/loaders/GLTFLoader.js`

`three.module.js` imports `three.core.js`. `GLTFLoader.js` imports `BufferGeometryUtils.js`; every other included add-on imports only the package's `three` specifier. `RoundedBoxGeometry.js` is part of the poem world's static module graph through `art-models.js`. The page import map must use the versioned same-origin roots:

```json
{"imports":{"three":"./vendor/three/0.180.0/build/three.module.js","three/addons/":"./vendor/three/0.180.0/examples/jsm/"}}
```
