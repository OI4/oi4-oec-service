const baseConfig = require('../../jest.config')

module.exports = {
  ...baseConfig,
  moduleNameMapper: {},
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
}
