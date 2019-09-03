import url from 'url';

import { getCanonicalURL, isInternalURL } from 'amo/utils';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getCanonicalURL', () => {
    it(`returns an absolute canonical URL`, () => {
      const locationPathname = '/path/name';
      const baseURL = 'https://example.org';
      const _config = getFakeConfig({ baseURL });

      expect(getCanonicalURL({ _config, locationPathname })).toEqual(
        `${baseURL}${locationPathname}`,
      );
    });
  });

  describe('isInternalURL', () => {
    const pathname = '/path/name';

    it('returns true for a relative URL', () => {
      expect(isInternalURL({ urlString: pathname })).toEqual(true);
    });

    it('returns true for an absolute URL for the current host', () => {
      const baseURL = 'https://example.org';
      const urlString = url.format({ ...url.parse(baseURL), pathname });

      expect(
        isInternalURL({ _config: getFakeConfig({ baseURL }), urlString }),
      ).toEqual(true);
    });

    it('returns false for an absolute URL for a different host', () => {
      const siteBaseURL = 'https://example.org';
      const otherBaseURL = 'https://www.mozilla.org';

      const urlString = url.format({ ...url.parse(otherBaseURL), pathname });

      expect(
        isInternalURL({
          _config: getFakeConfig({ baseURL: siteBaseURL }),
          urlString,
        }),
      ).toEqual(false);
    });
  });
});
