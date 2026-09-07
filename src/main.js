import './styles/cinematic.css';
import { portfolio } from './data/portfolio.js';
import { PortfolioContent } from './components/cinematic/PortfolioContent.js';
import { ChapterController } from './components/cinematic/ChapterController.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canCreateWebGL = () => {
  try {
    const probe = document.createElement('canvas');
    const context = probe.getContext('webgl2') || probe.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
};

// Low-power and data-saver devices still get the space language through the
// scene's low tier; only reduced motion and unavailable WebGL skip the module.
const skipScene = reducedMotion || !canCreateWebGL();

const revealLoader = () => {
  requestAnimationFrame(() => {
    document.getElementById('loader').classList.add('is-finished');
    document.body.classList.add('is-ready');
  });
};

const primeLogoDecode = () => {
  document.querySelectorAll('img.theme-logo').forEach(image => {
    const decode = () => Promise.resolve(image.decode?.()).catch(() => {});
    if (image.complete) decode();
    else image.addEventListener('load', decode, { once: true });
  });
};

async function boot() {
  primeLogoDecode();
  new PortfolioContent(portfolio).render();
  new ChapterController({ reducedMotion });

  try {
    if (skipScene) {
      document.body.classList.add('no-webgl');
      document.getElementById('sceneControl')?.setAttribute('hidden', '');
      revealLoader();
      return;
    }
    const idle = 'requestIdleCallback' in window
      ? new Promise(resolve => window.requestIdleCallback(resolve, { timeout: 220 }))
      : new Promise(resolve => window.setTimeout(resolve, 0));
    await idle;
    const { ScrollWorld } = await import('./components/cinematic/ScrollWorld.js');
    new ScrollWorld(document.getElementById('world'));
    revealLoader();
  } catch(error) {
    document.body.classList.add('no-webgl');
    document.getElementById('sceneControl')?.setAttribute('hidden', '');
    revealLoader();
    console.error('WebGL world could not initialize.',error);
  }
}

boot();
