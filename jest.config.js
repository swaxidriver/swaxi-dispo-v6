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
  // Granular coverage ratchet: raise global slightly; enforce higher targets on stable areas.
  coverageThreshold: {
    global: {
      statements: 66,
      branches: 60,
      functions: 66,
      lines: 66,
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
