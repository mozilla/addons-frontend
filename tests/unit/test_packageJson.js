import fs from 'fs';
import path from 'path';

import config from 'config';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(config.get('basePath'), 'package.json')),
);

// When a dev-dep needs to be pinned the package name should be added to this
// list. Please add a comment with a link to a bug so we know why it was added.

// prettier and pretty-quick: we pin these so that all developers format code
// with the exact same version.

// html-webpack-plugin and webpack-subresource-integrity: we're using unstable
// versions.

// po2json: we're using an unreleased git commit because there hasn't been a
// release with the fixes to its dependencies.
const skipDevDeps = [
  'prettier',
  'pretty-quick',
  'html-webpack-plugin',
  'webpack-subresource-integrity',
  'po2json',
];

describe(__filename, () => {
  Object.keys(packageJson.devDependencies).forEach((key) => {
    it(`should have devDependencies[${key}] version prefixed with "^"`, () => {
      if (!skipDevDeps.includes(key)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(packageJson.devDependencies[key]).toEqual(
          // eslint-disable-next-line jest/no-conditional-expect
          expect.stringMatching(/^(\^|git)/),
        );
      }
    });
  });

  Object.keys(packageJson.dependencies).forEach((key) => {
    it(`should have dependencies[${key}] version prefixed with a number`, () => {
      expect(packageJson.dependencies[key]).toEqual(
        expect.stringMatching(/^\d/),
      );
    });
  });
});
