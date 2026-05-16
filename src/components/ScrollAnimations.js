export class ScrollAnimations {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };
    this.init();
  }

  init() {
    // Fade-in sections
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, this.observerOptions);

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    // Skills cards stagger animation
    const skillsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.skill-card');
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add('animate-in');
                setTimeout(() => {
                  card.style.transform = 'translateY(0) scale(1.02)';
                  setTimeout(() => {
                    card.style.transform = 'translateY(0) scale(1)';
                  }, 150);
                }, 200);
              }, index * 120);
            });
            skillsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    const skillsSection = document.querySelector('.skills');
    if (skillsSection) skillsObserver.observe(skillsSection);

    // Timeline stagger animation
    const timelineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.timeline-item');
            items.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add('visible');
                setTimeout(() => {
                  item.style.setProperty('--pulse', '1');
                }, 300);
              }, index * 250);
            });
            timelineObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll('.timeline').forEach((el) => timelineObserver.observe(el));

    // Tech stack wave animation
    const techObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.tech-item');
            items.forEach((item, index) => {
              item.style.opacity = '0';
              item.style.transform = 'translateY(30px) scale(0.8)';
              setTimeout(() => {
                item.style.transition = 'all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0) scale(1)';
              }, index * 80);
            });
            techObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    const techStack = document.querySelector('.tech-stack');
    if (techStack) techObserver.observe(techStack);
  }
}
