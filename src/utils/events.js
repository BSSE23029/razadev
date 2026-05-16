/**
 * Set up a focus trap within a container element.
 * @param {Element} container
 * @param {Function} isActiveFn - returns true when the trap should be active
 */
export function setupFocusTrap(container, isActiveFn) {
  const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isActiveFn()) return;

    const focusable = Array.from(container.querySelectorAll(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });
}

/**
 * Create a ripple effect on an element at the event coordinates.
 * @param {MouseEvent} e
 * @param {Element} el
 */
export function createRipple(e, el) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
    z-index: 10;
  `;

  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

/**
 * Apply a subtle magnetic hover effect to an element.
 * @param {Element} el
 * @param {number} [strength=0.1]
 */
export function applyMagneticEffect(el, strength = 0.1) {
  el.addEventListener('mousemove', (e) => {
    if (window.innerWidth < 768) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });

  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(0, 0)';
  });
}
