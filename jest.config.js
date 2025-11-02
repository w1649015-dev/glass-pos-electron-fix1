module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^electron$': '<rootDir>/__mocks__/electron.js'
  }
};