
import path from 'path';
import webpack from 'webpack';

import config from './index';
import prodWebpackConfig from './webpack.prod.config';

const WEBPACK_HOST = config.get('webpackHost');
const WEBPACK_PORT = config.get('webpackPort');
const SERVER_HOST = config.get('serverHost');
const SERVER_PORT = config.get('serverPort');


// Note: Object.assign only goes one level deep.


export default Object.assign({}, prodWebpackConfig, {
  entry:  [
    `webpack-dev-server/client?http://${WEBPACK_HOST}:${WEBPACK_PORT}/`,
    'webpack/hot/only-dev-server',
    './src/client'
  ],
  output: {
    path: path.join(__dirname, '../dist'),
    filename: 'bundle.js'
  },
  devtool: 'inline-source-map',
  devServer: {
    hot: true,
    proxy: {
      '*': `http://${SERVER_HOST}:${SERVER_PORT}`
    },
    host: SERVER_HOST,
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['react-hot', 'babel']
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
});
