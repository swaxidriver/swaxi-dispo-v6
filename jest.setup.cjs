// Fallback duplicate so CI can't claim missing setup file due to ESM resolution edge.
require('@testing-library/jest-dom');

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// IndexedDB polyfill (CommonJS fallback)
require('fake-indexeddb/auto');

// structuredClone polyfill for older Node in test env
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}
