import js from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/drizzle/migrations/**',
      '**/openapi.json',
      '**/tsconfig.tsbuildinfo',
      '**/storybook-static/**',
      '**/public/mockServiceWorker.js',
      '**/src/api/types.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
      'one-var': ['error', 'never'],
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    // Experiment sandbox: prototypes are throwaway and are allowed to be
    // scrappier than production modules. Every other rule still applies.
    files: ['components/*/src/experiment/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // One-way boundary: experiments may reuse production code, production code
    // may not depend on experiment internals. The `src/experiment` barrel is
    // the only sanctioned seam, so deleting an experiment can never break the
    // production app.
    files: ['components/*/src/**/*.{ts,tsx}'],
    ignores: ['components/*/src/experiment/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/experiment/*', '**/experiment/*/**'],
              message:
                'Import experiments through the src/experiment barrel only; production code must not depend on experiment internals.',
            },
          ],
        },
      ],
    },
  },
];
