/* global window */
import querystring from 'querystring';
import url from 'url';

import config from 'config';
import utf8 from 'utf8';

import * as api from 'core/api';
import {
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
} from 'core/constants';
import {
  createFakeAutocompleteResult,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';
import {
  apiResponsePage,
  createApiResponse,
  createStubErrorHandler,
  generateHeaders,
  getFakeConfig,
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

      const clientConfig = getFakeConfig({ client: true, server: false });

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

      const serverConfig = getFakeConfig({ server: true });

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
          const { args } = errorHandler.handle.firstCall;
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
          const { args } = errorHandler.handle.firstCall;
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

    it('only adds a trailing slash when necessary', async () => {
      const endpoint = 'some-endpoint/';
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/${endpoint}`, sinon.match.any)
        .once()
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('only adds a preceding slash when necessary', async () => {
      const endpoint = '/some-endpoint/';
      mockWindow.expects('fetch')
        .withArgs(`${apiHost}/api/v3/some-endpoint/`, sinon.match.any)
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('preserves endpoint query string parameters', async () => {
      const endpoint = 'some-endpoint/?page=2';
      mockWindow.expects('fetch')
        .withArgs(
          `${apiHost}/api/v3/some-endpoint/?page=2`, sinon.match.any
        )
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('will override endpoint query string parameters', async () => {
      const endpoint = 'some-endpoint/?page=2';
      mockWindow.expects('fetch')
        .withArgs(
          `${apiHost}/api/v3/some-endpoint/?page=3`, sinon.match.any
        )
        .returns(createApiResponse());

      await api.callApi({ endpoint, params: { page: 3 } });
      mockWindow.verify();
    });

    it('will merge endpoint params with custom params', async () => {
      const endpoint = 'some-endpoint/?page=1';
      mockWindow.expects('fetch')
        .callsFake((fetchURL) => {
          const urlObj = url.parse(fetchURL, true);
          expect(urlObj.query).toEqual({ page: '1', color: 'blue' });
          return createApiResponse();
        });

      await api.callApi({ endpoint, params: { color: 'blue' } });
      mockWindow.verify();
    });

    it('converts absolute URLs to relative', async () => {
      const endpoint =
        'https://elsewhere.org/api/v3/some-endpoint/?page=2';
      mockWindow.expects('fetch')
        .withArgs(
          `${apiHost}/api/v3/some-endpoint/?page=2`, sinon.match.any
        )
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('throws an error for absolute URL with a bad prefix', async () => {
      const endpoint = 'https://elsewhere.org/nope/some-endpoint/';
      mockWindow.expects('fetch').returns(createApiResponse());

      await api.callApi({ endpoint })
        .then(unexpectedSuccess, (error) => {
          expect(error.message).toContain(endpoint);
          expect(error.message).toMatch(/unexpected prefix/);
        });
    });

    it('throws an error for undefined URLs', async () => {
      mockWindow.expects('fetch').returns(createApiResponse());

      await api.callApi({ endpoint: undefined })
        .then(unexpectedSuccess, (error) => {
          expect(error.message).toMatch(/endpoint URL cannot be falsy/);
        });
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

  describe('allPages', () => {
    it('gets results for all pages', async () => {
      let page = 0;
      const nextURL = 'some/endpoint?page=2';
      const page1results = ['one'];
      const page2results = ['two', 'three'];

      const getNextResponse = sinon.mock()
        .twice()
        .callsFake(() => {
          page += 1;
          let next;
          let results = [];
          if (page === 1) {
            next = nextURL;
            results = page1results;
          } else {
            results = page2results;
          }
          return Promise.resolve(apiResponsePage({ next, results }));
        });

      const { results } = await api.allPages(getNextResponse);

      expect(results).toEqual(page1results.concat(page2results));
      getNextResponse.verify();

      // Make sure nextURL is only passed on the second call.
      expect(getNextResponse.firstCall.args[0]).toEqual(undefined);
      expect(getNextResponse.secondCall.args[0]).toEqual(nextURL);
    });

    it('passes through response data', async () => {
      const proxiedResponse = apiResponsePage({
        count: 120,
        page_size: 25,
      });
      const response = await api.allPages(
        () => Promise.resolve(proxiedResponse)
      );

      expect(response).toEqual({
        count: proxiedResponse.count,
        page_size: proxiedResponse.page_size,
        results: [],
      });
    });

    it('passes through errors', () => {
      const error = new Error('some API error');
      return api.allPages(() => Promise.reject(error))
        .then(unexpectedSuccess, (errorResult) => {
          expect(errorResult).toEqual(error);
        });
    });

    it('gives up after too many pages', () => {
      const getNextResponse = () => Promise.resolve(apiResponsePage({
        // Return a next URL forever.
        next: 'some/endpoint?page=2',
      }));
      return api.allPages(getNextResponse, { pageLimit: 2 })
        .then(unexpectedSuccess, (error) => {
          expect(error.message).toMatch(/too many pages/);
        });
    });
  });

  describe('validateLocalizedString', () => {
    it('throws an error for invalid locale keys', () => {
      const description = { notAValidKey: 'some description' };

      expect(() => api.validateLocalizedString(description))
        .toThrow(/Unknown locale: "notAValidKey"/);
    });

    it('allows valid locale keys', () => {
      const description = { fr: 'la description' };
      api.validateLocalizedString(description);
    });

    it('throws an error for non-object values', () => {
      expect(() => api.validateLocalizedString(9))
        .toThrow('Expected an object type, got "number"');
    });
  });
});
