import './styles/cinematic.css';
import { portfolio } from './data/portfolio.js';
import { PortfolioContent } from './components/cinematic/PortfolioContent.js';
import { ChapterController } from './components/cinematic/ChapterController.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const skipScene = reducedMotion
  || Boolean(navigator.connection?.saveData)
  || navigator.hardwareConcurrency <= 2
  || navigator.deviceMemory <= 2;
async function boot() {
  new PortfolioContent(portfolio).render();
  new ChapterController({ reducedMotion });

  requestAnimationFrame(() => {
    document.getElementById('loader').classList.add('is-finished');
    document.body.classList.add('is-ready');
  });

  try {
    if (skipScene) {
      document.body.classList.add('no-webgl');
      document.getElementById('sceneControl')?.setAttribute('hidden', '');
      return;
    }
    const idle = 'requestIdleCallback' in window
      ? new Promise(resolve => window.requestIdleCallback(resolve, { timeout: 220 }))
      : new Promise(resolve => window.setTimeout(resolve, 0));
    await idle;
    const { ScrollWorld } = await import('./components/cinematic/ScrollWorld.js');
    new ScrollWorld(document.getElementById('world'));
  } catch(error) {
    document.body.classList.add('no-webgl');
    document.getElementById('sceneControl')?.setAttribute('hidden', '');
    console.error('WebGL world could not initialize.',error);
  }
}

boot();
