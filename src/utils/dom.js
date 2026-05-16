/**
 * Shorthand for `querySelector`.
 *
 * @param {string} selector
 * @param {Document|Element} root
 * @returns {Element|null}
 */
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * Shorthand for `querySelectorAll`, returned as a plain Array.
 *
 * @param {string} selector
 * @param {Document|Element} root
 * @returns {Element[]}
 */
export function qsAll(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

/**
 * Create a DOM element with optional attributes and children.
 *
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attribute map. Use `className` for class, `innerHTML` for inner HTML.
 * @param {Array<Element|string>} children - Child nodes or text strings
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") el.className = v;
    else if (k === "innerHTML") el.innerHTML = v;
    else el.setAttribute(k, v);
  });
  children.forEach((child) => {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else el.appendChild(child);
  });
  return el;
}
