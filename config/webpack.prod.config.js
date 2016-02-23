import path from 'path';
import webpack from 'webpack';


export default {
  entry: [
    './src/client'
  ],
  output: {
    path: path.join(__dirname, '../dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['babel']
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ],
  resolve: {
    modulesDirectories: ['node_modules', 'src'],
    extensions: ['', '.js', '.jsx']
  },
};
