import { setupFocusTrap } from '../utils/events.js';

export class Navigation {
  constructor() {
    this._initMobileNav();
    this._initSmartNavbar();
    this._initSmoothScrolling();
    this._initKeyboardNav();
  }

  // ===== Mobile Navigation =====
  _initMobileNav() {
    this.menuBtn = document.getElementById('mobileMenuBtn');
    this.mobileNav = document.getElementById('mobileNav');
    this.overlay = document.getElementById('mobileOverlay');
    this.closeBtn = document.getElementById('mobileNavClose');
    this.navbarEl = document.getElementById('navbar');
    this.mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    this.isOpen = false;

    if (!this.menuBtn || !this.mobileNav || !this.overlay) {
      console.error('Mobile navigation elements not found');
      return;
    }

    this.menuBtn.addEventListener('click', () => this._toggleMenu());
    this.closeBtn?.addEventListener('click', () => this._closeMenu());
    this.overlay.addEventListener('click', () => this._closeMenu());

    this.mobileNavLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setTimeout(() => this._closeMenu(), 150);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this._closeMenu();
    });

    setupFocusTrap(this.mobileNav, () => this.isOpen);
  }

  _toggleMenu() {
    this.isOpen ? this._closeMenu() : this._openMenu();
  }

  _openMenu() {
    this.isOpen = true;
    this.menuBtn.classList.add('active');
    this.mobileNav.classList.add('active');
    this.overlay.classList.add('active');
    document.body.classList.add('menu-open');

    this.navbarEl.style.transform = 'translateY(-100%)';

    const links = this.mobileNav.querySelectorAll('.mobile-nav-links a');
    links.forEach((link, index) => {
      link.style.opacity = '0';
      link.style.transform = 'translateY(30px)';
      setTimeout(() => {
        link.style.transition = 'all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
        link.style.opacity = '1';
        link.style.transform = 'translateY(0)';
      }, 150 + index * 100);
    });

    this.closeBtn?.focus();
  }

  _closeMenu() {
    this.isOpen = false;
    this.menuBtn.classList.remove('active');
    this.mobileNav.classList.remove('active');
    this.overlay.classList.remove('active');
    document.body.classList.remove('menu-open');
    this.navbarEl.style.transform = 'translateY(0)';
    this.menuBtn.focus();
  }

  // ===== Smart Navbar (hide/show + active links) =====
  _initSmartNavbar() {
    this.navbar = document.getElementById('navbar');
    this.navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    this.sections = document.querySelectorAll('section[id]');
    this.scrollProgress = document.getElementById('scrollProgress');
    this.lastScrollY = 0;
    this.isNavVisible = true;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this._handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    this._updateActiveLink();
    this._updateScrollProgress();
  }

  _handleScroll() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - this.lastScrollY;

    if (Math.abs(scrollDelta) > 5) {
      if (scrollDelta > 0 && currentScrollY > 100) {
        this._hideNavbar();
      } else if (scrollDelta < 0) {
        this._showNavbar();
      }
    }

    this.navbar.classList.toggle('scrolled', currentScrollY > 50);
    this.lastScrollY = currentScrollY;
    this._updateActiveLink();
    this._updateScrollProgress();
  }

  _hideNavbar() {
    if (this.isNavVisible && !document.body.classList.contains('menu-open')) {
      this.isNavVisible = false;
      this.navbar.classList.add('hidden');
    }
  }

  _showNavbar() {
    if (!this.isNavVisible) {
      this.isNavVisible = true;
      this.navbar.classList.remove('hidden');
    }
  }

  _updateActiveLink() {
    const scrollPos = window.scrollY + 100;

    this.sections.forEach((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');
      const sectionName = id === 'main-content' ? 'home' : id;

      if (scrollPos >= top && scrollPos <= bottom) {
        this.navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  _updateScrollProgress() {
    if (!this.scrollProgress) return;
    const scrollPercent =
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    this.scrollProgress.style.width = `${Math.min(scrollPercent, 100)}%`;
  }

  // ===== Smooth Scrolling =====
  _initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        let target = document.getElementById(targetId);

        if (!target && targetId === 'main-content') {
          target = document.querySelector('.hero');
        }

        if (target) {
          const offsetTop = target.offsetTop - 80;
          const startPosition = window.pageYOffset;
          const distance = offsetTop - startPosition;
          const duration = Math.min(Math.abs(distance) * 0.5, 1000);
          let start = null;

          function step(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            window.scrollTo(0, startPosition + distance * easeProgress);
            if (progress < 1) requestAnimationFrame(step);
          }

          requestAnimationFrame(step);
        }
      });
    });
  }

  // ===== Keyboard Navigation =====
  _initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (!e.altKey) return;
      const map = { '1': '#main-content', '2': '#skills', '3': '#about', '4': '#github', '5': '#contact' };
      if (map[e.key]) {
        e.preventDefault();
        document.querySelector(map[e.key])?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}
