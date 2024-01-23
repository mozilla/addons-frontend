const path = require('path');

const pluginTester = require('babel-plugin-tester').default;

const myPlugin = require('./plugin');

pluginTester({
  plugin: myPlugin,
  pluginName: 'React-i18n migration plugin',
  pluginOptions: {
    commentPadding: false
  },
  fixtures: path.join(__dirname, 'fixtures'),
});
