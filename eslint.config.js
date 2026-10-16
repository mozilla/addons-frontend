const babelParser = require('@babel/eslint-parser');
const globals = require('globals');
const amo = require('eslint-config-amo');
const amoPlugin = require('eslint-plugin-amo');
const promise = require('eslint-plugin-promise');
const testingLibrary = require('eslint-plugin-testing-library');

module.exports = [
  {
    ignores: [
      'server.babel.js',
      'dist/',
      'dist-prebuilt/',
      'coverage/',
      'src/locale/',
    ],
  },
  {
    // This defaults this to 'warn'; the old eslintrc setup left it off.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  ...amo,
  {
    // `plugin:amo/recommended` is a legacy (eslintrc) shareable config
    plugins: { amo: amoPlugin },
    rules: amoPlugin.configs.recommended.rules,
  },
  {
    languageOptions: {
      parser: babelParser,
      globals: {
        // `eslint-config-amo` only provides Node globals
        ...globals.es2021,
        CLIENT_CONFIG: 'readonly',
        document: 'readonly',
        webpackIsomorphicTools: 'readonly',
        ga: 'readonly',
        // https://flow.org/en/docs/types/utilities/#toc-objmap
        $ObjMap: 'readonly',
        // https://flow.org/en/docs/types/utilities/#toc-propertytype
        $PropertyType: 'readonly',
        // These are undocumented utilities that ship with Flow
        // https://github.com/facebook/flow/issues/875
        $ReadOnlyArray: 'readonly',
        $Rest: 'readonly',
        $Shape: 'readonly',
        $Keys: 'readonly',
        $Values: 'readonly',
        // See: https://github.com/facebook/flow/issues/1609
        SyntheticEvent: 'readonly',
        SyntheticInputEvent: 'readonly',
        // See: https://github.com/facebook/flow/issues/5627
        TimeoutID: 'readonly',
        // Standard DOM globals:
        Generator: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        Node: 'readonly',
        // This is used to send form data to the API.
        FormData: 'readonly',
        // This is used to upload files in the browser.
        File: 'readonly',
        FileReader: 'readonly',
        ProgressEvent: 'readonly',
        // Types that can be used with sendBeacon:
        BodyInit: 'readonly',
        // This is used by api/index.js.
        Response: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/core-modules': [
        // This is a workaround for: https://github.com/benmosher/eslint-plugin-import/issues/793
        'redux-saga/effects',
      ],
      'import/ignore': [
        // Because of CommonJS incompatibility, we can't
        // check for bad imports in node_modules.
        'node_modules',
        // Ignore non-JS imports.
        '\\.gif$',
        '\\.jpeg$',
        '\\.jpg$',
        '\\.mp4$',
        '\\.png$',
        '\\.scss$',
        '\\.svg$',
        '\\.webm$',
      ],
      'import/resolver': {
        node: {
          // This adds ./src for relative imports.
          moduleDirectory: ['node_modules', 'src'],
        },
      },
    },
    rules: {
      // We omit `debug` because we don't turn that on by default.
      'amo/only-log-strings': [
        'error',
        {
          methods: ['fatal', 'info', 'error', 'warn'],
        },
      ],
      'react/default-props-match-prop-types': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      // This rule is disabled because it outputs a lot of false positives, see:
      // https://github.com/benmosher/eslint-plugin-import/issues/1343
      'import/no-cycle': 'off',
      // This rule is disabled because it outputs a lot of false positives, see:
      // https://github.com/import-js/eslint-plugin-import/issues/2181
      'import/no-import-module-exports': 'off',
      'jest/expect-expect': [
        'warn',
        {
          assertFunctionNames: [
            'expect',
            // Allow the use of `sinon` in test cases.
            'sinon.assert.*',
            'mock*.verify',
            // Allow our custom matcher.
            'matchingSagaAction',
          ],
        },
      ],
      // This allows RTK's createSlice with the simple shorthand syntax.
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: ['state'],
        },
      ],
    },
  },
  {
    // Everything under `tests/`
    files: ['tests/**/*.js'],
    ...promise.configs['flat/recommended'],
    languageOptions: {
      globals: {
        ...globals.jest,
        sinon: 'readonly',
      },
    },
    settings: {
      'import/resolver': {
        node: {
          // This adds ./src and `cwd` for relative imports.
          moduleDirectory: ['node_modules', 'src', ''],
        },
      },
    },
    rules: {
      ...promise.configs['flat/recommended'].rules,
      'import/no-extraneous-dependencies': [
        'error',
        {
          // Allow dev-dependencies in this directory.
          devDependencies: true,
        },
      ],
      'promise/always-return': 'off',
      'promise/avoid-new': 'off',
      'promise/no-nesting': 'off',
    },
  },
  {
    // Enable eslint-plugin-testing-library rules only for test files.
    ...testingLibrary.configs['flat/react'],
    files: ['**/tests/**/*.js'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      'testing-library/render-result-naming-convention': 'off',
    },
  },
  {
    // bin scripts
    files: ['bin/**/*.js'],
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          // Allow dev-dependencies in this directory.
          devDependencies: true,
        },
      ],
    },
  },
  {
    // This config file itself imports dev-dependencies, so allow them here.
    files: ['eslint.config.js'],
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
];
