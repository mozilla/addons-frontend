import { getRules } from '../../webpack-common';
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
  // The following plugins are needed to help handle
  // server-side imported components such as core/logger.
  // Is this the best way??
  plugins: [
    new webpack.DefinePlugin({
      CLIENT_CONFIG: JSON.stringify(getClientConfig(config)),
    }),

    new webpack.NormalModuleReplacementPlugin(
      /config$/,
      'core/client/config.js',
    ),

    // This swaps the server side window object with a standard browser window.
    new webpack.NormalModuleReplacementPlugin(
      /core\/window/,
      'core/browserWindow.js',
    ),
  ],
  resolve: {
    alias: {
      normalize: 'normalize.css/normalize.css',
    },
    modules: [path.resolve('./src'), 'node_modules'],
  },
};
