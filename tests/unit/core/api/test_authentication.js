/* global window */
import querystring from 'querystring';

import config from 'config';

import {
  login,
  logOutFromServer,
  startLoginUrl,
} from 'core/api/authentication';
import {
  createApiResponse,
  signedInApiState,
  userAuthToken,
} from 'tests/unit/helpers';


describe(__filename, () => {
  const apiHost = config.get('apiHost');
  let mockWindow;

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  describe('login', () => {
    const response = { token: userAuthToken() };
    const mockResponse = () => createApiResponse({
      jsonData: response,
    });

    it('sends the code and state', () => {
      mockWindow
        .expects('fetch')
        .withArgs(`${apiHost}/api/v3/accounts/login/?lang=en-US`, {
          body: '{"code":"my-code","state":"my-state"}',
          credentials: 'include',
          headers: { 'Content-type': 'application/json' },
          method: 'POST',
        })
        .once()
        .returns(mockResponse());
      return login({ api: { lang: 'en-US' }, code: 'my-code', state: 'my-state' })
        .then((apiResponse) => {
          expect(apiResponse).toBe(response);
          mockWindow.verify();
        });
    });

    it('sends the config when set', () => {
      sinon.stub(config, 'get').withArgs('fxaConfig').returns('my-config');
      mockWindow
        .expects('fetch')
        .withArgs(`${apiHost}/api/v3/accounts/login/?config=my-config&lang=fr`)
        .once()
        .returns(mockResponse());
      return login({ api: { lang: 'fr' }, code: 'my-code', state: 'my-state' })
        .then(() => mockWindow.verify());
    });
  });

  describe('startLoginUrl', () => {
    const getStartLoginQs = (location) =>
      querystring.parse(startLoginUrl({ location }).split('?')[1]);

    it('includes the next path', () => {
      const location = { pathname: '/foo', query: { bar: 'BAR' } };
      expect(getStartLoginQs(location)).toEqual({ to: '/foo?bar=BAR' });
    });

    it('includes the next path the config if set', () => {
      sinon.stub(config, 'get').withArgs('fxaConfig').returns('my-config');
      const location = { pathname: '/foo' };
      expect(getStartLoginQs(location)).toEqual({ to: '/foo', config: 'my-config' });
    });
  });

  describe('logOutFromServer', () => {
    it('makes a delete request to the session endpoint', () => {
      const mockResponse = createApiResponse({ jsonData: { ok: true } });
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/accounts/session/?lang=en-US`, {
          body: undefined,
          credentials: 'include',
          headers: { authorization: 'Bearer secret-token' },
          method: 'DELETE',
        })
        .once()
        .returns(mockResponse);
      return logOutFromServer({ api: signedInApiState })
        .then(() => mockWindow.verify());
    });
  });
});
