require('./src/idx')

module.exports = {
  verbose: true,
  testURL: 'http://localhost/',
  // collectCoverage: true,
  // 'coverageReporters': ['json', 'html'],
  coverageDirectory: 'coverage',
  // 'collectCoverageFrom': [
  //   '**/*.{js,jsx}',
  //   '!**/node_modules/**',
  //   '!**/vendor/**',
  // ],
  globals: {
    idx: global.idx,
  },
}
