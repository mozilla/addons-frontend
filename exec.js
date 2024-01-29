/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const { globSync } = require('glob');
const { transformFileSync } = require('@babel/core');

(async () => {
  try {
    const files = globSync('src/amo/pages/**/index.js');

    for (const file of files) {
      let output = fs.readFileSync(file).toString();

      try {
        const babelResult = transformFileSync(file, {
          babelrc: false,
          compact: false,
          configFile: false,

          presets: [],
          plugins: [
            '@babel/plugin-syntax-jsx',
            '@babel/plugin-syntax-flow',
            [require.resolve('./babel-plugin-extract-redux-page/dist/plugin'), {}]
          ],
        });

        output = babelResult.code;

        fs.writeFileSync(file, output);
      } catch (error) {
        console.error('Error transforming file', file, error);
      }
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
