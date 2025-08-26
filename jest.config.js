export default {
  rootDir: '.',
  testEnvironment: 'jsdom',
  // Include both ESM and CJS variants; Jest will load both (idempotent). This avoids transient
  // resolution issues observed on CI where one variant was intermittently reported missing.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
  ],
  // Enforce modest coverage thresholds; adjust upward over time
  coverageThreshold: {
    global: {
  // Ratcheted upward (prev 29/27/28/28). Current coverage ~43/44/46/43.
  statements: 40,
  branches: 38,
  functions: 40,
  lines: 38,
    }
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports/junit', outputName: 'jest-junit.xml' }]
  ],
}
