# 我的小宇宙 · 留下的形状 — v0.11.0

Exhibition 01 / **The Shape of What Remains**. A two-act collection of four independently authored digital sculptures, in the fixed order Yesterday, Today → Deleted a Hundred Times → If Longing Were a Poem → Rain Finale.

This edition adds a curated gallery, revised material relationships and a complete set of same-scene images for the three later works: cover, three independently positioned material-study cameras, true profile and verso, editorial print and downloadable GLB. Yesterday, Today retains its accepted v0.9.2 geometry, outer title and text-free memory lens.

The native picker and adjacent-work navigation remain usable without WebGL. Explicit `?view=still` does not fetch the engine until the visitor chooses live interaction. Immersive viewing moves the original canvas rather than creating another renderer. The garden retains all eight destinations, walking and reading.

Each revised artwork includes an `assets/<work>/build.json` source/output manifest. GLBs are static snapshots: web lighting, postprocessing, rain animation and interaction are omitted. The garden ground uses authored vertex colours without the browser-only triplanar mineral-grain shader. The current website uses Three.js r180; licensing below remains applicable. No font files or original reference photographs are distributed.

## Historical v0.8.1 navigation edition

Current exhibition order: **昨天，今天 / Yesterday, Today → 删了一百遍 / Deleted a Hundred Times → 思念若是一首诗 / If Longing Were a Poem → 雨终曲 / Rain Finale**.

The four worlds preserve their independent artwork. A shared, theme-aware native thumbnail picker indicates the current world; adjacent-work previews link the full exhibition into a loop. Returning to the collection lands at the current work's card. Navigation remains usable without JavaScript or the 3D engine. The gallery only loads static covers, not four WebGL scenes.

Collection: https://jialepang392-web.github.io/my-little-orbit/?v=081

Yesterday, Today: https://jialepang392-web.github.io/my-little-orbit/yesterday-today.html?v=081

Yesterday, Today includes eleven authored layers of pearlescent film, red corrugated conduit, a record label, glass lenses, blossoms and feather barbs. Its covers, details and downloadable GLB come from the actual scene. No reference photograph, performer credit, watermark, audio, lyrics or font file is included.

Version 0.8.1 adds shared wayfinding without changing the original models, material maps or artwork styles. Third-party license information below continues to apply.

## Historical v0.7 notes

Three independently authored worlds: 思念若是一首诗 / the accepted Paper Garden; 删了一百遍 / DELETED A HUNDRED TIMES, a monochrome paper/foil/type sculpture; and 雨终曲 / RAIN FINALE, a nocturnal assemblage of graphite, cobalt light, silver gauze and torn typography.

Collection: https://jialepang392-web.github.io/my-little-orbit/?v=070

Paper Garden: https://jialepang392-web.github.io/my-little-orbit/poem.html?v=061

Deleted a Hundred Times: https://jialepang392-web.github.io/my-little-orbit/crossover.html?v=061

Rain Finale: https://jialepang392-web.github.io/my-little-orbit/rain-finale.html?v=070

Current version: 0.7.0. Three.js r180, static HTML/CSS/ES modules. No API keys required.
The two concept sculptures are independent interpretations of the user's respective visual references. All new geometry and texture maps are programmatically authored; no image-generation service was invoked. Covers, details and Rain Finale's 1600 × 2000 art print use the real rendered sculpture, not the reference photograph.
Rain Finale includes twelve material layers, actual open-weave alpha-masked gauze, normal-mapped foil, fine chains, emissive rain lamps, an authored back, and a downloadable GLB. The GLB retains geometry and materials but does not include the website's environment lighting, bloom, rain animation or controls. Rain and rotation are opt-in; static viewing remains available without WebGL. The earlier works retain their accepted artwork.
The homepage loads only static covers, not multiple WebGL scenes. Forest previews and downloads are archived outside the current public build; previous Git history has not been rewritten.

Third-party notices and Three.js MIT license are retained. Each title SVG contains only its laid-out character outlines; no font file is distributed.

Rain Finale additionally uses Three.js r180 OrbitControls, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, ShaderPass, BufferGeometryUtils and GLTFExporter, under the existing Three.js MIT license in `licenses/three-MIT.txt`. The composition, material artwork, draped geometry and final print-grade shader are project-authored.
