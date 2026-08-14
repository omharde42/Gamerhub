module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // The app tsconfig targets Next.js (module: esnext / bundler), which
        // jest cannot load directly — compile tests as CommonJS instead.
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          target: 'ES2017',
          jsx: 'react-jsx',
          isolatedModules: true,
        },
      },
    ],
  },
};
