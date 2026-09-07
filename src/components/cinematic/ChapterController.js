export class ChapterController {
  constructor({ reducedMotion = false } = {}) {
    this.reducedMotion = reducedMotion;
    this.chapters = [...document.querySelectorAll('.chapter')];
    this.navigation = [...document.querySelectorAll('.chapter-nav a')];
    this.primaryNavigation = [...document.querySelectorAll('.site-header nav a')];
    this.mobileMenu = document.getElementById('mobileMenu');
    this.menuButton = document.getElementById('menuButton');
    this.menuClose = document.getElementById('menuClose');
    this.menuTrigger = null;
    this.activeChapter = null;
    this.activationFrame = 0;
    this.enterTimers = new Map();
    this.leaveTimers = new Map();
    this.transitionTimer = 0;
    this.transitionToken = 0;
    this.boundViewportChange = () => this.scheduleActivation();
    this.observe();
    window.addEventListener('scroll', this.boundViewportChange, { passive: true });
    window.addEventListener('resize', this.boundViewportChange, { passive: true });
    this.bindAnchors();
    this.bindMenu();
    this.activate(this.chapters[0]);
  }

  observe() {
    if (!('IntersectionObserver' in window)) return;
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) this.scheduleActivation();
    }, { rootMargin: '-28% 0px -28%', threshold: [0, 0.15, 0.45] });
    this.chapters.forEach(chapter => this.observer.observe(chapter));
  }

  scheduleActivation() {
    if (this.activationFrame) return;
    this.activationFrame = requestAnimationFrame(() => {
      this.activationFrame = 0;
      const viewportCenter = innerHeight / 2;
      const activeChapter = this.chapters
        .map(chapter => ({ chapter, distance: Math.abs(chapter.getBoundingClientRect().top + chapter.getBoundingClientRect().height / 2 - viewportCenter) }))
        .sort((a, b) => a.distance - b.distance)[0]?.chapter;
      if (activeChapter) this.activate(activeChapter);
    });
  }

  activate(activeChapter) {
    if (!activeChapter || activeChapter === this.activeChapter) return;
    const previousChapter = this.activeChapter;
    const transitionToken = ++this.transitionToken;
    this.activeChapter = activeChapter;
    if (this.transitionTimer) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = 0;
    }
    document.body.dataset.chapter = activeChapter.dataset.chapter || activeChapter.id;
    document.dispatchEvent(new CustomEvent('raza:chapterchange', {
      detail: {
        id: activeChapter.id,
        chapter: activeChapter.dataset.chapter || activeChapter.id,
        previousId: previousChapter?.id || null,
      },
    }));
    this.chapters.forEach(chapter => {
      this.clearChapterTimer(this.leaveTimers, chapter);
      if (chapter !== activeChapter) {
        this.clearChapterTimer(this.enterTimers, chapter);
      }
      chapter.classList.remove('is-leaving');
      if (chapter === activeChapter) {
        chapter.classList.remove('is-active');
        chapter.classList.add('is-entering');
        chapter.dataset.chapterState = 'entering';
      } else {
        chapter.classList.remove('is-active', 'is-entering');
        chapter.dataset.chapterState = 'idle';
      }
    });
    if (previousChapter) {
      previousChapter.classList.add('is-leaving');
      previousChapter.dataset.chapterState = 'leaving';
      const leaveTimer = window.setTimeout(() => {
        previousChapter.classList.remove('is-leaving');
        previousChapter.dataset.chapterState = 'idle';
        this.leaveTimers.delete(previousChapter);
      }, this.reducedMotion ? 0 : 760);
      this.leaveTimers.set(previousChapter, leaveTimer);
    }
    const beginEnter = () => {
      if (transitionToken !== this.transitionToken) return;
      this.transitionTimer = 0;
      activeChapter.classList.add('is-active');
      activeChapter.dataset.chapterState = 'active';
      const enterTimer = window.setTimeout(() => {
        activeChapter.classList.remove('is-entering');
        this.enterTimers.delete(activeChapter);
      }, this.reducedMotion ? 0 : 820);
      this.enterTimers.set(activeChapter, enterTimer);
    };
    if (!previousChapter || this.reducedMotion) beginEnter();
    else this.transitionTimer = window.setTimeout(beginEnter, 140);
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

  clearChapterTimer(timers, chapter) {
    const timer = timers.get(chapter);
    if (!timer) return;
    window.clearTimeout(timer);
    timers.delete(chapter);
  }

  bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: this.reducedMotion ? 'auto' : 'smooth', block: 'start' });
      this.closeMenu();
    }));
  }

  bindMenu() {
    if (!this.mobileMenu || !this.menuButton) return;
    this.menuButton.addEventListener('click', () => {
      if (this.mobileMenu.open) this.closeMenu();
      else {
        this.menuTrigger = this.menuButton;
        if (typeof this.mobileMenu.showModal === 'function') this.mobileMenu.showModal();
        else this.mobileMenu.setAttribute('open', '');
        this.menuButton.setAttribute('aria-expanded', 'true');
        this.menuClose?.focus();
      }
    });
    this.menuClose?.addEventListener('click', () => this.closeMenu());
    this.mobileMenu.addEventListener('close', () => {
      this.menuButton.setAttribute('aria-expanded', 'false');
      this.menuTrigger?.focus();
    });
  }

  closeMenu() {
    if (!this.mobileMenu?.open) return;
    if (typeof this.mobileMenu.close === 'function') this.mobileMenu.close();
    else this.mobileMenu.removeAttribute('open');
    this.menuButton?.setAttribute('aria-expanded', 'false');
  }

  destroy() {
    this.observer?.disconnect();
    if (this.activationFrame) cancelAnimationFrame(this.activationFrame);
    if (this.transitionTimer) window.clearTimeout(this.transitionTimer);
    this.enterTimers.forEach(timer => window.clearTimeout(timer));
    this.leaveTimers.forEach(timer => window.clearTimeout(timer));
    this.enterTimers.clear();
    this.leaveTimers.clear();
    window.removeEventListener('scroll', this.boundViewportChange);
    window.removeEventListener('resize', this.boundViewportChange);
  }
}
