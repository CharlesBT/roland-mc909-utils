export default withNuxt({
  ignores: ['.cache', '.temp*', 'logs'],
  rules: {
    // eslint best-practices
    'array-callback-return': [
      'error',
      {
        allowImplicit: false,
        checkForEach: false,
      },
    ],
    'block-scoped-var': 'error',
    'consistent-return': 'off',
    complexity: ['off', 11],
    eqeqeq: ['error', 'smart'],
    'no-alert': 'warn',
    'no-case-declarations': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-with': 'error',
    'no-void': 'error',
    'no-useless-escape': 'off',
    'vars-on-top': 'error',
    'require-await': 'off',
    'no-return-assign': 'off',
    'max-statements-per-line': ['error', { max: 1 }],

    /* eslint */
    camelcase: 'off',
    'no-unused-vars': 'off',
    'no-var': 'warn',
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    'new-cap': 'off',
    'no-undef': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
    'no-lone-blocks': 'error',
    'prefer-promise-reject-errors': 'error',
    'no-await-in-loop': 'warn', // point for optimization with Promise.all https://eslint.org/docs/rules/no-await-in-loop

    /* @typescript-eslint/eslint-plugin */
    '@typescript-eslint/no-unused-vars': 'off',
    // '@typescript-eslint/no-use-before-define': [
    //   'error',
    //   { functions: false, classes: false, variables: true },
    // ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    /* eslint-plugin-import-x */
    'import-x/no-unresolved': 'error',
    'import-x/no-mutable-exports': 'error',
    'import-x/no-named-as-default': 'off',
    'import-x/no-named-as-default-member': 'off',
  },
  // your custom flat configs go here, for example:
  // {
  //   files: ['**/*.ts', '**/*.tsx'],
  //   rules: {
  //     'no-console': 'off' // allow console.log in TypeScript files
  //   }
  // },
  // {
  //   ...
  // }
})
