// eslint-disable-next-line @typescript-eslint/no-var-requires
const baseConfig = require('../../jest.config')

module.exports = {
  ...baseConfig,
  moduleNameMapper: {},
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
}
