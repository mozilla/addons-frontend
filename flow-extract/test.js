const path = require('path');

const pluginTester = require('babel-plugin-tester').default;

const myPlugin = require('./plugin');

pluginTester({
  plugin: myPlugin,
  pluginName: 'flow-extract',
  pluginOptions: {},
  babelOptions: {
    plugins: ['@babel/plugin-syntax-jsx'],
  },
  fixtures: path.join(__dirname, 'fixtures'),
  tests: [
    {
      title: 'missing implicit other',
      fixture: path.join(
        __dirname,
        'fixtures',
        'selector',
        'throws-missing-implicit-other.js',
      ),
      error:
        'Selector must provide explicit default variant, or a variant named `other`',
    },
    {
      title: 'invalid default variant type not string',
      fixture: path.join(
        __dirname,
        'fixtures',
        'selector',
        'throws-invalid-default-variant-type.js',
      ),
      error: 'default variant must be string literal',
    },
    {
      title: 'default variant not defined on second arg',
      fixture: path.join(
        __dirname,
        'fixtures',
        'selector',
        'throws-invalid-explicit-other.js',
      ),
      error: `property 'foo' does not exist on variants`,
    },
    {
      title: 'invalid variant',
      fixture: path.join(
        __dirname,
        'fixtures',
        'selector',
        'throws-invalid-variants.js',
      ),
      error: 'Invalid variants argument. expecting Record<string, string>',
    },
    {
      title: 'missing variant',
      fixture: path.join(
        __dirname,
        'fixtures',
        'selector',
        'throws-missing-variants.js',
      ),
      error: 'Selector must provide a variants object',
    },
  ],
});
