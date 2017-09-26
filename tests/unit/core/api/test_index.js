/* global window */
import querystring from 'querystring';

import config, { util as configUtil } from 'config';
import utf8 from 'utf8';

import * as api from 'core/api';
import { ADDON_TYPE_THEME, CLIENT_APP_ANDROID } from 'core/constants';
import {
  createFakeAutocompleteResult,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';
import {
  createApiResponse,
  createStubErrorHandler,
  generateHeaders,
  signedInApiState,
  unexpectedSuccess,
  userAuthToken,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let mockWindow;
  const apiHost = config.get('apiHost');

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  describe('core.callApi', () => {
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

    it('does not encode non-ascii URLs in UTF8 on the client', () => {
      const endpoint = 'project-ă-ă-â-â-日本語';
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/${endpoint}/`, {
          body: undefined, credentials: undefined, method: 'GET', headers: {},
        })
        .once()
        .returns(createApiResponse());

      // We use `cloneDeep()` to allow modifications on the `config` object,
      // since a call to `get()` makes it immutable.
      const clientConfig = configUtil.cloneDeep(config);
      clientConfig.client = true;
      clientConfig.server = false;

      return api.callApi({
        _config: clientConfig,
        endpoint,
      }).then(() => mockWindow.verify());
    });

    it('encodes non-ascii URLs in UTF8 on the server', () => {
      const endpoint = 'diccionario-español-venezuela';
      mockWindow.expects('fetch')
        .withArgs(utf8.encode(`${apiHost}/api/v3/${endpoint}/`), {
          body: undefined, credentials: undefined, method: 'GET', headers: {},
        })
        .once()
        .returns(createApiResponse());

      // We use `cloneDeep()` to allow modifications on the `config` object,
      // since a call to `get()` makes it immutable.
      const serverConfig = configUtil.cloneDeep(config);
      serverConfig.server = true;

      return api.callApi({
        _config: serverConfig,
        endpoint,
      }).then(() => mockWindow.verify());
    });

    it('clears an error handler before making a request', () => {
      mockWindow.expects('fetch').returns(createApiResponse());

      const errorHandler = createStubErrorHandler();
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

      const errorHandler = createStubErrorHandler();
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

      const errorHandler = createStubErrorHandler();
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
        .then((responseData) => {
          mockWindow.verify();
          expect(responseData).toEqual({});
        });
    });

    it('handles any fetch error', () => {
      mockWindow.expects('fetch').returns(Promise.reject(new Error(
        'this could be any error'
      )));

      const errorHandler = createStubErrorHandler();
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

      const { state } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
        lang: 'en-US',
      });

      return api.featured({
        api: state.api,
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
            expect(error.message)
              .toMatch(new RegExp('Error calling: /api/v3/addons/addon/foo/'));
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
      expect(error.message)
        .toMatch(new RegExp('Error calling: /api/v3/addons/addon/123/'));
    });

    it('strips query params from the abbreviated URL', () => {
      const error = _createApiError({
        apiURL: `${config.get('apiHost')}/api/resource/?lang=en-US`,
      });
      // Add a space at the end of the URL to make sure the query string
      // isn't there.
      expect(error.message).toMatch(new RegExp('/api/resource/ '));
    });

    it('copes with a missing API URL', () => {
      const error = _createApiError();
      expect(error.message).toMatch(/Error calling: \[unknown URL\]/);
    });

    it('includes response status in the error message', () => {
      const error = _createApiError({
        apiURL: `${config.get('apiHost')}/api/resource/`,
        response: { status: 422 },
      });
      expect(error.message)
        .toEqual('Error calling: /api/resource/ (status: 422)');
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
        api: { clientApp: CLIENT_APP_ANDROID, lang: 'en-US' },
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

  describe('autocomplete api', () => {
    const mockResponse = () => createApiResponse({
      jsonData: {
        results: [
          createFakeAutocompleteResult({ name: 'foo' }),
          createFakeAutocompleteResult({ name: 'food' }),
          createFakeAutocompleteResult({ name: 'football' }),
        ],
      },
    });

    it('sets the app, lang, and query', () => {
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/autocomplete/?app=android&q=foo&lang=en-US`)
        .once()
        .returns(mockResponse());

      const { state } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
        lang: 'en-US',
      });

      return api.autocomplete({
        api: state.api,
        filters: {
          query: 'foo',
        },
      })
        .then(() => mockWindow.verify());
    });

    it('optionally takes addon type as filter', () => {
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/addons/autocomplete/?app=android&q=foo&type=persona&lang=en-US`)
        .once()
        .returns(mockResponse());

      const { state } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
        lang: 'en-US',
      });

      return api.autocomplete({
        api: state.api,
        filters: {
          query: 'foo',
          addonType: ADDON_TYPE_THEME,
        },
      })
        .then(() => mockWindow.verify());
    });
  });
});
