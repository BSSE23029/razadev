import { TYPING_TEXT } from '../data/config.js';

export class Hero {
  constructor() {
    this._initTyping();
    this._initConfetti();
    this._initLoadingExperience();
    this._preloadImages();
    this._initReducedMotion();
  }

  // ===== Typing Animation =====
  _initTyping() {
    this.textElement = document.querySelector('.typing-text');
    this.text = TYPING_TEXT;
    this.index = 0;
    if (this.textElement) this._type();
  }

  _type() {
    if (this.index < this.text.length) {
      this.textElement.textContent += this.text.charAt(this.index);
      this.index++;
      setTimeout(() => this._type(), 100);
    }
  }

  // ===== Confetti Celebration =====
  _initConfetti() {
    const ctaButton = document.querySelector('.btn-primary');
    if (ctaButton) {
      ctaButton.addEventListener('click', (e) => this._celebrate(e));
    }
  }

  _celebrate(e) {
    const colors = ['#007AFF', '#5856D6', '#32D74B', '#FF9500', '#FF453A'];
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = x + (Math.random() - 0.5) * 50 + 'px';
        confetti.style.top = y + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;

        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
      }, i * 20);
    }
  }

  // ===== Loading Experience =====
  _initLoadingExperience() {
    const spinner = document.getElementById('loadingSpinner');
    if (!spinner) return;

    spinner.classList.add('visible');

    window.addEventListener('load', () => {
      setTimeout(() => spinner.classList.remove('visible'), 300);
    });

    setTimeout(() => spinner.classList.remove('visible'), 2000);
  }

  // ===== Preload critical images =====
  _preloadImages() {
    const sources = [
      '/logos/dark/raza_logo_no_bg.png',
      '/logos/dark/raza_logo.webp',
    ];

    sources.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  // ===== Reduced Motion Support =====
  _initReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      document.documentElement.style.setProperty('--ease-default', 'linear');
      document.documentElement.style.setProperty('--ease-bounce', 'linear');
      document.documentElement.style.setProperty('--ease-swift', 'linear');
      document.documentElement.style.setProperty('--ease-smooth', 'linear');

      document.querySelectorAll('.orb, .gradient-bg, .liquid-blob').forEach((el) => {
        el.style.animation = 'none';
      });
    }
  }
}
