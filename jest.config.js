  module.exports = {
  verbose: true,
  testURL: 'http://localhost/',
  "collectCoverageFrom": [
    "**/*.{ts,tsx}",
    "!dist/**/*"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?)$",

  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  // collectCoverage: true,
  // 'coverageReporters': ['json', 'html'],
  coverageDirectory: 'coverage',
  'collectCoverageFrom': [
    '**/*.{ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/*.d.{ts}'
  ],
  setupFiles: [
    './src/idx.ts',
    './src/jestlogger.ts',
  ],
  globals: {
    idx: global.idx,
  },
}
