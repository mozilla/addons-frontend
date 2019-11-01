import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';
import { getErrorComponent } from 'amo/utils/errors';

describe(__filename, () => {
  describe('getErrorComponent', () => {
    it('returns a NotAuthorizedPage component for 401 errors', () => {
      expect(getErrorComponent(401)).toEqual(NotAuthorizedPage);
    });

    it('returns a NotFoundPage component for 404 errors', () => {
      expect(getErrorComponent(404)).toEqual(NotFoundPage);
    });

    it('returns a ServerErrorPage component for 500 errors', () => {
      expect(getErrorComponent(500)).toEqual(ServerErrorPage);
    });

    it('returns a ServerErrorPage component by default', () => {
      expect(getErrorComponent(501)).toEqual(ServerErrorPage);
    });
  });
});
