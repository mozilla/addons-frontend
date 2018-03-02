/* global window */
import { search } from 'core/api/search';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import { parsePage } from 'core/utils';
import { dispatchSignInActions, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createApiResponse,
  unexpectedSuccess,
  urlWithTheseParams,
  userAgents,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let api;
  let mockWindow;
  const firefox57 = userAgents.firefox[5];
  const firefoxESR52 = userAgents.firefox[4];

  beforeEach(() => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
    }).store.getState().api;
    mockWindow = sinon.mock(window);
  });

  function _search(extraArguments = {}) {
    return search({
      api,
      auth: true,
      filters: { page: parsePage(3), query: 'foo' },
      ...extraArguments,
    });
  }

  function mockResponse(responseProps = {}) {
    return createApiResponse({
      jsonData: {
        results: [
          { ...fakeAddon, slug: 'foo' },
          { ...fakeAddon, slug: 'food' },
          { ...fakeAddon, slug: 'football' },
        ],
      },
      ...responseProps,
    });
  }

  it('sets the page and query', () => {
    const page = 4;
    const query = 'youtube';

    mockWindow.expects('fetch')
      .withArgs(urlWithTheseParams({ page, q: query }))
      .returns(mockResponse());

    return _search({ filters: { page, query } })
      .then(() => mockWindow.verify());
  });

  it('sets appversion if Firefox version is 57 or above', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefox57,
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(urlWithTheseParams({ appversion: '57.1' }))
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
  });

  // See: https://github.com/mozilla/addons-frontend/pull/2969#issuecomment-323551742
  it('does not set appversion if version is below 57', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefoxESR52,
    }).store.getState().api;

    mockWindow.expects('fetch')
      .callsFake((urlString) => {
        expect(urlString).not.toContain('appversion');
        return mockResponse();
      });

    return _search().then(() => mockWindow.verify());
  });

  it('sets appversion if Firefox for Android', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_ANDROID,
      userAgent: userAgents.firefoxAndroid[4],
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(urlWithTheseParams({ appversion: '57.0' }))
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
  });

  it('does not set appversion if Firefox for iOS', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: userAgents.firefoxIOS[3],
    }).store.getState().api;

    mockWindow.expects('fetch')
      .callsFake((urlString) => {
        expect(urlString).not.toContain('appversion');
        return mockResponse();
      });

    return _search().then(() => mockWindow.verify());
  });

  it('does not set appversion if browser is not Firefox', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: 'Lynx Beta',
    }).store.getState().api;

    mockWindow.expects('fetch')
      .callsFake((urlString) => {
        expect(urlString).not.toContain('appversion');
        return mockResponse();
      });

    return _search().then(() => mockWindow.verify());
  });

  it('sets appversion if browser is Firefox 57+', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefox57,
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(urlWithTheseParams({ appversion: '57.1' }))
      .returns(mockResponse());

    return _search({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query: 'foo',
      },
    })
      .then(() => mockWindow.verify());
  });

  it('sets appversion if addonType is not set', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefox57,
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(urlWithTheseParams({ appversion: '57.1' }))
      .once()
      .returns(mockResponse());

    return _search({ addonType: undefined }).then(() => mockWindow.verify());
  });

  it('normalizes the response', () => {
    mockWindow.expects('fetch').once().returns(mockResponse());

    return _search({ filters: { query: 'foo' } })
      .then((results) => {
        expect(results.result.results).toEqual(['foo', 'food', 'football']);
        expect(results.entities).toEqual({
          addons: {
            foo: { ...fakeAddon, slug: 'foo' },
            food: { ...fakeAddon, slug: 'food' },
            football: { ...fakeAddon, slug: 'football' },
          },
        });
      });
  });

  it('surfaces status and apiURL on Error instance', () => {
    mockWindow.expects('fetch')
      .returns(mockResponse({ ok: false, status: 401 }));

    return _search()
      .then(unexpectedSuccess, (err) => {
        expect(err.response.status).toEqual(401);
        expect(err.response.apiURL).toMatch('/api/v3/addons/search/');
      });
  });

  it('changes theme requests for android to firefox results', async () => {
    mockWindow.expects('fetch')
      .withArgs(urlWithTheseParams({
        app: CLIENT_APP_FIREFOX, type: ADDON_TYPE_THEME,
      }))
      .returns(mockResponse());

    await _search({
      filters: {
        addonType: ADDON_TYPE_THEME,
        clientApp: CLIENT_APP_ANDROID,
      },
    });
    mockWindow.verify();
  });
});
