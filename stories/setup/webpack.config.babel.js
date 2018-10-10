import { getPlugins, getRules } from '../../webpack-common';
import webpackConfig, {
  babelOptions as defaultBabelOptions,
} from '../../webpack.dev.config.babel';

// We need to add the docgen plugin to get Flow to work.
const babelOptions = {
  ...defaultBabelOptions,
  plugins: [...defaultBabelOptions.plugins, 'react-docgen'],
};

module.exports = {
  ...webpackConfig,
  module: {
    rules: [...getRules({ babelOptions, bundleStylesWithJs: true })],
  },
  // TODO: add the circularDependency plugin back once the following issue is fixed:
  // https://github.com/mozilla/addons-frontend/issues/6561.
  plugins: [
    ...getPlugins({
      includeCircularDependencyPlugin: false,
    }),
  ],
};
