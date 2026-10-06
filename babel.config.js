module.exports = {
  // https://babeljs.io/docs/en/assumptions
  'assumptions': {
    'setPublicClassFields': true,
  },
  'presets': [
    // https://babeljs.io/docs/en/babel-preset-env
    '@babel/preset-env',
    '@babel/preset-flow',
    // https://babeljs.io/docs/en/babel-preset-react/
    '@babel/preset-react',
    // FIXME: Upgrade to React 17+
    // Cannot use React 17 new, lighter, faster JSX Transform
    // https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
    // https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#motivation
    // 'runtime': 'automatic',
  ],
  'plugins': [
    // Inject core-js polyfills where they are used, based on the targets
    // defined in `.browserslistrc`.
    // https://babeljs.io/docs/babel-plugin-polyfill-corejs3
    [
      'babel-plugin-polyfill-corejs3',
      {
        // `usage-global` imports polyfills as global side effects where a
        // feature is used, matching the polyfilling done for an app (rather
        // than a library's `usage-pure`).
        'method': 'usage-global',
        // The minimum core-js version whose polyfills we rely on.
        'version': '3.23',
      },
    ],
  ],
  'env': {
    'test': {
      'plugins': ['dynamic-import-node'],
    },
  },
};
