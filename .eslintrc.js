module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  extends: [
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  parserOptions: {
    ecmaVersion: 2017, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    quotes: ["error", "single"],
    "@typescript-eslint/camelcase": "off", // is deprecated in favor of @typescript-eslint/naming-convention
    "@typescript-eslint/interface-name-prefix": "off", // is deprecated in favor of @typescript-eslint/naming-convention
    "@typescript-eslint/naming-convention": [
      "error",
      { selector: "variableLike", format: ["camelCase", "snake_case"] },
    ],
    "no-useless-concat": "error",
    "prefer-template": "error",
    "template-curly-spacing": ["error", "never"],
  },
};
