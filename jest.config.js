module.exports = {
  preset: 'ts-jest',
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: false,
  collectCoverageFrom: [
    '<rootDir>/**/*.{ts,tsx}',
    '!<rootDir>/__test__/**/*.{ts,tsx}',
    '!<rootDir>/**/*.test.{ts,tsx}',
    '!<rootDir>/**/*.spec.{ts,tsx}',
    '!<rootDir>/src/*.d.{ts,tsx}',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'text', 'html', 'json'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx', 'node'],
  setupFiles: ['<rootDir>/.jest/setEnvironment.js'],
  reporters: ["default", "jest-junit"],
};
