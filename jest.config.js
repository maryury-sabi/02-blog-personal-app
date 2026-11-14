module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/utils/**/*.ts",
    "src/sensors/barometerUtils.ts",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
};
