import fs from 'fs-extra';

const webpackAssetsFileName = 'webpack-assets.json';
// This is a webpack plugin to add .woff2 fonts in webpack-assets.json that
// webpack-isomorphic-tools generates. We can then use `assets` to reference
// these fonts in server side rendered code to preload some font subsets, like
// we can in development mode.

export default class WebpackAssetsFontsPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('WebpackAssetsFontsPlugin', (stats) => {
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

        const data = fs.readJsonSync(webpackAssetsFileName);
        data.assets = { ...data.assets, ...subsetFonts };
        fs.writeJsonSync(webpackAssetsFileName, data);
      } catch (error) {
        stats.compilation.errors.push(error);
      }
    });
  }
}
