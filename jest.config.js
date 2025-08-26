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
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
  ],
  // Granular coverage ratchet: raise global slightly; enforce higher targets on stable areas.
  coverageThreshold: {
    global: {
      statements: 63,
      branches: 58,
      functions: 63,
      lines: 63,
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
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports/junit', outputName: 'jest-junit.xml' }]
  ],
}
