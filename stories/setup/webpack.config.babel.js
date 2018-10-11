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
  plugins: [...getPlugins()],
};
