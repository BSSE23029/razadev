export class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById('themeToggle');
    this.themeTransition = document.getElementById('themeTransition');
    this.currentTheme = this.getSavedTheme() || this.getSystemTheme();
    this.mouseX = 50;
    this.mouseY = 50;
    this.init();
  }

  getSavedTheme() {
    return this.memoryTheme || null;
  }

  saveTheme(theme) {
    this.memoryTheme = theme;
  }

  getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.updateThemeIcon();

    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 100;
      this.mouseY = (e.clientY / window.innerHeight) * 100;
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.memoryTheme) {
        this.currentTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.updateThemeIcon();
        this.announceThemeChange();
      }
    });

    this.themeToggle.addEventListener('click', (e) => {
      this.toggleTheme(e);
    });
  }

  toggleTheme(e) {
    const rect = this.themeToggle.getBoundingClientRect();
    this.mouseX = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    this.mouseY = ((rect.top + rect.height / 2) / window.innerHeight) * 100;

    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.saveTheme(this.currentTheme);

    this.animateThemeTransition(() => {
      this.applyTheme(this.currentTheme);
      this.updateThemeIcon();
      this.announceThemeChange();
    });

    this.createThemeParticles(e);
  }

  animateThemeTransition(callback) {
    this.themeTransition.style.setProperty('--mouse-x', `${this.mouseX}%`);
    this.themeTransition.style.setProperty('--mouse-y', `${this.mouseY}%`);

    this.themeTransition.classList.add('active');

    setTimeout(() => {
      callback();
    }, 300);

    setTimeout(() => {
      this.themeTransition.classList.remove('active');
    }, 600);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--is-dark', theme === 'dark' ? '1' : '0');

    // Notify other components via custom event
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  updateThemeIcon() {
    const icon = this.themeToggle.querySelector('i');
    if (this.currentTheme === 'dark') {
      icon.className = 'fas fa-sun';
      this.themeToggle.setAttribute('title', 'Switch to light theme');
    } else {
      icon.className = 'fas fa-moon';
      this.themeToggle.setAttribute('title', 'Switch to dark theme');
    }
  }

  announceThemeChange() {
    const liveRegion = document.getElementById('liveRegion');
    if (liveRegion) {
      liveRegion.textContent = `Theme changed to ${this.currentTheme} mode`;
    }
  }

  createThemeParticles(e) {
    const button = this.themeToggle;
    const rect = button.getBoundingClientRect();

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      const tx = Math.random() * 150 - 75;
      const ty = Math.random() * 150 - 75;
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: var(--primary);
        border-radius: 50%;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
        pointer-events: none;
        z-index: 10000;
        animation: themeParticle ${0.8 + Math.random() * 0.4}s ease-out forwards;
        animation-delay: ${i * 0.05}s;
        --tx: ${tx}px;
        --ty: ${ty}px;
      `;

      document.body.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1200);
    }
  }
}
