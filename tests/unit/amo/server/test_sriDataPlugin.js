/**
 * See: https://github.com/mozilla/addons-frontend/issues/7031
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';

import webpack from 'webpack';
import { SubresourceIntegrityPlugin } from 'webpack-subresource-integrity';
import tmp from 'tmp';

import SriDataPlugin from 'amo/server/sriDataPlugin';

describe(__filename, () => {
  let distDir;
  let srcDir;
  let tempDir;

  beforeEach(() => {
    tempDir = tmp.dirSync({ unsafeCleanup: true });
    srcDir = path.join(tempDir.name, 'src');
    distDir = path.join(tempDir.name, 'dist');

    fs.mkdirSync(srcDir);
    fs.mkdirSync(distDir);

    fs.writeFileSync(path.join(srcDir, 'app1.js'), 'window.foo = 41;');
    fs.writeFileSync(path.join(srcDir, 'app2.js'), 'window.foo = 42;');
  });

  afterEach(() => {
    tempDir.removeCallback();
  });

  function compile({ entry = {}, includeSriPlugin = true } = {}) {
    const sriFile = path.join(distDir, 'sri.json');

    const plugins = [];
    if (includeSriPlugin) {
      plugins.push(
        new SubresourceIntegrityPlugin({ hashFuncNames: ['sha512'] }),
      );
    }
    plugins.push(new SriDataPlugin({ saveAs: sriFile }));

    const compiler = webpack({
      entry: {
        ...entry,
      },
      output: {
        crossOriginLoading: 'anonymous',
        path: path.join(tempDir.name, 'dist'),
        filename: '[name].js',
        chunkFilename: '[name].js',
      },
      plugins,
    });

    return new Promise((resolve, reject) =>
      // eslint-disable-next-line no-promise-executor-return
      compiler.run((error, stats) => {
        if (error) {
          return reject(error);
        }
        if (stats.compilation.errors && stats.compilation.errors.length) {
          return reject(
            new Error(`Webpack errors: ${stats.compilation.errors.join('; ')}`),
          );
        }
        return resolve({
          stats,
          sriData: JSON.parse(fs.readFileSync(sriFile)),
        });
      }),
    );
  }

  it('handles a single asset file', () => {
    return compile({
      entry: {
        app: path.join(srcDir, 'app1.js'),
      },
    }).then(({ stats, sriData }) => {
      // Ensure that compilation succeeded...
      const { assets } = stats.toJson();
      expect(assets.length).toEqual(1);
      expect(assets[0].size).toBeGreaterThan(0);
      // ... and that we have the hashes in sriData.
      expect(sriData['app.js']).toMatch(/^sha512-/);
    });
  });

  it('handles multiple asset files', () => {
    return compile({
      entry: {
        app: path.join(srcDir, 'app1.js'),
        second_app: path.join(srcDir, 'app2.js'),
      },
    }).then(({ stats, sriData }) => {
      // Ensure that compilation succeeded...
      const { assets } = stats.toJson();
      expect(assets.length).toEqual(2);
      expect(assets[0].size).toBeGreaterThan(0);
      expect(assets[1].size).toBeGreaterThan(0);
      // ... and that we have the hashes in sriData.
      expect(sriData['app.js']).toMatch(/^sha512-/);
      expect(sriData['second_app.js']).toMatch(/^sha512-/);
    });
  });

  it('requires the SriPlugin', () => {
    return compile({
      entry: {
        app: path.join(srcDir, 'app1.js'),
      },
      includeSriPlugin: false,
    }).then(
      () => expect(false).toBe(true),
      (error) => {
        expect(error.message).toMatch(
          /The integrity property is falsey for asset app\.js/,
        );
      },
    );
  });

  it('requires a saveAs parameter', () => {
    expect(() => new SriDataPlugin()).toThrow(
      /saveAs parameter cannot be empty/,
    );
  });
});
