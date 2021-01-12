import { filterFileNamesFromGitStatusOutput } from 'tests/jest-reporters/utils';

describe(__filename, () => {
  describe('_filterFileNamesFromGitStatusOutput', () => {
    const _filterFileNamesFromGitStatusOutput = (lines = []) => {
      return filterFileNamesFromGitStatusOutput(lines.join('\n'));
    };

    it('does not return deleted files', () => {
      const files = _filterFileNamesFromGitStatusOutput([
        'D  src/amo/browserWindow.js',
        ' D  src/amo/browserWindow.js',
      ]);

      expect(files).toHaveLength(0);
    });

    it('only returned the new filename of a renamed file', () => {
      const files = _filterFileNamesFromGitStatusOutput([
        'RM src/amo/sagas/categories.js -> src/amo/sagas/categories.js',
      ]);

      expect(files).toEqual(['src/amo/sagas/categories.js']);
    });

    it('returns the filenames without the git statuses', () => {
      const files = _filterFileNamesFromGitStatusOutput([
        'M  jest.config.js',
        'A  tests/jest-reporters/eslint-check.js',
        'AM tests/jest-reporters/utils.js',
        '?? tests/unit/jest-reporters/',
      ]);

      expect(files).toEqual([
        'jest.config.js',
        'tests/jest-reporters/eslint-check.js',
        'tests/jest-reporters/utils.js',
        'tests/unit/jest-reporters/',
      ]);
    });

    it('only returns JavaScript files', () => {
      const files = _filterFileNamesFromGitStatusOutput([
        'M  README.md',
        'M  package.json',
        'M  src/test.jsx',
        ' M tests/unit/jest-reporters/test_utils.js',
      ]);

      expect(files).toEqual([
        'src/test.jsx',
        'tests/unit/jest-reporters/test_utils.js',
      ]);
    });
  });
});
