import NotAuthorized from 'amo/components/Errors/NotAuthorized';
import NotFound from 'amo/components/Errors/NotFound';
import ServerError from 'amo/components/Errors/ServerError';
import { getErrorComponent } from 'amo/utils/errors';

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
});
