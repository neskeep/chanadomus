import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // Ignore shadcn-vue generated UI components
    ignores: ['app/components/ui/**'],
  },
  {
    rules: {
      // Allow optional props without defaults (common in Vue + TS)
      'vue/require-default-prop': 'off',
      // Warn on unused vars but allow underscore prefix
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    // Relaxed rules for test files
    files: ['tests/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
