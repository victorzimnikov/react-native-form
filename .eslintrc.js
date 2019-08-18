module.exports = {
    root: true,
    extends: '@react-native-community',

    rules: {
        // Typescript
        "@typescript-eslint/indent": "off",
        "@typescript-eslint/camelcase": "warn",
        "@typescript-eslint/no-empty-interface": "warn",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-object-literal-type-assertion": "warn",

        // ESLint
        "quotes": "off",
        "no-console": "error",
        "no-use-before-define": "error",

        // React hooks
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",

        // React-native
        "react-native/no-raw-text": "off",
        "react-native/no-inline-styles": "error",
        "react-native/no-unused-styles": "error",
        "react-native/no-color-literals": "error",
    }
};
