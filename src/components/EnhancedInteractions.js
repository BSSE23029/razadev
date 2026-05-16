import { createRipple, applyMagneticEffect } from '../utils/events.js';

export class EnhancedInteractions {
  constructor() {
    this.init();
  }

  init() {
    this._initMagneticEffect();
    this._initClickEffects();
    this._initHoverEffects();
    this._initTouchOptimizations();
    this._initParallaxScrolling();
  }

  _initMagneticEffect() {
    const magneticElements = document.querySelectorAll(
      '.skill-card, .tech-item, .btn-primary, .social-link'
    );
    applyMagneticEffect(magneticElements);
  }

  _initParallaxScrolling() {
    const floatingElements = document.querySelectorAll('.floating-logo');

    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.2;

      floatingElements.forEach((el, index) => {
        const offset = (index + 1) * 0.1;
        const rotation = scrolled * 0.01;
        el.style.transform = `translateY(${rate * offset}px) rotate(${rotation}deg)`;
      });
    }, { passive: true });
  }

  _initClickEffects() {
    const interactiveElements = document.querySelectorAll(
      '.btn-primary, .contact-email, .social-link, .tech-item'
    );

    interactiveElements.forEach((el) => {
      el.addEventListener('click', (e) => createRipple(e, el));
    });
  }

  _initHoverEffects() {
    const skillCards = document.querySelectorAll('.skill-card');

    skillCards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        const icon = card.querySelector('.skill-icon');
        const title = card.querySelector('.skill-title');

        if (icon) icon.style.transform = 'scale(1.15) rotate(8deg)';
        if (title) title.style.color = 'var(--primary)';

        card.style.boxShadow = 'var(--shadow-xl), 0 0 40px rgba(0, 122, 255, 0.2)';
      });

      card.addEventListener('mouseleave', () => {
        const icon = card.querySelector('.skill-icon');
        const title = card.querySelector('.skill-title');

        if (icon) icon.style.transform = 'scale(1) rotate(0deg)';
        if (title) title.style.color = 'var(--text-primary)';
        card.style.boxShadow = 'var(--shadow-sm)';
      });
    });
  }

  _initTouchOptimizations() {
    if (!('ontouchstart' in window)) return;

    document.body.classList.add('touch-device');

    const touchElements = document.querySelectorAll(
      '.btn-primary, .contact-email, .skill-card, .tech-item'
    );

    touchElements.forEach((el) => {
      el.addEventListener('touchstart', () => {
        el.style.transform = 'scale(0.98)';
      }, { passive: true });

      el.addEventListener('touchend', () => {
        setTimeout(() => { el.style.transform = ''; }, 100);
      }, { passive: true });
    });
  }
}
