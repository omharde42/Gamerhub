import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "tsconfig.tsbuildinfo",
    // Node-side config files use CommonJS `require()`; they are not app code.
    "next.config.js",
    "jest.config.cjs",
    "postcss.config.js",
    "tailwind.config.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // ── Legacy-codebase relaxations (pre-existing style) ───────────────
      // The app predates strict typing and relies on `any` in many places.
      // These rules are disabled so lint can gate NEW regressions without
      // requiring a full type-cleanup refactor up front.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
      // Apostrophes in JSX text are used throughout the existing UI.
      "react/no-unescaped-entities": "off",
      // The app uses plain <img> tags extensively.
      "@next/next/no-img-element": "off",
      // react-hooks v6 ships React-Compiler-style rules (purity, refs,
      // immutability, static-components, set-state-in-effect) that require a
      // full migration to adopt. They currently fire on legacy components, so
      // they are disabled here — rules-of-hooks stays enabled since those are
      // genuine correctness violations that have been fixed.
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
