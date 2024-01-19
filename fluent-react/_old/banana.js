const path = require('path');
const fs = require('fs-extra');

const pluginTester = require('babel-plugin-tester').default;

const myPlugin = require('./plugin');
const extractPlugin = require('./extract-plugin');

function getLeafDirectories(startDir = path.join(__dirname, 'fixtures')) {
  const leafDirs = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);
    let isLeaf = true;

    for (const file of files) {
      const filePath = path.join(dir, file);
      const isDir = fs.lstatSync(filePath).isDirectory();

      if (isDir) {
        isLeaf = false;
        walk(filePath);
      }
    }

    if (isLeaf) {
      leafDirs.push(dir);
    }
  }

  walk(startDir);

  return leafDirs
    .filter((dir) => {
      const files = fs.readdirSync(dir);

      const hasCode = files.some((file) => file === 'code.js');
      const hasFluent = files.some((file) => file === 'fluent.ftl');

      return hasCode && hasFluent;
    })
    .map((dir) => {
      return {
        title: dir,
        code: fs.readFileSync(path.join(dir, 'code.js'), 'utf-8'),
        // output: fs.readFileSync(path.join(dir, 'fluent.ftl'), 'utf-8'),
        pluginOptions: {
          output: path.join(dir, '_fluent.ftl'),
        },
      };
    });
}
const fluentTests = getLeafDirectories(path.join(__dirname, 'fixtures'));

pluginTester({
  plugin: extractPlugin,
  pluginName: 'flow-extract',
  pluginOptions: {},
  babelOptions: require('./babel.config.js'),
  tests: fluentTests,
});

pluginTester({
  plugin: myPlugin,
  pluginName: 'flow-bundle',
  pluginOptions: {},
  babelOptions: require('./babel.config.js'),
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
