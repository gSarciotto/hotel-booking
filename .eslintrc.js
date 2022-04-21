module.exports = {
	root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"]
    },
    plugins: [
        "@typescript-eslint"
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
        "plugin:prettier/recommended"
    ],
    /*`
    rules: {
        "@typescript-eslint/explicit-function-return-type": ["error", {
            allowExpressions: true
        }],
    }
    */
}