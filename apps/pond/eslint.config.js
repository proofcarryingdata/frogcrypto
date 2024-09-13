/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "@repo/eslint-config/react.js",
    "@tanstack/eslint-plugin-query/flat/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
