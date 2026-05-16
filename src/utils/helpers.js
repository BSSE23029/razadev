/**
 * Convert a Date to human-readable relative time ("2 hours ago", "3 days ago").
 *
 * @param {Date} date
 * @returns {string}
 */
export function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

/**
 * Returns a debounced version of `fn` that delays invocation until after
 * `delay` ms have elapsed since the last call.
 *
 * @param {Function} fn
 * @param {number} delay - milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Returns a throttled version of `fn` that invokes at most once per `limit` ms.
 *
 * @param {Function} fn
 * @param {number} limit - milliseconds
 * @returns {Function}
 */
export function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}
