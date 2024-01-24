import pluginTester from 'babel-plugin-tester';
import myPlugin from './src/plugin';

pluginTester({
  plugin: myPlugin,
  pluginName: 'myPlugin',
  tests: [
    {
      code: `const a = 1;`,
      output: `const a = 1;`,
      // Add more tests here
    },
  ],
});
