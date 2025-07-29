module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/app.ts',
        '!src/db/**',
        '!src/config/**',
        '!src/types/**',
        '!src/utils/**',
        '!src/constants/**',
        '!src/middlewares/**',
        '!src/routes/**'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ]
}; 