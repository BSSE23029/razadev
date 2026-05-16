import './styles/index.css';
import { ThemeManager } from './components/ThemeManager.js';
import { Navigation } from './components/Navigation.js';
import { Background } from './components/Background.js';
import { Hero } from './components/Hero.js';
import { TechQuote } from './components/TechQuote.js';
import { Skills } from './components/Skills.js';
import { About } from './components/About.js';
import { Publications } from './components/Publications.js';
import { GitHubActivity } from './components/GitHubActivity.js';
import { Contact } from './components/Contact.js';
import { ScrollAnimations } from './components/ScrollAnimations.js';
import { EnhancedInteractions } from './components/EnhancedInteractions.js';
import { PerformanceOptimizer } from './components/PerformanceOptimizer.js';

// Page entrance animation — apply before DOMContentLoaded so it's instant
document.body.style.opacity = '0';
document.body.style.transform = 'translateY(20px)';
document.body.style.transition = 'all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)';

document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
  new Navigation();
  new Background();
  new Hero();
  new TechQuote();
  new Skills();
  new About();
  new Publications();
  new GitHubActivity();
  new Contact();
  new ScrollAnimations();
  new EnhancedInteractions();
  new PerformanceOptimizer();

  // Trigger entrance animation
  setTimeout(() => {
    document.body.style.opacity = '1';
    document.body.style.transform = 'translateY(0)';
  }, 100);
});
