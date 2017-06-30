import fs from 'fs';
import path from 'path';

import webpack from 'webpack';
import SriPlugin from 'webpack-subresource-integrity';
import tmp from 'tmp';

import SriDataPlugin from 'core/server/sriDataPlugin';

describe('SriDataPlugin', () => {
  let distDir;
  let srcDir;
  let tempDir;

  beforeEach(() => {
    tempDir = tmp.dirSync({ unsafeCleanup: true });
    srcDir = path.join(tempDir.name, 'src');
    distDir = path.join(tempDir.name, 'dist');

    fs.mkdirSync(srcDir);
    fs.mkdirSync(distDir);

    fs.writeFileSync(path.join(srcDir, 'app.js'), '// some JS code');
  });

  afterEach(() => {
    tempDir.removeCallback();
  });

  function compile({
    entry = {}, includeSriPlugin = true,
  } = {}) {
    const sriFile = path.join(distDir, 'sri.json');

    const plugins = [];
    if (includeSriPlugin) {
      plugins.push(new SriPlugin({ hashFuncNames: ['sha512'] }));
    }
    plugins.push(new SriDataPlugin({ saveAs: sriFile }));

    const compiler = webpack({
      entry: {
        app: path.join(srcDir, 'app'),
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

    return new Promise((resolve, reject) => compiler.run((error, stats) => {
      if (error) {
        return reject(error);
      }
      if (stats.compilation.errors && stats.compilation.errors.length) {
        return reject(new Error(
          `Webpack errors: ${stats.compilation.errors.join('; ')}`
        ));
      }
      return resolve({
        stats,
        sriData: JSON.parse(fs.readFileSync(sriFile)),
      });
    }));
  }

  it('handles a single asset file', () => {
    return compile({
      entry: {
        app: path.join(srcDir, 'app'),
      },
    })
      .then(({ sriData }) => {
        expect(sriData['app.js']).toMatch(/^sha512-.*/);
      });
  });

  it('handles multiple asset files', () => {
    return compile({
      entry: {
        app: path.join(srcDir, 'app'),
        app2: path.join(srcDir, 'app'),
      },
    })
      .then(({ sriData }) => {
        expect(sriData['app.js']).toMatch(/^sha512-.*/);
        expect(sriData['app2.js']).toMatch(/^sha512-.*/);
      });
  });

  it('requires the SriPlugin', () => {
    return compile({
      entry: {
        app: path.join(srcDir, 'app'),
      },
      includeSriPlugin: false,
    })
      .then(
        () => expect(false).toBe(true),
        (error) => {
          expect(error.message).toMatch(/The integrity property is falsey for asset app\.js/);
        }
      );
  });

  it('requires a saveAs parameter', () => {
    expect(() => new SriDataPlugin()).toThrowError(/saveAs parameter cannot be empty/);
  });
});
