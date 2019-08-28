import url from 'url';

import { getCanonicalURL, makeInternalExternalURL } from 'amo/utils';
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

  describe('makeInternalExternalURL', () => {
    const baseURL = 'https://example.org';
    const defaultConfig = getFakeConfig({ baseURL });
    const initialQuery = { param1: 'param1' };
    const pathname = '/path/name';

    const _makeInternalExternalURL = ({
      _config = defaultConfig,
      externalQueryParams,
      internalQueryParams,
      urlString,
    }) => {
      return makeInternalExternalURL({
        _config,
        externalQueryParams,
        internalQueryParams,
        urlString,
      });
    };

    it('adds internal query params to a relative URL', () => {
      const internalQueryParams = { internalParam1: 'internalParam1' };
      const urlString = url.format({ pathname, query: initialQuery });
      const expectedURL = url.format({
        pathname,
        query: { ...initialQuery, ...internalQueryParams },
      });

      expect(
        _makeInternalExternalURL({
          internalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });

    it('overrides internal query params for a relative URL', () => {
      const originalQueryParams = { internalParam1: 'internalParam1' };
      const internalQueryParams = { internalParam1: 'internalParam2' };
      const urlString = url.format({ pathname, query: originalQueryParams });
      const expectedURL = url.format({
        pathname,
        query: { ...originalQueryParams, ...internalQueryParams },
      });

      expect(
        _makeInternalExternalURL({
          internalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });

    it('adds internal query params to an absolute URL for the host', () => {
      const internalQueryParams = { internalParam1: 'internalParam1' };
      const urlString = url.format({
        ...url.parse(baseURL),
        pathname,
        query: initialQuery,
      });
      const expectedURL = url.format({
        ...url.parse(baseURL),
        pathname,
        query: { ...initialQuery, ...internalQueryParams },
      });

      expect(
        _makeInternalExternalURL({
          internalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });

    it('overrides internal query params for an absolute URL for the host', () => {
      const originalQueryParams = { internalParam1: 'internalParam1' };
      const internalQueryParams = { internalParam1: 'internalParam2' };
      const urlString = url.format({
        ...url.parse(baseURL),
        pathname,
        query: originalQueryParams,
      });
      const expectedURL = url.format({
        ...url.parse(baseURL),
        pathname,
        query: { ...originalQueryParams, ...internalQueryParams },
      });

      expect(
        _makeInternalExternalURL({
          internalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });

    it('does not add internal query params to an absolute URL for a different host', () => {
      const internalQueryParams = { internalParam1: 'internalParam1' };
      const siteBaseURL = 'https://example.org';
      const newBaseURL = 'https://www.mozilla.org';

      const urlString = url.format({
        ...url.parse(newBaseURL),
        pathname,
        query: initialQuery,
      });
      const expectedURL = url.format({
        ...url.parse(newBaseURL),
        pathname,
        query: initialQuery,
      });

      expect(
        _makeInternalExternalURL({
          _config: getFakeConfig({ baseURL: siteBaseURL }),
          internalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });

    it('adds external query params to an absolute URL for a different host', () => {
      const externalQueryParams = { externalParam1: 'externalParam1' };
      const siteBaseURL = 'https://example.org';
      const newBaseURL = 'https://www.mozilla.org';

      const urlString = url.format({
        ...url.parse(newBaseURL),
        pathname,
        query: initialQuery,
      });
      const expectedURL = url.format({
        ...url.parse(newBaseURL),
        pathname,
        query: { ...initialQuery, ...externalQueryParams },
      });

      expect(
        _makeInternalExternalURL({
          _config: getFakeConfig({ baseURL: siteBaseURL }),
          externalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });

    it('overrides external query params for an absolute URL for a different host', () => {
      const originalQueryParams = { externalParam1: 'internalParam1' };
      const externalQueryParams = { externalParam1: 'externalParam2' };
      const siteBaseURL = 'https://example.org';
      const newBaseURL = 'https://www.mozilla.org';

      const urlString = url.format({
        ...url.parse(newBaseURL),
        pathname,
        query: originalQueryParams,
      });
      const expectedURL = url.format({
        ...url.parse(newBaseURL),
        pathname,
        query: { ...originalQueryParams, ...externalQueryParams },
      });

      expect(
        _makeInternalExternalURL({
          _config: getFakeConfig({ baseURL: siteBaseURL }),
          externalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });

    it('does not add external query params to a relative URL', () => {
      const externalQueryParams = { externalParam1: 'externalParam1' };
      const urlString = url.format({ pathname, query: initialQuery });
      const expectedURL = url.format({ pathname, query: initialQuery });

      expect(
        _makeInternalExternalURL({
          externalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });

    it('does not add external query params to an absolute URL for the host', () => {
      const externalQueryParams = { externalParam1: 'externalParam1' };
      const urlString = url.format({
        ...url.parse(baseURL),
        pathname,
        query: initialQuery,
      });
      const expectedURL = url.format({
        ...url.parse(baseURL),
        pathname,
        query: initialQuery,
      });

      expect(
        _makeInternalExternalURL({
          externalQueryParams,
          urlString,
        }),
      ).toEqual(expectedURL);
    });
  });
});
