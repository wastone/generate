const path = require('path')
const resolve = _path => path.resolve(__dirname, _path)
const DOMGlobals = ['window', 'document']
const NodeGlobals = ['module', 'require']


module.exports = {
  env: {
    browser: false,
    es6: true
  },
  parser: '@typescript-eslint/parser', // 配置ts解析器
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ['*.ts', '*.tsx']
    }
  ],
  parserOptions: {
    project: resolve('./tsconfig.json'),
    tsconfigRootDir: resolve('./'),
    sourceType: 'module'
  },
  rules: {
    'indent': ['off', 2],
    'no-unused-vars': 'error',
    'no-restricted-globals': ['off', ...DOMGlobals],
    'no-console': 'off',
  },
  ignorePatterns: ["rollup.config.js", "types/*", "lib", "example/**/*"]
}