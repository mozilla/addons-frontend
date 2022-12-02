/* global Request */

describe(__filename, () => {
  describe('fetch()', () => {
    const url = 'https://addons.mozilla.org';

    it('should throw an error', () => {
      expect(() => {
        fetch(url);
      }).toThrow(`API calls MUST be mocked. URL fetched: ${url}`);
    });

    it('should throw an error when using a Request', () => {
      expect(() => {
        fetch(new Request(url));
      }).toThrow(`API calls MUST be mocked. URL fetched: ${url}`);
    });
  });
});
