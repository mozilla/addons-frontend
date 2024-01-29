import pluginTester from 'babel-plugin-tester';
import myPlugin from './src/plugin';

pluginTester({
  plugin: myPlugin,
  pluginName: 'myPlugin',
  babelOptions: {
    plugins: [
      '@babel/plugin-syntax-jsx',
      '@babel/plugin-syntax-flow',
    ],
  },
  fixtures: __dirname + '/fixtures',
  tests: [
  ]
});
