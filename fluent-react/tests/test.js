import path from 'path';
import pluginTester from 'babel-plugin-tester';

import plugin from '../src/plugin';

pluginTester({
  plugin,
  fixtures: path.join(__dirname, 'fixtures', '_only_'),
  babelOptions: require('./babel.config.js'),
  tests: [],
  only: ['simple'],
});
