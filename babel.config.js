module.exports = {
  'presets': [
    [
      // https://babeljs.io/docs/en/babel-preset-env
      '@babel/preset-env',
      {
        // Allow `@babel/preset-env` to import polyfills from core-js as needed.
        'useBuiltIns': 'usage',
        // Help `@babel/preset-env` make use of the correct core-js polyfills.
        'corejs': '3.22',
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
      }
    ]
  ],
  'plugins': [
    [
      // Though `@babel/plugin-proposal-class-properties` is already included
      // in `@babel/preset-env`, we include it specifically to be able to set
      // `loose` mode on it, without enabling it for all the plugins included
      // in `@babel/preset-env`.
      '@babel/plugin-proposal-class-properties',
      // Without `loose`, the transformation uses `Object.defineProperty` which
      // obeys the spec more, but makes the bundle unnecessarily larger.
      { 'loose': true },
    ],
  ],
  'env': {
    'test': {
      'plugins': ['dynamic-import-node'],
    },
  },
};
