require('./src/idx')

module.exports = {
  globals: {
    idx: global.idx,
    collectCoverage: true,
    coverageDirectory: '/coverage',
    'collectCoverageFrom': [
      '**/*.{js,jsx}',
      '!**/node_modules/**',
      '!**/vendor/**',
    ],
  },
}
