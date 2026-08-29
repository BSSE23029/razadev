export class ThemeController {
  constructor() {
    this.root = document.documentElement;
    this.button = document.getElementById('themeToggle');
    this.sync();
    this.button.addEventListener('click', () => this.toggle());
  }

  sync() {
    const current = this.root.dataset.theme;
    this.button.setAttribute('aria-label', `Switch to ${current === 'light' ? 'dark' : 'light'} theme`);
  }

  toggle() {
    const theme = this.root.dataset.theme === 'light' ? 'dark' : 'light';
    this.root.dataset.theme = theme;
    localStorage.setItem('raza-theme', theme);
    this.sync();
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }
}
