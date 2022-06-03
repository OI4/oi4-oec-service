module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: false,
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx}',
    '**/__test__/**/*.test.{ts,tsx}',
    '!**/*.d.{ts,tsx}',
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
};
