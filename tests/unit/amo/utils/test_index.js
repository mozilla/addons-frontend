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

    it('returns false for an subdomain of the current host', () => {
      const siteBaseURL = 'https://example.org';
      const subdomainBaseURL = 'https://subdomain.example.org';

      const urlString = url.format({
        ...url.parse(subdomainBaseURL),
        pathname,
      });

      expect(
        isInternalURL({
          _config: getFakeConfig({ baseURL: siteBaseURL }),
          urlString,
        }),
      ).toEqual(false);
    });

    it('returns false if the current host is a subdomain of the proposed URLs host', () => {
      const siteBaseURL = 'https://subdomain.example.org';
      const proposedBaseURL = 'https://example.org';

      const urlString = url.format({
        ...url.parse(proposedBaseURL),
        pathname,
      });

      expect(
        isInternalURL({
          _config: getFakeConfig({ baseURL: siteBaseURL }),
          urlString,
        }),
      ).toEqual(false);
    });
  });
});
