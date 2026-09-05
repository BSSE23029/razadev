export class ChapterController {
  constructor({ reducedMotion = false } = {}) {
    this.reducedMotion = reducedMotion;
    this.chapters = [...document.querySelectorAll('.chapter')];
    this.navigation = [...document.querySelectorAll('.chapter-nav a')];
    this.primaryNavigation = [...document.querySelectorAll('.site-header nav a')];
    this.mobileMenu = document.getElementById('mobileMenu');
    this.menuButton = document.getElementById('menuButton');
    this.observe();
    this.bindAnchors();
    this.bindMenu();
    this.activate(this.chapters[0]);
  }

  observe() {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) this.activate(entry.target);
      });
    }, { rootMargin: '-35% 0px -35%', threshold: 0 });
    this.chapters.forEach(chapter => this.observer.observe(chapter));
  }

  activate(activeChapter) {
    this.chapters.forEach(chapter => chapter.classList.toggle('is-active', chapter === activeChapter));
    this.navigation.forEach(link => {
      const isActive = link.dataset.chapter === activeChapter.dataset.chapter;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    this.primaryNavigation.forEach(link => {
      const isActive = link.getAttribute('href') === `#${activeChapter.id}` || (activeChapter.id === 'surface' && link.getAttribute('href') === '#work');
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: this.reducedMotion ? 'auto' : 'smooth' });
      this.closeMenu();
    }));
  }

  bindMenu() {
    if (!this.mobileMenu || !this.menuButton) return;
    this.menuButton.addEventListener('click', () => {
      if (this.mobileMenu.open) this.closeMenu();
      else {
        if (typeof this.mobileMenu.showModal === 'function') this.mobileMenu.showModal();
        else this.mobileMenu.setAttribute('open', '');
        this.menuButton.setAttribute('aria-expanded', 'true');
      }
    });
    document.getElementById('menuClose')?.addEventListener('click', () => this.closeMenu());
    this.mobileMenu.addEventListener('close', () => this.menuButton.setAttribute('aria-expanded', 'false'));
  }

  closeMenu() {
    if (!this.mobileMenu?.open) return;
    if (typeof this.mobileMenu.close === 'function') this.mobileMenu.close();
    else this.mobileMenu.removeAttribute('open');
    this.menuButton?.setAttribute('aria-expanded', 'false');
  }
}
