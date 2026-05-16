import { debounce } from '../utils/helpers.js';

export class PerformanceOptimizer {
  constructor() {
    this.init();
  }

  init() {
    window.addEventListener('resize', debounce(() => this._handleResize(), 250));
    this._setupIntersectionObserver();

    // Emit portfolioLoaded event
    window.dispatchEvent(new CustomEvent('portfolioLoaded', { detail: { timestamp: Date.now() } }));

    console.log('Enhanced Cupertino Portfolio loaded successfully!');
    console.log('Features: Smart navbar, interactive background, enhanced animations');
    console.log('Tip: Use Alt+1-5 for quick navigation between sections');
  }

  _setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-viewport');
          } else {
            entry.target.classList.remove('in-viewport');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.skill-card, .tech-item').forEach((el) => observer.observe(el));
  }

  _handleResize() {
    if (window.innerWidth > 768) {
      document.body.classList.remove('menu-open');
      const mobileNav = document.querySelector('.mobile-nav');
      const overlay = document.querySelector('.mobile-overlay');
      const menuBtn = document.querySelector('.menu-button');

      if (mobileNav) mobileNav.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      if (menuBtn) menuBtn.classList.remove('active');

      const navbar = document.getElementById('navbar');
      if (navbar) navbar.style.transform = 'translateY(0)';
    }
  }
}
