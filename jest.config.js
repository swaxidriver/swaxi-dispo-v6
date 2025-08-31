export default {
  rootDir: '.',
  testEnvironment: 'jsdom',
  // Include both ESM and CJS variants; Jest will load both (idempotent). This avoids transient
  // resolution issues observed on CI where one variant was intermittently reported missing.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  '^firebase/firestore$': '<rootDir>/src/tests/mocks/firebaseFirestore.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  // Coverage threshold aiming towards ≥80% goal (progressive improvement)
  // Current: ~63% lines, target: meaningful step toward 80%
  coverageThreshold: {
    global: {
      statements: 75,  // ~13% improvement from current 61.85%
      branches: 65,    // ~11% improvement from current 53.86%
      functions: 70,   // ~11% improvement from current 58.55%
      lines: 75,       // ~12% improvement from current 63.07%
    },
    // Stricter for core pure logic (utils, services generation) – easier to keep high
    './src/utils/': {
      statements: 80,
      branches: 80,
      functions: 90,
      lines: 80,
    },
    './src/services/shiftGenerationService.js': {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
    // SharePoint service has good test coverage for integration logic
    './src/services/sharePointService.js': {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60,
    },
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports/junit', outputName: 'jest-junit.xml' }]
  ],
}
