// eslint-disable-next-line @typescript-eslint/no-var-requires
const baseConfig = require('../../.eslintrc.js')

module.exports = {
  ...baseConfig,
  parserOptions: {
    ecmaVersion: 'latest',
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  root: true,
  env: {
    node: true,
    jest: true,
    browser: true,
    es2021: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
