module.exports = {
  // https://babeljs.io/docs/en/assumptions
  'assumptions': {
    'setPublicClassFields': true,
  },
  'presets': [
    [
      // https://babeljs.io/docs/en/babel-preset-env
      '@babel/preset-env',
      {
        // Allow `@babel/preset-env` to import polyfills from core-js as needed.
        'useBuiltIns': 'usage',
        // Help `@babel/preset-env` make use of the correct core-js polyfills.
        'corejs': '3.23',
        // Perform transforms closest to targets defined in `.browserslistrc`.
        'bugfixes': true,
      },
    ],
    '@babel/preset-flow',
    // https://babeljs.io/docs/en/babel-preset-react/
    [
      '@babel/preset-react',
      {
        // When spreading props, use inline object with spread elements directly
        // instead of Babel's extend helper or Object.assign.
        'useBuiltIns': true,
        // FIXME: Upgrade to React 17+
        // Cannot use React 17 new, lighter, faster JSX Transform
        // https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
        // https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#motivation
        // 'runtime': 'automatic',
      },
    ],
  ],
  'plugins': [
    [
      'i18next-extract',
      {
        // 'keyAsDefaultValue': ['en_US'],
        // 'keyAsDefaultValueForDerivedKeys': true,
        'discardOldKeys': true,
        'keySeparator': null,
        'locales': ['en_US'],
        'nsSeparator': null,
        'defaultNs': 'amo',
        'compatibilityJSON': 'v4',
        'tFunctionNames': ['gettext'],
        'outputPath': 'locale/{{locale}}/LC_MESSAGES/{{ns}}.json',
      },
    ],
  ],
  'env': {
    'test': {
      'plugins': ['dynamic-import-node'],
    },
  },
};
