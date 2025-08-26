import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock ResizeObserver for headlessui/react
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Polyfill TextEncoder/TextDecoder for react-router (Node 20 jsdom environment)
import { TextEncoder, TextDecoder } from 'util';
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

// IndexedDB polyfill for repository tests
import 'fake-indexeddb/auto'

// Node < 17.0 fallback for structuredClone (fake-indexeddb expects it)
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (val) => {
    // Basic clone sufficient for plain object graphs used in tests
    return JSON.parse(JSON.stringify(val))
  }
}
