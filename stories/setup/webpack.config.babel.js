import fs from 'fs';
import path from 'path';

import { getAssetRules, getStyleRules, getPlugins } from '../../webpack-common';
import webpackProdConfig from '../../webpack.prod.config.babel';

module.exports = {
  node: webpackProdConfig.node,
  optimization: {
    minimizer: [],
  },
  module: {
    rules: [...getStyleRules({ bundleStylesWithJs: true }), ...getAssetRules()],
  },
  plugins: [...getPlugins()],
  resolve: webpackProdConfig.resolve,
};
