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

  describe('getDjangoBase62', () => {
    const base62 = getDjangoBase62();
    const exampleBase62 = '9QVvGFw';
    const exampleTimeStamp = 535493287492;

    it('encodes a example number', () => {
      expect(base62.encode(exampleTimeStamp)).toEqual(exampleBase62);
    });

    it('decodes a example encoded number', () => {
      expect(base62.decode(exampleBase62)).toEqual(exampleTimeStamp);
    });

    it('returns NaN when decoding bogus input', () => {
      expect(Number.isNaN(base62.decode('dfhhsk%%$#^@#$@'))).toBe(true);
    });

    it('returns 0 when decoding empty string', () => {
      expect(base62.decode('')).toBe(0);
    });

    it('returns "" when encoding bogus input', () => {
      expect(base62.encode('a-string')).toEqual('');
    });
  });
});
