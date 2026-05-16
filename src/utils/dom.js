/**
 * Shorthand querySelector.
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element|null}
 */
export function qs(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Shorthand querySelectorAll returning an Array.
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element[]}
 */
export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Create an element with optional attributes and inner HTML.
 * @param {string} tag
 * @param {Object} [attrs={}]
 * @param {string} [html='']
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, html = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (html) el.innerHTML = html;
  return el;
}
