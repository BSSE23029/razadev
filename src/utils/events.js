import { qsAll } from "./dom.js";

/** Selector string covering all keyboard-focusable element types. */
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Attach smooth-scroll behaviour to all anchor links that point to an
 * in-page id (href starts with "#").
 *
 * @param {number} offset - Pixels to subtract from the target's offsetTop (default 80)
 */
export function smoothScroll(offset = 80) {
  qsAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      let target = document.getElementById(targetId);

      if (!target && targetId === "main-content") {
        target = document.querySelector(".hero");
      }

      if (target) {
        const offsetTop = target.offsetTop - offset;
        const startPosition = window.pageYOffset;
        const distance = offsetTop - startPosition;
        const duration = Math.min(Math.abs(distance) * 0.5, 1000);
        let start = null;

        function step(timestamp) {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          window.scrollTo(0, startPosition + distance * easeProgress);

          if (progress < 1) {
            requestAnimationFrame(step);
          }
        }

        requestAnimationFrame(step);
      }
    });
  });
}

/**
 * Trap keyboard focus inside `containerEl` while it is considered "open".
 * The caller is responsible for tracking open/closed state via `isOpenFn`.
 *
 * @param {Element} containerEl - The element that should trap focus
 * @param {() => boolean} isOpenFn - Returns `true` when the trap is active
 */
export function setupFocusTrap(containerEl, isOpenFn) {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && isOpenFn()) {
      const focusable = containerEl.querySelectorAll(FOCUSABLE_SELECTOR);
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });
}

/**
 * Create and append a ripple effect element to `element` at the position of
 * `event`. The ripple removes itself after the animation completes.
 *
 * Also injects the required `@keyframes ripple` CSS once per page load.
 *
 * @param {MouseEvent} event
 * @param {Element} element
 */
export function createRipple(event, element) {
  const ripple = document.createElement("div");
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

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

  element.style.position = "relative";
  element.style.overflow = "hidden";
  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);

  // Inject keyframe styles once
  if (!document.querySelector("#rippleStyles")) {
    const rippleStyles = `
      @keyframes ripple {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.id = "rippleStyles";
    styleSheet.textContent = rippleStyles;
    document.head.appendChild(styleSheet);
  }
}

/**
 * Apply a subtle magnetic hover effect to the provided elements.
 * On `mousemove` the element shifts slightly toward the cursor;
 * on `mouseleave` it resets to its original position.
 *
 * Skipped on viewports narrower than 768 px (touch devices).
 *
 * @param {Element[]|NodeList} elements
 */
export function applyMagneticEffect(elements) {
  elements.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      if (window.innerWidth < 768) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const moveX = x * 0.1;
      const moveY = y * 0.1;

      el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0, 0)";
    });
  });
}
