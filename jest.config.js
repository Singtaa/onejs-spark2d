/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/src/__mocks__/common.ts'],
    moduleNameMapper: {
        // Handle path aliases defined in tsconfig.json
        "^src/(.*)$": "<rootDir>/src/$1",
        "^onejs(.*)$": "<rootDir>/node_modules/onejs-core$1",
        "^preact(.*)$": "<rootDir>/node_modules/onejs-preact$1",
        "^Unity/Mathematics$": "<rootDir>/src/__mocks__/Unity/Mathematics.ts",
        "^System$": "<rootDir>/src/__mocks__/System/index.ts",
    },
    // Add test file patterns
    testMatch: [
        "**/__tests__/**/*.ts?(x)",
        "**/?(*.)+(spec|test).ts?(x)"
    ],
    // Setup coverage reporting
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/*.d.ts",
        "!src/test.tsx"
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
        "/dist/"
    ]
};
