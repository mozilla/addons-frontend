import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ServerError from 'amo/components/ErrorPage/ServerError';
import { getCanonicalURL, getErrorComponent } from 'amo/utils';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getErrorComponent', () => {
    it('returns a NotAuthorized component for 401 errors', () => {
      expect(getErrorComponent(401)).toEqual(NotAuthorized);
    });

    it('returns a NotFound component for 404 errors', () => {
      expect(getErrorComponent(404)).toEqual(NotFound);
    });

    it('returns a ServerError component for 500 errors', () => {
      expect(getErrorComponent(500)).toEqual(ServerError);
    });

    it('returns a ServerError component by default', () => {
      expect(getErrorComponent(501)).toEqual(ServerError);
    });
  });

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
});
