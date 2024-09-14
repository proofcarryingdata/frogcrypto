/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@frogcrypto/eslint-config/react.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
