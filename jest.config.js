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
  // Incrementally raised thresholds (current ~29/27.6/28.1/28.0 at time of change)
  statements: 28,
  branches: 24,
  functions: 27,
  lines: 27,
    }
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports/junit', outputName: 'jest-junit.xml' }]
  ],
}
