module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended"
  ],
  //"installedESLint": true,
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module"
  },
  // "jsx-no-duplicate-props": [
  //   "error", { "ignoreCase": true }
  // ],
  "plugins": [
    "classes",
  ],
  "globals": {
    "winston": true,
    "idx": true,
    "process": true,
  },
  "parser": "babel-eslint",
  "rules": {
    "object-curly-spacing": ["error", "always"],
    "eol-last": "error",
    "classes/space": 2,
    "classes/name": [2, "class", "method"],
    "classes/constructor": 2,
    "classes/super": 2,
    "classes/style": 2,
    "strict": 0,
    "prefer-const": "error",
    "brace-style": "error",
    "new-cap": ["error",
      { "newIsCap": true }
    ],
    "block-spacing": "error",
    "keyword-spacing":"error",
    "no-irregular-whitespace": "error",
    "no-trailing-spaces": ["error"],
    "space-in-parens": ["error", "never"],
    "space-unary-ops": "error",
    "space-before-function-paren": ["error", "never"],
    "no-multi-spaces": "error",
    "comma-spacing": ["error", { "before": false, "after": true }],
    "computed-property-spacing": ["error", "never"],
    "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
    "no-lonely-if": "error",
    "no-mixed-spaces-and-tabs": "error",
    "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1, "maxBOF": 1 }],
    "space-infix-ops": "error",
    "no-console":  ["error", { allow: ["warn", "error", "log"] }],
    "indent": [
      "error",
      2,
      { "SwitchCase": 1 }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "never"
    ],
    "comma-dangle": [
      "error",
      "always-multiline"
    ],
    "arrow-spacing": [
      "error"
    ],

  }
};

