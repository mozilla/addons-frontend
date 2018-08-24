
import config from 'config';
import fs from 'fs';
import { getPlugins, getRules } from '../webpack-common';
import { babelOptions } from '../webpack.dev.config.babel';


// TODO: See if any of the module options are overkill here
// or if there is anything we need to change.
module.exports = {
  module: {
  	rules: getRules({ babelOptions, bundleStylesWithJs: true }),
  },

  plugins : [
  	...getPlugins(),
  ],
};

