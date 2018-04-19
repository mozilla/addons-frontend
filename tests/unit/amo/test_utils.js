import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ServerError from 'amo/components/ErrorPage/ServerError';
import { getDjangoBase62, getErrorComponent } from 'amo/utils';


describe('amo/utils', () => {
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

  describe('amo/utils/getDjangoBase62', () => {
    const base62 = getDjangoBase62();

    it('encodes a example number', () => {
      expect(base62.encode(535493287492)).toEqual('9QVvGFw');
    });

    it('decodes a example encoded number', () => {
      expect(base62.decode('9QVvGFw')).toEqual(535493287492);
    });
  });
});
