import fs from 'fs-extra';
import tmp from 'tmp';

import WebpackAssetsFontsPlugin from 'amo/server/WebpackAssetsFontsPlugin';

describe(__filename, () => {
  let assetsFile;

  const fakeAssets = {
    'styles': {
      './app.css': 'apps-somehash.css',
    },
    'javascript': {
      './app.js': 'apps-somehash.js',
    },
    'assets': {
      './app.css': '// whatever',
      // Out of the box without our plugin, the final font URL (hashed with
      // publicPath prepended) would be absent. Here we add one of the two to
      // ensure we're overwriting whatever is already there for the font.
      './font1.woff2': '// nothing',
    },
  };
  const fakeStats = {
    compilation: {},
    toJson: () => {
      return {
        publicPath: 'https://example.com/static/',
        assets: [
          {
            name: 'app-somehash.js',
            info: {
              sourceFilename: 'app.js',
            },
          },
          {
            name: 'app-somehash.css',
            info: {
              sourceFilename: 'app.css',
            },
          },
          {
            name: 'font1-somehash.woff2',
            info: {
              sourceFilename: 'font1.woff2',
            },
          },
          {
            name: 'font2-somehash.woff2',
            info: {
              sourceFilename: 'font2.woff2',
            },
          },
        ],
      };
    },
  };

  const fakeCompiler = {
    hooks: {
      done: {
        tap: (name, callback) => {
          callback(fakeStats);
        },
      },
    },
  };

  beforeEach(() => {
    fakeStats.compilation.errors = [];
    assetsFile = tmp.fileSync({ unsafeCleanup: true });
    fs.writeJsonSync(assetsFile.name, fakeAssets);
  });

  it('adds .woff2 file info to assets json file', () => {
    const plugin = new WebpackAssetsFontsPlugin({
      webpackAssetsFileName: assetsFile.name,
    });

    plugin.apply(fakeCompiler);

    expect(fakeStats.compilation.errors).toEqual([]);
    const assetsAfterPlugin = fs.readJsonSync(assetsFile.name);
    expect(assetsAfterPlugin.assets['./font1.woff2']).toEqual(
      'https://example.com/static/font1-somehash.woff2',
    );
    expect(assetsAfterPlugin.assets['./font2.woff2']).toEqual(
      'https://example.com/static/font2-somehash.woff2',
    );
  });

  it('does not touch non fonts assets, javascript or styles', () => {
    const plugin = new WebpackAssetsFontsPlugin({
      webpackAssetsFileName: assetsFile.name,
    });

    plugin.apply(fakeCompiler);

    expect(fakeStats.compilation.errors).toEqual([]);
    const assetsAfterPlugin = fs.readJsonSync(assetsFile.name);
    expect(assetsAfterPlugin.javascript).toEqual(fakeAssets.javascript);
    expect(assetsAfterPlugin.styles).toEqual(fakeAssets.styles);
    expect(assetsAfterPlugin.assets['./app.css']).toEqual(
      fakeAssets.assets['./app.css'],
    );
  });

  it('errors out if the assets file did not exist', () => {
    const plugin = new WebpackAssetsFontsPlugin({
      webpackAssetsFileName: 'foo.json',
    });

    plugin.apply(fakeCompiler);

    expect(fakeStats.compilation.errors.length).toEqual(1);
    expect(fakeStats.compilation.errors[0].code).toEqual('ENOENT');
  });

  it('requires a webpackAssetsFileName parameter', () => {
    expect(() => new WebpackAssetsFontsPlugin()).toThrowError(
      /options misses the property 'webpackAssetsFileName'/,
    );
  });
});
