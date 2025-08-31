// Allow temporarily bypassing strict coverage enforcement locally while building up tests.
// Set COVERAGE_ENFORCE=true in CI to re-enable thresholds.
const enforce = process.env.COVERAGE_ENFORCE === "true";

const coverageThreshold = enforce
  ? {
      global: {
        statements: 75,
        branches: 65,
        functions: 70,
        lines: 75,
      },
      "./src/utils/": {
        statements: 80,
        branches: 80,
        functions: 90,
        lines: 80,
      },
      "./src/services/shiftGenerationService.js": {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
      "./src/services/sharePointService.js": {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    }
  : undefined;

export default {
  rootDir: ".",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "<rootDir>/jest.setup.cjs"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^firebase/firestore$": "<rootDir>/src/tests/mocks/firebaseFirestore.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/main.jsx",
    "!src/**/*.test.{js,jsx,ts,tsx}",
    "!src/**/*.spec.{js,jsx,ts,tsx}",
  ],
  coverageThreshold,
  reporters: [
    "default",
    [
      "jest-junit",
      { outputDirectory: "reports/junit", outputName: "jest-junit.xml" },
    ],
  ],
};
