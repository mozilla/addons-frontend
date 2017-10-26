import redirectToReducer, {
  initialState,
  sendServerRedirect,
} from 'amo/reducers/redirectTo';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = redirectToReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      const unrelated = { type: 'UNRELATED_ACTION' };
      const state = redirectToReducer(initialState, unrelated);
      expect(state).toEqual(initialState);
    });

    it('sets the server redirect information', () => {
      const redirectTo = {
        status: 302,
        url: '/some/url',
      };
      const state = redirectToReducer(
        undefined, sendServerRedirect(redirectTo)
      );
      expect(state).toEqual(redirectTo);
    });
  });

  describe('sendServerRedirect', () => {
    const getParams = () => {
      return {
        status: 301,
        url: '/some/url',
      };
    };

    it('requires a status', () => {
      const params = getParams();
      delete params.status;
      expect(() => {
        sendServerRedirect(params);
      }).toThrow(/status is required/);
    });

    it('requires a url', () => {
      const params = getParams();
      delete params.url;
      expect(() => {
        sendServerRedirect(params);
      }).toThrow(/url is required/);
    });
  });
});
