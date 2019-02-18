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

// enzyme: there is an issue with Enzyme 3.9 (related to `setState()` and
// `componentDidUpdate()` in `TestUserProfileEdit.js`). The failure has been
// observed in: https://github.com/mozilla/addons-frontend/pull/7603 and it is
// likely due to this Enzyme patch: https://github.com/airbnb/enzyme/pull/2007

const skipDevDeps = ['prettier', 'pretty-quick', 'enzyme'];

describe(__filename, () => {
  Object.keys(packageJson.devDependencies).forEach((key) => {
    it(`should have devDependencies[${key}] version prefixed with "^"`, () => {
      if (!skipDevDeps.includes(key)) {
        expect(packageJson.devDependencies[key]).toEqual(
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
