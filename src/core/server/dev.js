import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import webpackConfig from 'config/webpack.config';
import config from 'config';

const APP_NAME = config.get('currentApp');

export default function(app) {
  const conf = Object.assign(webpackConfig, {
    devtool: 'inline-source-map',
    entry: [
      'webpack-hot-middleware/client',
      `./src/${APP_NAME}/client`,
    ],
    plugins: [
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin(),
    ],
  });

  const compiler = webpack(conf);

  app.use(webpackDevMiddleware(compiler, { noInfo: true }));
  app.use(webpackHotMiddleware(compiler));
}
