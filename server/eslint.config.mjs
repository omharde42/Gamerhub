import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', 'public/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ── Legacy-codebase relaxations (pre-existing style) ───────────────
      // The server predates strict typing and relies on `any` in many places.
      // These rules are disabled so lint can gate NEW regressions without
      // requiring a full type-cleanup refactor up front.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // CommonJS `require()` calls are used deliberately (e.g. jsonwebtoken).
      '@typescript-eslint/no-require-imports': 'off',
      // Server code logs to the console for operational visibility.
      'no-console': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      // Deliberately empty `catch {}` blocks (best-effort optional calls).
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
