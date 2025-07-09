const nodePlugin = require("eslint-plugin-n");

module.exports = [
  nodePlugin.configs["flat/recommended-script"],
  {
    ignores: ["migrations/**", "scripts/**", "test/**", "tests/**", "node_modules/**"]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        global: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly"
      }
    },
    rules: {
      "n/exports-style": ["error", "module.exports"],
      "n/prefer-global/process": ["error", "always"],
      "n/prefer-global/console": ["error", "always"],
      "n/prefer-global/buffer": ["error", "always"],
      "n/no-process-exit": "warn",
      "n/no-deprecated-api": "error",
      "no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "no-console": "off", // Allow console statements in Node.js backend
      "no-process-env": "off" // Allow process.env usage in backend
    }
  }
];