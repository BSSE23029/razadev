export class ChapterController {
  constructor({ reducedMotion = false } = {}) {
    this.reducedMotion = reducedMotion;
    this.chapters = [...document.querySelectorAll('.chapter')];
    this.navigation = [...document.querySelectorAll('.chapter-nav a')];
    this.observe();
    this.bindAnchors();
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
    this.navigation.forEach(link => link.classList.toggle('is-active', link.dataset.chapter === activeChapter.dataset.chapter));
  }

  bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: this.reducedMotion ? 'auto' : 'smooth' });
    }));
  }
}
