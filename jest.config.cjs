/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)\\.js$': '<rootDir>/api/$1',
    '^@/(.*)$': '<rootDir>/api/$1',
    '^@controllers/(.*)$': '<rootDir>/api/controllers/$1',
    '^@services/(.*)$': '<rootDir>/api/services/$1',
    '^@dtos/(.*)$': '<rootDir>/api/dtos/$1',
    '^@utils/(.*)$': '<rootDir>/api/utils/$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json'
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/test/**/*.test.ts'],
  rootDir: '.',
  setupFiles: [],
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

module.exports = config; 