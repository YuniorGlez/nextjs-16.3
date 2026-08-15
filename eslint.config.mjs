import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Security rules: no-eval, no-new-func, unsafe-regex, etc.
  security.configs.recommended,
  // Maintainability: límites de tamaño y complejidad para evitar ficheros/funciones
  // "monstruo". Índices calibrados para el CMS admin actual (LandingBuilder ~346 líneas,
  // complejidad ~21) — bajarlos cuando el código se refactorice.
  {
    name: "maintainability/size-limits",
    rules: {
      complexity: ["warn", { max: 16 }],
      "max-lines": ["warn", { max: 350, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
      "max-depth": ["warn", { max: 4 }],
      "max-params": ["warn", { max: 5 }],
    },
  },
  // Architectural boundaries: dependencies flow downwards (app → components → lib).
  // src/components and src/lib must never import from src/app.
  {
    name: "boundaries/no-app-imports",
    files: ["src/components/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*"],
              message:
                "src/app is the top layer; components and lib must not import from it.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
