import fs from 'fs';
import path from 'path';

import { getPlugins, getRules } from '../../webpack-common';
import webpackProdConfig from '../../webpack.prod.config.babel';

const babelrc = fs.readFileSync(path.join(__dirname, '..', '..', '.babelrc'));
const babelrcObject = JSON.parse(babelrc);

// We need to add the docgen plugin to get Flow to work.
const babelOptions = Object.assign({}, babelrcObject, {
  plugins: [...babelrcObject.plugins, 'react-docgen'],
});

module.exports = {
  node: webpackProdConfig.node,
  optimization: {
    minimizer: [],
  },
  module: {
    rules: [...getRules({ babelOptions, bundleStylesWithJs: true })],
  },
  plugins: [...getPlugins()],
  resolve: webpackProdConfig.resolve,
};
