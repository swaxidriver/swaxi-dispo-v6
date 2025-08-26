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
  // Further tightened (current ~29.23/27.65/28.12/28.01 at time of change)
  statements: 29,
  branches: 27,
  functions: 28,
  lines: 28,
    }
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports/junit', outputName: 'jest-junit.xml' }]
  ],
}
