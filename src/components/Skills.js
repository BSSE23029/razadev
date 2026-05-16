export class Skills {
  constructor() {
    this._initCard3DTilt();
  }

  // ===== 3D Card Tilt Effect =====
  _initCard3DTilt() {
    const cards = document.querySelectorAll('.skill-card');

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => this._handleTiltMove(e, card));
      card.addEventListener('mouseleave', () => this._handleTiltLeave(card));
    });
  }

  _handleTiltMove(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  }

  _handleTiltLeave(card) {
    card.style.transform = '';
  }
}
