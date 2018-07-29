require('./src/idx')

module.exports = {
  globals: {
    testURL: 'http://localhost/',
    idx: global.idx,
    collectCoverage: true,
    'coverageReporters': ['json', 'html'],
    coverageDirectory: '/coverage',
    'collectCoverageFrom': [
      '**/*.{js,jsx}',
      '!**/node_modules/**',
      '!**/vendor/**',
    ],
  },
}
