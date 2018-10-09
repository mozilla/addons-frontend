import { getPlugins, getRules } from '../../webpack-common';
import webpackConfig from '../../webpack.prod.config.babel';

module.exports = {
  ...webpackConfig,
  module: {
    rules: [
      ...getRules({ bundleStylesWithJs: true, includeBabelLoader: false }),
    ],
  },
  // TODO: add the circularDependency plugin back once the following issue is fixed:
  // https://github.com/mozilla/addons-frontend/issues/6561.
  plugins: [
    ...getPlugins({
      includeCircularDependencyPlugin: false,
    }),
  ],
};
