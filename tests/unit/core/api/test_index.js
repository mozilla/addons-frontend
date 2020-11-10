/* global window */
import querystring from 'querystring';

import FormData from '@willdurand/isomorphic-formdata';
import config from 'config';
import utf8 from 'utf8';

import * as api from 'core/api';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import {
  apiResponsePage,
  createApiResponse,
  createFakeAutocompleteResult,
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  generateHeaders,
  getFakeConfig,
  getFakeLogger,
  unexpectedSuccess,
  urlWithTheseParams,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let mockWindow;
  const apiHost = config.get('apiHost');
  const apiVersion = config.get('apiVersion');

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

  describe('core.callApi', () => {
    it('uses a browser implementation of FormData', () => {
      expect(FormData).toEqual(window.FormData);
    });

    it('does not use remote host for api calls', () => {
      expect(apiHost).toEqual('http://if-you-see-this-host-file-a-bug');
    });

    it('transforms method to upper case', async () => {
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match.any, sinon.match({ method: 'GET' }))
        .returns(createApiResponse());

      await api.callApi({ endpoint: 'resource', method: 'get' });
      mockWindow.verify();
    });

    it('adds some query string params to all requests', async () => {
      const lang = 'en-US';
      const { state } = dispatchClientMetadata({ lang });

      mockWindow
        .expects('fetch')
        .withArgs(urlWithTheseParams({ lang, wrap_outgoing_links: true }))
        .returns(createApiResponse());

      await api.callApi({ endpoint: 'resource', apiState: state.api });
      mockWindow.verify();
    });

    it('adds the regionCode header to all requests from the server', async () => {
      const regionCode = 'CA';
      const { state } = dispatchClientMetadata({ regionCode });

      mockWindow.expects('fetch').callsFake((urlString, request) => {
        expect(request.headers[api.REGION_CODE_HEADER]).toEqual(regionCode);
        return createApiResponse();
      });

      await api.callApi({
        _config: getFakeConfig({ server: true }),
        endpoint: 'resource',
        apiState: state.api,
      });
      mockWindow.verify();
    });

    it('does not add the regionCode header if it does not exist in state', async () => {
      const { state } = dispatchClientMetadata({ regionCode: null });

      mockWindow.expects('fetch').callsFake((urlString, request) => {
        expect(api.REGION_CODE_HEADER in request.headers).toEqual(false);
        return createApiResponse();
      });

      await api.callApi({ endpoint: 'resource', apiState: state.api });
      mockWindow.verify();
    });

    it('does not add the regionCode header if we are not on the server', async () => {
      const { state } = dispatchClientMetadata({ regionCode: 'CA' });

      mockWindow.expects('fetch').callsFake((urlString, request) => {
        expect(api.REGION_CODE_HEADER in request.headers).toEqual(false);
        return createApiResponse();
      });

      await api.callApi({
        _config: getFakeConfig({ server: false }),
        endpoint: 'resource',
        apiState: state.api,
      });
      mockWindow.verify();
    });

    it('can exclude wrap_outgoing_links param', async () => {
      const { state } = dispatchClientMetadata();

      mockWindow
        .expects('fetch')
        .withArgs(
          sinon.match(
            (urlString) => !urlString.includes('wrap_outgoing_links'),
          ),
        )
        .returns(createApiResponse());

      await api.callApi({
        endpoint: 'resource',
        apiState: state.api,
        wrapOutgoingLinks: false,
      });
      mockWindow.verify();
    });

    it('overrides lang parameter if already present', async () => {
      const lang = 'en-US';
      const { state } = dispatchClientMetadata({ lang });

      mockWindow
        .expects('fetch')
        .withArgs(urlWithTheseParams({ lang }))
        .returns(createApiResponse());

      await api.callApi({
        endpoint: 'resource?lang=fr',
        apiState: state.api,
      });
      mockWindow.verify();
    });

    it('does not encode non-ascii URLs in UTF8 on the client', async () => {
      const endpoint = 'project-ă-ă-â-â-日本語';
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(`/api/${apiVersion}/${endpoint}/`))
        .returns(createApiResponse());

      const clientConfig = getFakeConfig({ client: true, server: false });

      await api.callApi({ _config: clientConfig, endpoint });
      mockWindow.verify();
    });

    it('encodes non-ascii URLs in UTF8 on the server', async () => {
      const endpoint = 'diccionario-español-venezuela';
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(utf8.encode(`/api/${apiVersion}/${endpoint}/`)))
        .returns(createApiResponse());

      const serverConfig = getFakeConfig({ server: true });

      await api.callApi({ _config: serverConfig, endpoint });
      mockWindow.verify();
    });

    it('clears an error handler before making a request', async () => {
      mockWindow.expects('fetch').returns(createApiResponse());

      const errorHandler = createStubErrorHandler();
      sinon.stub(errorHandler, 'clear');

      await api.callApi({ endpoint: 'resource', errorHandler });
      sinon.assert.called(errorHandler.clear);
    });

    it('passes errors to the error handler', async () => {
      const nonFieldErrors = ['user_id and password cannot be blank'];
      mockWindow.expects('fetch').returns(
        createApiResponse({
          ok: false,
          jsonData: { non_field_errors: nonFieldErrors },
        }),
      );

      const errorHandler = createStubErrorHandler();
      sinon.stub(errorHandler, 'handle');

      await api
        .callApi({ endpoint: 'resource', errorHandler })
        .then(unexpectedSuccess, () => {
          sinon.assert.called(errorHandler.handle);
          const { args } = errorHandler.handle.firstCall;
          expect(args[0].response.data.non_field_errors).toEqual(
            nonFieldErrors,
          );
        });
    });

    it('handles error responses with JSON syntax errors', async () => {
      mockWindow.expects('fetch').returns(
        createApiResponse({
          // With the specified header and text combination,
          // this will return an invalid JSON response.
          headers: generateHeaders({ 'Content-Type': 'application/json' }),
          textData: 'pretend this was a response with invalid JSON',
        }),
      );

      const errorHandler = createStubErrorHandler();
      sinon.stub(errorHandler, 'handle');

      await api
        .callApi({ endpoint: 'resource' })
        .then(unexpectedSuccess, (err) => {
          expect(err.message).toContain('invalid json response body at');
        });
    });

    it('handles non-JSON responses', async () => {
      mockWindow.expects('fetch').returns(
        createApiResponse({
          headers: generateHeaders({ 'Content-Type': 'text/plain' }),
          textData: 'some text response',
        }),
      );

      const responseData = await api.callApi({ endpoint: 'resource' });
      mockWindow.verify();
      expect(responseData).toEqual({});
    });

    it('handles responses without a Content-Type', async () => {
      mockWindow.expects('fetch').returns(
        createApiResponse({
          headers: generateHeaders({}),
        }),
      );

      const responseData = await api.callApi({ endpoint: 'resource' });
      mockWindow.verify();
      expect(responseData).toEqual({});
    });

    it('handles any fetch error', async () => {
      mockWindow
        .expects('fetch')
        .returns(Promise.reject(new Error('this could be any error')));

      const errorHandler = createStubErrorHandler();
      sinon.stub(errorHandler, 'handle');

      await api
        .callApi({ endpoint: 'resource', errorHandler })
        .then(unexpectedSuccess, () => {
          sinon.assert.called(errorHandler.handle);
          const { args } = errorHandler.handle.firstCall;
          expect(args[0].message).toEqual('this could be any error');
        });
    });

    it('handles an oddly-cased Content-Type', async () => {
      const response = createApiResponse({
        headers: generateHeaders({ 'Content-Type': 'Application/JSON' }),
      });

      mockWindow.expects('fetch').returns(response);

      // Make sure this doesn't throw an error.
      await api.callApi({ endpoint: 'resource', method: 'GET' });
      mockWindow.verify();
    });

    it('only adds a trailing slash when necessary', async () => {
      const endpoint = 'some-endpoint/';
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(`/api/${apiVersion}/${endpoint}?`))
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('only adds a preceding slash when necessary', async () => {
      const endpoint = '/some-endpoint/';
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(`/api/${apiVersion}/some-endpoint/?`))
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('preserves endpoint query string parameters', async () => {
      const endpoint = 'some-endpoint/?page=2';
      mockWindow
        .expects('fetch')
        .withArgs(urlWithTheseParams({ page: 2 }))
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('will override endpoint query string parameters', async () => {
      const endpoint = 'some-endpoint/?page=2';
      mockWindow
        .expects('fetch')
        .withArgs(urlWithTheseParams({ page: '3' }))
        .returns(createApiResponse());

      await api.callApi({ endpoint, params: { page: 3 } });
      mockWindow.verify();
    });

    it('will merge endpoint params with custom params', async () => {
      const endpoint = 'some-endpoint/?page=1';
      mockWindow
        .expects('fetch')
        .withArgs(urlWithTheseParams({ page: '1', color: 'blue' }))
        .returns(createApiResponse());

      await api.callApi({ endpoint, params: { color: 'blue' } });
      mockWindow.verify();
    });

    it('converts true boolean to a string literal', async () => {
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match('?anyBoolean=true'))
        .returns(createApiResponse());

      await api.callApi({
        endpoint: 'some-endpoint/',
        params: { anyBoolean: true },
      });
      mockWindow.verify();
    });

    it('converts false boolean to a string literal', async () => {
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match('?anyBoolean=false'))
        .returns(createApiResponse());

      await api.callApi({
        endpoint: 'some-endpoint/',
        params: { anyBoolean: false },
      });
      mockWindow.verify();
    });

    it('converts absolute URLs to relative', async () => {
      const endpoint = `https://elsewhere.org/api/${apiVersion}/some-endpoint/`;
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(`/api/${apiVersion}/some-endpoint/`))
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('preserves query when converting absolute URLs', async () => {
      const endpoint = `https://elsewhere.org/api/${apiVersion}/some-endpoint/?page=2`;
      mockWindow
        .expects('fetch')
        .withArgs(urlWithTheseParams({ page: 2 }))
        .returns(createApiResponse());

      await api.callApi({ endpoint });
      mockWindow.verify();
    });

    it('throws an error for absolute URL with a bad prefix', async () => {
      const endpoint = 'https://elsewhere.org/nope/some-endpoint/';
      mockWindow.expects('fetch').returns(createApiResponse());

      await api.callApi({ endpoint }).then(unexpectedSuccess, (error) => {
        expect(error.message).toContain(endpoint);
        expect(error.message).toMatch(/unexpected prefix/);
      });
    });

    it('throws an error for undefined URLs', async () => {
      mockWindow.expects('fetch').returns(createApiResponse());

      await api
        .callApi({ endpoint: undefined })
        .then(unexpectedSuccess, (error) => {
          expect(error.message).toMatch(/endpoint URL cannot be falsy/);
        });
    });

    it('sends a JSON request when body is an object', async () => {
      const endpoint = `https://elsewhere.org/api/${apiVersion}/some-endpoint/`;
      const body = {
        some: 'value',
        another: 'attribute',
      };

      mockWindow
        .expects('fetch')
        .withArgs(
          sinon.match.any,
          sinon.match({
            body: JSON.stringify(body),
            headers: {
              'Content-type': 'application/json',
            },
          }),
        )
        .returns(createApiResponse());

      await api.callApi({ endpoint, body });
      mockWindow.verify();
    });

    it('does not set any "content-type" header when body is null', async () => {
      const endpoint = `https://elsewhere.org/api/${apiVersion}/some-endpoint/`;

      mockWindow
        .expects('fetch')
        .withArgs(
          sinon.match.any,
          sinon.match({
            headers: {},
          }),
        )
        .returns(createApiResponse());

      await api.callApi({ endpoint, body: null });
      mockWindow.verify();
    });

    it('does not send a JSON request when body is an instance of FormData', async () => {
      const endpoint = `https://elsewhere.org/api/${apiVersion}/some-endpoint/`;
      const body = new FormData();
      body.append('some', 'value');

      mockWindow
        .expects('fetch')
        .withArgs(
          sinon.match.any,
          sinon.match({
            body,
            // We expect no `content-type` header.
            headers: {},
          }),
        )
        .returns(createApiResponse());

      await api.callApi({ endpoint, body });
      mockWindow.verify();
    });

    it('sets a custom API version', async () => {
      const endpoint = '/some-endpoint/';
      const version = 'v123';

      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(`/api/${version}/some-endpoint/`))
        .returns(createApiResponse());

      await api.callApi({ endpoint, version });
      mockWindow.verify();
    });

    it('uses the config version as default value', async () => {
      const version = '456';
      const _config = getFakeConfig({ apiVersion: version });
      const endpoint = '/some-endpoint/';

      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(`/api/${version}/some-endpoint/`))
        .returns(createApiResponse());

      await api.callApi({ _config, endpoint });
      mockWindow.verify();
    });

    it('logs a warning message when content type is not JSON', async () => {
      const body = 'long body content'.repeat(100);
      const contentType = 'text/plain';
      const status = 204;
      const url = 'some-response-url';

      mockWindow.expects('fetch').returns(
        createApiResponse({
          headers: generateHeaders({ 'Content-Type': contentType }),
          status,
          textData: body,
          url,
        }),
      );

      const _log = getFakeLogger();

      await api.callApi({ endpoint: 'resource', _log });
      mockWindow.verify();

      sinon.assert.calledWith(
        _log.warn,
        `Response from API was not JSON (was Content-Type: ${contentType})`,
        {
          body: body.substring(0, 100),
          status,
          url,
        },
      );
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

  describe('fetchAddon', () => {
    const { api: defaultApiState } = dispatchClientMetadata().state;

    function mockResponse(responseProps = {}) {
      return createApiResponse({
        jsonData: {
          name: 'Foo!',
          slug: 'foo',
        },
        ...responseProps,
      });
    }

    const _fetchAddon = ({ apiState = defaultApiState, ...params } = {}) => {
      return api.fetchAddon({ api: apiState, ...params });
    };

    it('sets the slug', async () => {
      mockWindow
        .expects('fetch')
        .withArgs(sinon.match(`/api/${apiVersion}/addons/addon/foo/`))
        .returns(mockResponse());
      await _fetchAddon({ slug: 'foo' });
      mockWindow.verify();
    });

    it('passes app and appversion', async () => {
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:61.0) Gecko/20100101 Firefox/61.0';
      const clientApp = CLIENT_APP_FIREFOX;
      const { state } = dispatchClientMetadata({ clientApp, userAgent });

      mockWindow
        .expects('fetch')
        .withArgs(
          urlWithTheseParams({
            app: clientApp,
            appversion: '61.0',
          }),
        )
        .returns(mockResponse());

      await _fetchAddon({ apiState: state.api });
      mockWindow.verify();
    });

    it('does not pass appversion when it is not known', async () => {
      const { state } = dispatchClientMetadata({
        userAgent: 'Nothing but absolute garbage',
      });

      mockWindow
        .expects('fetch')
        .withArgs(sinon.match((url) => !url.includes('appversion=')))
        .returns(mockResponse());

      await _fetchAddon({ apiState: state.api });
      mockWindow.verify();
    });

    it('fails when the add-on is not found', async () => {
      mockWindow.expects('fetch').returns(mockResponse({ ok: false }));

      await _fetchAddon({ slug: 'foo' }).then(unexpectedSuccess, (error) => {
        expect(error.message).toMatch(
          new RegExp(`Error calling: /api/${apiVersion}/addons/addon/foo/`),
        );
      });
    });

    it('includes the authorization token if available', async () => {
      const { api: apiState } = dispatchSignInActions().state;
      mockWindow.expects('fetch').callsFake((urlString, request) => {
        expect(request.headers.authorization).toEqual(
          `Bearer ${apiState.token}`,
        );
        return mockResponse();
      });

      const addon = await _fetchAddon({ api: apiState, slug: 'bar' });

      expect(addon).toEqual({ slug: 'foo', name: 'Foo!' });
      mockWindow.verify();
    });
  });

  describe('createApiError', () => {
    function _createApiError({ response = { status: 500 }, ...params } = {}) {
      return api.createApiError({ response, ...params });
    }

    it('includes an abbreviated URL', () => {
      const error = _createApiError({
        apiURL: `${apiHost}/api/${apiVersion}/addons/addon/123/`,
      });
      expect(error.message).toMatch(
        new RegExp(`Error calling: /api/${apiVersion}/addons/addon/123/`),
      );
    });

    it('strips query params from the abbreviated URL', () => {
      const error = _createApiError({
        apiURL: `${apiHost}/api/resource/?lang=en-US`,
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
        apiURL: `${apiHost}/api/resource/`,
        response: { status: 422 },
      });
      expect(error.message).toEqual(
        'Error calling: /api/resource/ (status: 422)',
      );
    });
  });

  describe('startLoginUrl', () => {
    const getStartLoginQs = ({ _config, location }) => {
      return querystring.parse(
        api.startLoginUrl({ _config, location }).split('?')[1],
      );
    };

    it('includes the next path', () => {
      const fxaConfig = 'my-config';
      const _config = getFakeConfig({ fxaConfig });
      const location = createFakeLocation({
        pathname: '/foo',
        query: { bar: 'BAR' },
      });

      expect(getStartLoginQs({ _config, location })).toEqual({
        to: '/foo?bar=BAR',
        config: fxaConfig,
      });
    });

    it('uses the API version from config', () => {
      const version = 'v789';
      const _config = getFakeConfig({ apiVersion: version });
      const location = createFakeLocation();

      expect(api.startLoginUrl({ _config, location })).toContain(
        `/api/${version}/accounts/login/start/`,
      );
    });
  });

  describe('logOutFromServer', async () => {
    it('makes a delete request to the session endpoint', async () => {
      const { state } = dispatchSignInActions();

      const mockResponse = createApiResponse({ jsonData: { ok: true } });
      mockWindow
        .expects('fetch')
        .withArgs(
          sinon.match(`/api/${apiVersion}/accounts/session/`),
          sinon.match({
            credentials: 'include',
            method: 'DELETE',
          }),
        )
        .returns(mockResponse);

      await api.logOutFromServer({ api: state.api });
      mockWindow.verify();
    });
  });

  describe('autocomplete api', () => {
    const { api: defaultApiState } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
      lang: 'en-US',
    }).state;

    const mockResponse = () =>
      createApiResponse({
        jsonData: {
          results: [
            createFakeAutocompleteResult({ name: 'foo' }),
            createFakeAutocompleteResult({ name: 'food' }),
            createFakeAutocompleteResult({ name: 'football' }),
          ],
        },
      });

    it('sets the app and query', async () => {
      mockWindow
        .expects('fetch')
        .withArgs(
          urlWithTheseParams({
            q: 'foo',
            app: defaultApiState.clientApp,
          }),
        )
        .returns(mockResponse());

      await api.autocomplete({
        api: defaultApiState,
        filters: {
          query: 'foo',
        },
      });
      mockWindow.verify();
    });

    it('optionally takes addon type as filter', async () => {
      mockWindow
        .expects('fetch')
        .withArgs(
          urlWithTheseParams({
            q: 'foo',
            type: ADDON_TYPE_STATIC_THEME,
          }),
        )
        .returns(mockResponse());

      await api.autocomplete({
        api: defaultApiState,
        filters: {
          query: 'foo',
          addonType: ADDON_TYPE_STATIC_THEME,
        },
      });
      mockWindow.verify();
    });
  });

  describe('allPages', () => {
    it('gets results for all pages', async () => {
      let page = 0;
      const nextURL = 'some/endpoint?page=2';
      const page1results = ['one'];
      const page2results = ['two', 'three'];

      const getNextResponse = sinon
        .mock()
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
        page_size: api.DEFAULT_API_PAGE_SIZE,
      });
      const response = await api.allPages(() =>
        Promise.resolve(proxiedResponse),
      );

      expect(response).toEqual({
        count: proxiedResponse.count,
        page_size: proxiedResponse.page_size,
        results: [],
      });
    });

    it('passes through errors', async () => {
      const error = new Error('some API error');
      await api
        .allPages(() => Promise.reject(error))
        .then(unexpectedSuccess, (errorResult) => {
          expect(errorResult).toEqual(error);
        });
    });

    it('gives up after too many pages', async () => {
      const getNextResponse = () =>
        Promise.resolve(
          apiResponsePage({
            // Return a next URL forever.
            next: 'some/endpoint?page=2',
          }),
        );
      await api
        .allPages(getNextResponse, { pageLimit: 2 })
        .then(unexpectedSuccess, (error) => {
          expect(error.message).toMatch(/too many pages/);
        });
    });
  });

  describe('validateLocalizedString', () => {
    it('throws an error for invalid locale keys', () => {
      const description = { notAValidKey: 'some description' };

      expect(() => api.validateLocalizedString(description)).toThrow(
        /Unknown locale: "notAValidKey"/,
      );
    });

    it('allows valid locale keys', () => {
      const description = { fr: 'la description' };
      api.validateLocalizedString(description);
    });

    it('throws an error for non-object values', () => {
      expect(() => api.validateLocalizedString(9)).toThrow(
        'Expected an object type, got "number"',
      );
    });
  });
});
