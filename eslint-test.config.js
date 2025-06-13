export default [
  {
    files: ['**/*.{js,ts,tsx}', '!**/dist/**'],
    ignores: ['**/dist/**'],
    rules: {
      'no-console': 'error',
    },
  },
];
