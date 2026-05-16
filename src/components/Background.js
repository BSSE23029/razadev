export class Background {
  constructor() {
    this._initInteractiveBg();
    this._initParticleCursor();
  }

  // ===== Interactive Background =====
  _initInteractiveBg() {
    this.orbs = document.querySelectorAll('.orb');
    this.liquidBlobs = document.querySelectorAll('.liquid-blob');
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetX = 0;
    this.targetY = 0;
    // Bind once to avoid creating a new closure every rAF tick
    this._boundAnimate = this._animate.bind(this);

    document.addEventListener('mousemove', (e) => {
      this.targetX = e.clientX / window.innerWidth;
      this.targetY = e.clientY / window.innerHeight;
    }, { passive: true });

    this._boundAnimate();
    this._initMouseTrail();
  }

  _animate() {
    this.mouseX += (this.targetX - this.mouseX) * 0.1;
    this.mouseY += (this.targetY - this.mouseY) * 0.1;

    this.orbs.forEach((orb, index) => {
      const strength = 0.05 + index * 0.02;
      const offsetX = (this.mouseX - 0.5) * strength * 100;
      const offsetY = (this.mouseY - 0.5) * strength * 100;
      const rotation = (this.mouseX - 0.5) * 10;
      orb.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;
    });

    this.liquidBlobs.forEach((blob, index) => {
      const strength = 0.08 + index * 0.03;
      const offsetX = (this.mouseX - 0.5) * strength * 150;
      const offsetY = (this.mouseY - 0.5) * strength * 150;
      const scale = 1 + this.mouseX * 0.1;
      blob.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    });

    requestAnimationFrame(this._boundAnimate);
  }

  _initMouseTrail() {
    let trailCount = 0;
    const maxTrails = 20;

    document.addEventListener('mousemove', (e) => {
      if (trailCount >= maxTrails) return;

      trailCount++;
      const trail = document.createElement('div');
      trail.className = 'mouse-trail';
      trail.style.left = `${e.clientX - 2}px`;
      trail.style.top = `${e.clientY - 2}px`;

      document.body.appendChild(trail);

      setTimeout(() => {
        trail.remove();
        trailCount--;
      }, 1000);
    }, { passive: true });
  }

  // ===== Particle Cursor Trail =====
  _initParticleCursor() {
    this.lastTime = 0;
    this.throttle = 50;

    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - this.lastTime < this.throttle) return;
      this.lastTime = now;
      this._createCursorParticle(e.clientX, e.clientY);
    });
  }

  _createCursorParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'cursor-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px');
    particle.style.setProperty('--ty', (Math.random() - 0.5) * 100 + 'px');

    const colors = ['#007AFF', '#5856D6', '#32D74B', '#FF9500'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}
