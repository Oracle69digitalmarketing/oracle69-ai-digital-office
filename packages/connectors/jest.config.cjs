module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  injectGlobals: true,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@oracle69/shared(|/.*)$': '<rootDir>/../../../shared/src/$1',
    '^@oracle69/memory(|/.*)$': '<rootDir>/../../../memory/src/$1',
    '^@oracle69/runtime(|/.*)$': '<rootDir>/../../runtime/src/$1',
    '^@oracle69/platform-contracts(|/.*)$': '<rootDir>/../../platform-contracts/src/$1',
  },
};
