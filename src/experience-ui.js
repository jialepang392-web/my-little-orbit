/**
 * v0.25.0 presentation layer.
 *
 * This module only improves labels, visual hierarchy and orientation. The
 * existing exhibition module remains the sole owner of the lightbox, 3D
 * lifecycle and fullscreen canvas.
 */
const ICON_ROOT = './vendor/lucide/1.48.0/icons/';
const world = document.body.dataset.orbitWorld;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = matchMedia('(pointer: coarse)');

function icon(name) {
  const image = document.createElement('img');
  image.className = 'experience-icon';
  image.src = `${ICON_ROOT}${name}.svg`;
  image.width = 18;
  image.height = 18;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.decoding = 'async';
  return image;
}

function decorate(target, name, label) {
  if (!target || target.querySelector('.experience-icon')) return;
  target.prepend(icon(name));
  if (label) target.title = label;
}

function initHomepage() {
  const route = [...document.querySelectorAll('.collection-route a')];
  const cards = [...document.querySelectorAll('.world-card[data-world]')];
  route.forEach((link, index) => {
    const title = link.querySelector('strong')?.textContent?.trim();
    link.setAttribute('aria-label', `第 ${index + 1} 件作品：${title}`);
  });
  if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
  const routeByHash = new Map(route.map(link => [link.hash.slice(1), link]));
  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    for (const link of route) link.removeAttribute('aria-current');
    routeByHash.get(visible.target.id)?.setAttribute('aria-current', 'step');
  }, { rootMargin: '-25% 0px -55%', threshold: [0.15, 0.45] });
  cards.forEach(card => observer.observe(card));
}

function initArtwork() {
  const stage = document.querySelector('#yesterday-stage,#concept-stage,#world-stage,#rain-stage,#jielan-stage,#falling-stage');
  const options = document.querySelector('.exhibit-options');
  if (stage && options) stage.before(options);
  decorate(document.querySelector('.orbit-breadcrumb a'), 'arrow-left', '返回六件作品');
  decorate(options?.querySelector('.view-still'), 'image', '查看高清静态图版');
  decorate(options?.querySelector('.view-live'), 'box', '启动原作三维互动');
  decorate(options?.querySelector('.exhibit-inspect'), 'image', '放大高清图版');
  decorate(options?.querySelector('.exhibit-enter-live'), 'maximize-2', '进入全屏三维观看');
  document.querySelectorAll('.orbit-continuation-heading a').forEach(link => decorate(link, 'grid-2x2'));

  if (!stage) return;
  const guide = document.createElement('p');
  guide.className = 'experience-stage-guide';
  guide.setAttribute('aria-live', 'polite');
  stage.append(guide);
  const canvas = stage.querySelector('canvas');
  const sceneStatus = document.querySelector('#model-status,#scene-status');
  const updateGuide = () => {
    const live = document.body.dataset.orbitView === 'live';
    const ready = canvas?.dataset.ready === 'true' && (world === 'poem' || stage.classList.contains('is-ready'));
    const failed = !ready && (sceneStatus?.classList.contains('error') || stage.getAttribute('aria-busy') === 'false');
    const text = !live ? '高清图版 · 点按放大 · 向下继续看细节'
      : failed ? '三维暂未展开 · 可以切回高清图版'
      : !ready ? '三维正在加载 · 高清图版可随时查看'
      : coarsePointer.matches ? '三维已开启 · 拖动旋转 · 双指缩放'
      : '三维已开启 · 拖动旋转 · 滚轮缩放';
    if (guide.textContent !== text) guide.textContent = text;
  };
  updateGuide();
  new MutationObserver(updateGuide).observe(document.body, {
    attributes: true,
    attributeFilter: ['data-orbit-view']
  });
  if (canvas) new MutationObserver(updateGuide).observe(canvas, { attributes: true, attributeFilter: ['data-ready'] });
  new MutationObserver(updateGuide).observe(stage, { attributes: true, attributeFilter: ['class', 'aria-busy'] });
  if (sceneStatus) new MutationObserver(updateGuide).observe(sceneStatus, { attributes: true, attributeFilter: ['class'], childList: true });
  coarsePointer.addEventListener?.('change', updateGuide);
}

function init() {
  document.body.classList.add('experience-ready');
  if (world) initArtwork();
  else initHomepage();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
