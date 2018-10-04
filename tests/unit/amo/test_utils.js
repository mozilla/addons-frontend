import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ServerError from 'amo/components/ErrorPage/ServerError';
import { getCurrentURL, getErrorComponent } from 'amo/utils';
import { CLIENT_APP_FIREFOX } from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
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

  describe('getCurrentURL', () => {
    it(`returns the current URL from the router's state`, () => {
      const baseURL = 'http://example.org';
      const clientApp = CLIENT_APP_FIREFOX;
      const lang = 'fr';

      const _config = getFakeConfig({ baseURL });
      const { state } = dispatchClientMetadata({ clientApp, lang });

      expect(getCurrentURL({ _config, state })).toEqual(
        `${baseURL}/${lang}/${clientApp}/`,
      );
    });
  });
});
