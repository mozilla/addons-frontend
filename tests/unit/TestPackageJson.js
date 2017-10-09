import fs from 'fs';
import path from 'path';

import config from 'config';

const packageJson = JSON.parse(fs.readFileSync(path.join(config.get('basePath'), 'package.json')));

describe('Package JSON', () => {
  Object.keys(packageJson.devDependencies).forEach((key) => {
    it(`should have devDependencies[${key}] version prefixed with "^"`, () => {
      expect(packageJson.devDependencies[key]).toEqual(expect.stringMatching(/^(\^|git)/));
    });
  });

  Object.keys(packageJson.dependencies).forEach((key) => {
    it(`should have dependencies[${key}] version prefixed with a number`, () => {
      expect(packageJson.dependencies[key]).toEqual(expect.stringMatching(/^\d/));
    });
  });
});
