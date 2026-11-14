import expoConfig from "eslint-config-expo/flat.js";

export default [
  {
    ignores: [".expo/**", "coverage/**", "node_modules/**", "dist/**", ".claude/**"],
  },
  ...expoConfig,
  {
    files: [
      "app/**/*.ts",
      "app/**/*.tsx",
      "src/**/*.ts",
      "src/**/*.tsx",
      "__tests__/**/*.ts",
      "__tests__/**/*.tsx",
    ],
    rules: {
      complexity: ["error", 10],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
      "max-depth": ["error", 3],
      "no-console": "error",
      eqeqeq: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
    },
  },
  {
    files: ["app/**/*.tsx", "src/components/**/*.tsx"],
    rules: {
      "max-lines-per-function": ["error", { max: 110, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["__tests__/**/*.ts", "__tests__/**/*.tsx"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
];
