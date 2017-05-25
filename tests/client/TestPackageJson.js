import packageJson from 'package';

describe('Package JSON', () => {
  Object.keys(packageJson.devDependencies).forEach((key) => {
    it(`should have devDependencies[${key}] version prefixed with "^"`, () => {
      expect(packageJson.devDependencies[key]).toEqual(expect.stringMatching(/^(\^|git|https)/));
    });
  });
});
