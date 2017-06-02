/* global Response, window */
import querystring from 'querystring';

import config from 'config';
import utf8 from 'utf8';

import * as api from 'core/api';
import { ADDON_TYPE_THEME } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { signedInApiState, unexpectedSuccess, userAuthToken }
  from 'tests/unit/helpers';


export function generateHeaders(
  headerData = { 'Content-Type': 'application/json' }
) {
  const response = new Response();
  Object.keys(headerData).forEach((key) => (
    response.headers.append(key, headerData[key])
  ));
  return response.headers;
}

function createApiResponse({
  ok = true, jsonData = {}, ...responseProps
} = {}) {
  const response = {
    ok,
    headers: generateHeaders(),
    json: () => Promise.resolve(jsonData),
    ...responseProps,
  };
  return Promise.resolve(response);
}

describe('api', () => {
  let mockWindow;
  const apiHost = config.get('apiHost');

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  describe('core.callApi', () => {
    function newErrorHandler() {
      return new ErrorHandler({ id: '123', dispatch: sinon.stub() });
    }

    it('does not use remote host for api calls', () => {
      expect(apiHost).toEqual('https://localhost');
    });

    it('transforms method to upper case', () => {
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/resource/`, {
          body: undefined, credentials: undefined, method: 'GET', headers: {},
        })
        .once()
        .returns(createApiResponse());
      return api.callApi({ endpoint: 'resource', method: 'get' })
        .then(() => mockWindow.verify());
    });

    it('encodes non-ascii URLs in UTF8', () => {
      const endpoint = 'diccionario-español-venezuela';
      mockWindow.expects('fetch')
        .withArgs(utf8.encode(`${apiHost}/api/v3/${endpoint}/`), {
          body: undefined, credentials: undefined, method: 'GET', headers: {},
        })
        .once()
        .returns(createApiResponse());
      return api.callApi({ endpoint }).then(() => mockWindow.verify());
    });

    it('clears an error handler before making a request', () => {
      mockWindow.expects('fetch').returns(createApiResponse());

      const errorHandler = newErrorHandler();
      sinon.stub(errorHandler, 'clear');

      return api.callApi({ endpoint: 'resource', errorHandler })
        .then(() => {
          expect(errorHandler.clear.called).toBeTruthy();
        });
    });

    it('passes errors to the error handler', () => {
      const nonFieldErrors = ['user_id and password cannot be blank'];
      mockWindow.expects('fetch').returns(createApiResponse({
        ok: false,
        jsonData: { non_field_errors: nonFieldErrors },
      }));

      const errorHandler = newErrorHandler();
      sinon.stub(errorHandler, 'handle');

      return api.callApi({ endpoint: 'resource', errorHandler })
        .then(unexpectedSuccess, () => {
          expect(errorHandler.handle.called).toBeTruthy();
          const args = errorHandler.handle.firstCall.args;
          expect(args[0].response.data.non_field_errors).toEqual(nonFieldErrors);
        });
    });

    it('handles error responses with JSON syntax errors', () => {
      mockWindow.expects('fetch').returns(createApiResponse({
        json() {
          return Promise.reject(
            new SyntaxError('pretend this was a response with invalid JSON'));
        },
      }));

      const errorHandler = newErrorHandler();
      sinon.stub(errorHandler, 'handle');

      return api.callApi({ endpoint: 'resource' })
        .then(unexpectedSuccess, (err) => {
          expect(err.message).toEqual('pretend this was a response with invalid JSON');
        });
    });

    it('handles non-JSON responses', () => {
      mockWindow.expects('fetch').returns(createApiResponse({
        headers: generateHeaders({ 'Content-Type': 'text/plain' }),
        text() {
          return Promise.resolve('some text response');
        },
      }));

      return api.callApi({ endpoint: 'resource' })
        .then(() => {
          mockWindow.verify();
        });
    });

    it('handles any fetch error', () => {
      mockWindow.expects('fetch').returns(Promise.reject(new Error(
        'this could be any error'
      )));

      const errorHandler = newErrorHandler();
      sinon.stub(errorHandler, 'handle');

      return api.callApi({ endpoint: 'resource', errorHandler })
        .then(unexpectedSuccess, () => {
          expect(errorHandler.handle.called).toBeTruthy();
          const args = errorHandler.handle.firstCall.args;
          expect(args[0].message).toEqual('this could be any error');
        });
    });

    it('handles an oddly-cased Content-Type', () => {
      const response = createApiResponse({
        headers: generateHeaders({ 'Content-Type': 'Application/JSON' }),
      });

      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/resource/`, {
          body: undefined, credentials: undefined, method: 'GET', headers: {},
        })
        .once()
        .returns(response);
      return api.callApi({ endpoint: 'resource', method: 'GET' })
        .then(() => mockWindow.verify());
    });
  });

  describe('makeQueryString', () => {
    it('transforms an object to a query string', () => {
      const query = api.makeQueryString({ user: 123, addon: 321 });
      expect(query).toContain('user=123');
      expect(query).toContain('addon=321');
    });

    it('ignores undefined query string values', () => {
      const query = api.makeQueryString({ user: undefined, addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('ignores null query string values', () => {
      const query = api.makeQueryString({ user: null, addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('ignores empty string query string values', () => {
      const query = api.makeQueryString({ user: '', addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('handles falsey integers', () => {
      const query = api.makeQueryString({ some_flag: 0 });
      expect(query).toEqual('?some_flag=0');
    });

    it('handles truthy integers', () => {
      const query = api.makeQueryString({ some_flag: 1 });
      expect(query).toEqual('?some_flag=1');
    });

    it('handles false values', () => {
      const query = api.makeQueryString({ some_flag: false });
      expect(query).toEqual('?some_flag=false');
    });

    it('handles true values', () => {
      const query = api.makeQueryString({ some_flag: true });
      expect(query).toEqual('?some_flag=true');
    });
  });

  describe('core/api.search()', () => {
    function mockResponse(responseProps = {}) {
      return createApiResponse({
        jsonData: {
          results: [
            { slug: 'foo' },
            { slug: 'food' },
            { slug: 'football' },
          ],
        },
        ...responseProps,
      });
    }

    it('sets the lang, limit, page and query', () => {
      // FIXME: This shouldn't fail if the args are in a different order.
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/search/?app=android&q=foo&page=3&lang=en-US`)
        .once()
        .returns(mockResponse());
      return api.search({
        api: { clientApp: 'android', lang: 'en-US' },
        auth: true,
        filters: { query: 'foo' },
        page: 3,
      })
        .then(() => mockWindow.verify());
    });

    it('normalizes the response', () => {
      mockWindow.expects('fetch').once().returns(mockResponse());
      return api.search({ api: {}, auth: true, filters: { query: 'foo' } })
        .then((results) => {
          expect(results.result.results).toEqual(['foo', 'food', 'football']);
          expect(results.entities).toEqual({
            addons: {
              foo: { slug: 'foo' },
              food: { slug: 'food' },
              football: { slug: 'football' },
            },
          });
        });
    });

    it('surfaces status and apiURL on Error instance', () => {
      const url = `${apiHost}/api/v3/addons/search/?q=foo&page=3&lang=en-US`;
      mockWindow.expects('fetch')
        .withArgs(url)
        .once()
        .returns(mockResponse({ ok: false, status: 401 }));

      return api.search({
        api: { lang: 'en-US' },
        auth: true,
        filters: { query: 'foo' },
        page: 3,
      })
        .then(unexpectedSuccess, (err) => {
          expect(err.response.status).toEqual(401);
          expect(err.response.apiURL).toEqual(url);
        });
    });
  });

  describe('search api', () => {
    const mockResponse = () => createApiResponse({
      jsonData: {
        results: [
          { slug: 'foo' },
          { slug: 'food' },
          { slug: 'football' },
        ],
      },
    });

    it('sets the lang, limit, page and query', () => {
      // FIXME: This shouldn't fail if the args are in a different order.
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&q=foo&page=3&lang=en-US`)
        .once()
        .returns(mockResponse());
      return api.search({
        api: { clientApp: 'firefox', lang: 'en-US' },
        filters: { query: 'foo' },
        page: 3,
      })
        .then(() => mockWindow.verify());
    });

    it('changes theme requests for android to firefox results', () => {
      // FIXME: This shouldn't fail if the args are in a different order.
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&type=persona&page=3&lang=en-US`)
        .once()
        .returns(mockResponse());
      return api.search({
        api: { clientApp: 'android', lang: 'en-US' },
        filters: { addonType: ADDON_TYPE_THEME, clientApp: 'android' },
        page: 3,
      })
        .then(() => mockWindow.verify());
    });

    it('allows overrides to clientApp', () => {
      // FIXME: This shouldn't fail if the args are in a different order.
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&q=foo&page=3&lang=en-US`)
        .once()
        .returns(mockResponse());
      return api.search({
        api: { clientApp: 'android', lang: 'en-US' },
        filters: { clientApp: 'firefox', query: 'foo' },
        page: 3,
      })
        .then(() => mockWindow.verify());
    });

    it('normalizes the response', () => {
      mockWindow.expects('fetch').once().returns(mockResponse());
      return api.search({
        api: { clientApp: 'firefox', lang: 'en-US' },
        filters: { query: 'foo' },
      })
        .then((results) => {
          expect(results.result.results).toEqual(['foo', 'food', 'football']);
          expect(results.entities).toEqual({
            addons: {
              foo: { slug: 'foo' },
              food: { slug: 'food' },
              football: { slug: 'football' },
            },
          });
        });
    });
  });

  describe('featured add-ons api', () => {
    const mockResponse = () => createApiResponse({
      jsonData: {
        results: [
          { slug: 'foo' },
          { slug: 'food' },
          { slug: 'football' },
        ],
      },
    });

    it('sets the app, lang, and type query', () => {
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/featured/?app=android&type=persona&lang=en-US`)
        .once()
        .returns(mockResponse());
      return api.featured({
        api: { clientApp: 'android', lang: 'en-US' },
        filters: { addonType: ADDON_TYPE_THEME },
      })
        .then((response) => {
          expect(response).toEqual({
            entities: {
              addons: {
                foo: { slug: 'foo' },
                food: { slug: 'food' },
                football: { slug: 'football' },
              },
            },
            result: {
              results: ['foo', 'food', 'football'],
            },
          });
          return mockWindow.verify();
        });
    });
  });

  describe('add-on api', () => {
    function mockResponse(responseProps = {}) {
      return createApiResponse({
        jsonData: {
          name: 'Foo!',
          slug: 'foo',
        },
        ...responseProps,
      });
    }

    it('sets the lang and slug', () => {
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/addon/foo/?lang=en-US`, {
          body: undefined,
          credentials: undefined,
          headers: {},
          method: 'GET',
        })
        .once()
        .returns(mockResponse());
      return api.fetchAddon({ api: { lang: 'en-US' }, slug: 'foo' })
        .then(() => mockWindow.verify());
    });

    it('normalizes the response', () => {
      mockWindow.expects('fetch').once().returns(mockResponse());
      return api.fetchAddon('foo')
        .then((results) => {
          const foo = { slug: 'foo', name: 'Foo!' };
          expect(results.result).toEqual('foo');
          expect(results.entities).toEqual({ addons: { foo } });
        });
    });

    it('fails when the add-on is not found', () => {
      mockWindow
        .expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/addon/foo/?lang=en-US`, {
          body: undefined,
          credentials: undefined,
          headers: {},
          method: 'GET',
        })
        .once()
        .returns(mockResponse({ ok: false }));
      return api.fetchAddon({ api: { lang: 'en-US' }, slug: 'foo' })
        .then(unexpectedSuccess,
          (error) => {
            expect(error.message).toEqual('Error calling: /api/v3/addons/addon/foo/');
          });
    });

    it('includes the authorization token if available', () => {
      const token = userAuthToken();
      mockWindow
        .expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/addon/bar/?lang=en-US`, {
          body: undefined,
          credentials: undefined,
          headers: { authorization: `Bearer ${token}` },
          method: 'GET',
        })
        .once()
        .returns(mockResponse());
      return api.fetchAddon({ api: { lang: 'en-US', token }, slug: 'bar' })
        .then((results) => {
          const foo = { slug: 'foo', name: 'Foo!' };
          expect(results.result).toEqual('foo');
          expect(results.entities).toEqual({ addons: { foo } });
          mockWindow.verify();
        });
    });
  });

  describe('createApiError', () => {
    function _createApiError({
      response = { status: 500 }, ...params } = {}
    ) {
      return api.createApiError({ response, ...params });
    }

    it('includes an abbreviated URL', () => {
      const error = _createApiError({
        apiURL: `${config.get('apiHost')}/api/v3/addons/addon/123/`,
      });
      expect(error.message).toEqual('Error calling: /api/v3/addons/addon/123/');
    });

    it('strips query params from the abbreviated URL', () => {
      const error = _createApiError({
        apiURL: `${config.get('apiHost')}/api/resource/?lang=en-US`,
      });
      expect(error.message).toEqual('Error calling: /api/resource/');
    });

    it('copes with a missing API URL', () => {
      const error = _createApiError();
      expect(error.message).toEqual('Error calling: [unknown URL]');
    });
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
      return api.login({ api: { lang: 'en-US' }, code: 'my-code', state: 'my-state' })
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
      return api.login({ api: { lang: 'fr' }, code: 'my-code', state: 'my-state' })
        .then(() => mockWindow.verify());
    });
  });

  describe('fetchProfile', () => {
    it("requests the user's profile", () => {
      const token = userAuthToken();
      const user = { username: 'foo', email: 'foo@example.com' };
      mockWindow
        .expects('fetch')
        .withArgs(`${apiHost}/api/v3/accounts/profile/?lang=en-US`, {
          body: undefined,
          credentials: undefined,
          headers: { authorization: `Bearer ${token}` },
          method: 'GET',
        })
        .once()
        .returns(createApiResponse({ jsonData: user }));
      return api.fetchProfile({ api: { lang: 'en-US', token } })
        .then((apiResponse) => {
          expect(apiResponse).toEqual({
            entities: { users: { foo: user } },
            result: 'foo',
          });
          mockWindow.verify();
        });
    });
  });

  describe('startLoginUrl', () => {
    const getStartLoginQs = (location) =>
      querystring.parse(api.startLoginUrl({ location }).split('?')[1]);

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

  describe('categories api', () => {
    function mockResponse(responseProps = {}) {
      return createApiResponse({
        jsonData: {
          results: [
            { slug: 'foo' },
            { slug: 'food' },
            { slug: 'football' },
          ],
        },
        ...responseProps,
      });
    }

    it('sets the lang and calls the right API endpoint', () => {
      mockWindow.expects('fetch')
        .withArgs(
          `${apiHost}/api/v3/addons/categories/?lang=en-US`)
        .once()
        .returns(mockResponse());
      return api.categories({
        api: { clientApp: 'android', lang: 'en-US' },
      })
        .then(() => mockWindow.verify());
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
      return api.logOutFromServer({ api: signedInApiState })
        .then(() => mockWindow.verify());
    });
  });
});
