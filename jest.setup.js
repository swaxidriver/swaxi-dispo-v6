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
