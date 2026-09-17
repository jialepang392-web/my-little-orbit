# 开源复用与来源

核对日期：2026-09-16。这里只记录实际使用与明确区分的参考，不把研究项目描述为已部署。

## 已实际使用

### Three.js

- 仓库：https://github.com/mrdoob/three.js
- 固定版本：0.180.0 / tag r180。并不宣称这是最新版本。
- 用途：三维渲染、几何、材质、数学对象、射线以外的基础场景能力；GLTFLoader 负责资产导入，AnimationMixer 负责已有动画播放。
- 接入：`web/index.html` 与 `art-studio.html` 的 CDN import map；`web/src/world.js`、`art-models.js`、`landscape.js`、`art-studio.js`、`assets.js`。
- v0.2 额外使用同版本的 `RoundedBoxGeometry`、`BufferGeometryUtils.mergeGeometries`、`GLTFExporter`、`GLTFLoader`；使用同一 MIT 许可。
- 新增模型、WebP 渲染图、SVG 图标由本项目原创建模 / 渲染 / 绘制，不是外部模型包或 Hyper3D 输出。4 个小精灵是同一造型家族的配色变体。
- 许可证：MIT；原文保存在 `web/licenses/three-MIT.txt`。
- 版本依据：https://github.com/mrdoob/three.js/blob/r180/package.json

### flo-bit/tiny-planets

- 仓库：https://github.com/flo-bit/tiny-planets
- 源文件：`src/worlds/stars.ts`
- 固定 commit：`b51aa232dff0799908eb97927381bb33f40cf2d6`
- 来源：https://github.com/flo-bit/tiny-planets/blob/b51aa232dff0799908eb97927381bb33f40cf2d6/src/worlds/stars.ts
- 实际复用：星空粒子的 BufferGeometry / Points 模块，改编为 `web/src/vendor/stars.js`。
- 修改：去除 TypeScript 类型、加入可复现随机种子、柔和配色和配置项、资源释放。
- 许可证：MIT；Copyright (c) 2025 flo-bit；原文保存在 `web/licenses/tiny-planets-MIT.txt`。
- 没有复制其整个星球生成器、模型包、网站界面或存量素材。

## 仅调研，未复制

- https://github.com/TomClive/tiny-planet-adventure ：README 描述 Node.js / Gemini API 配置。没有完成源码与素材许可核验，不纳入本站代码。
- 用户上传的文章《用 GPT6 + Hyper3D MCP 搓 3D 个人网站，太夯了！（附教程）》：用于提取功能方向。未复制作者人物、小精灵、图片、视频或完整文章。附件未提供整站 GitHub 仓库地址。

## 本项目新增部分

### Blender 开发工具（v0.3）

本轮使用官方 Blender 4.5.10 LTS 进行 GLB 导入、骨骼/权重/动作制作、GLB 导出和 Cycles 渲染。
下载来源：`https://download.blender.org/release/Blender4.5/blender-4.5.10-macos-x64.dmg`。
安装仅在项目 `.tools/Blender.app`；Blender 程序本身未包含于网站下载 ZIP。
Blender Python API 与 glTF 导出器为实际使用工具，未声称为本项目原创。
原有模型与场景来自本项目 v0.2，原始文件保留；新增绑定、材质整理、部分细节和构建脚本为本项目制作。

网站 UI、博客内容示例、球面移动与导航、地标互动、收藏持久化、明信片生成和占位模型由本项目实现。不要称为“整站开源模板已部署”。新增代码尚未选择对外开源许可；如需公开，先由项目所有者决定。
