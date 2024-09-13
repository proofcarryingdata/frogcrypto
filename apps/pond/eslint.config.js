/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "@repo/eslint-config/react.js",
    "plugin:@tanstack/eslint-plugin-query/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
