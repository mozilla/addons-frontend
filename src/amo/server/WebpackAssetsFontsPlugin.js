import fs from 'fs-extra';

// This is a webpack plugin to add .woff2 fonts in webpack-assets.json that
// webpack-isomorphic-tools generates. We can then use `assets` to reference
// these fonts in server side rendered code to preload some font subsets, like
// we can in development mode.

// schema for options object
const schema = {
  type: 'object',
  properties: {
    webpackAssetsFileName: {
      type: 'string',
    },
  },
  'required': ['webpackAssetsFileName'],
  additionalProperties: false,
};

const pluginName = 'WebpackAssetsFontsPlugin';

export default class WebpackAssetsFontsPlugin {
  constructor(options = {}) {
    this.options = options;
    this.webpackAssetsFileName = options.webpackAssetsFileName;
  }

  apply(compiler) {
    compiler.hooks.validate.tap(pluginName, () => {
      compiler.validate(() => schema, this.options);
    });

    compiler.hooks.done.tap(pluginName, (stats) => {
      const subsetFonts = {};
      const { assets, publicPath } = stats.toJson();

      try {
        assets.forEach((asset) => {
          const {
            name,
            info: { sourceFilename },
          } = asset;

          if (name.endsWith('.woff2')) {
            subsetFonts[`./${sourceFilename}`] = `${publicPath}${name}`;
          }
        });

        const data = fs.readJsonSync(this.webpackAssetsFileName);
        data.assets = { ...data.assets, ...subsetFonts };
        fs.writeJsonSync(this.webpackAssetsFileName, data);
      } catch (error) {
        stats.compilation.errors.push(error);
      }
    });
  }
}
