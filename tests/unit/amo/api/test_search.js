/* global window */
import { search } from 'amo/api/search';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  RECOMMENDED,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_RELEVANCE,
} from 'amo/constants';
import {
  createApiResponse,
  dispatchSignInActions,
  fakeAddon,
  unexpectedSuccess,
  urlWithTheseParams,
  userAgents,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let api;
  let mockWindow;
  const firefox57 = userAgents.firefox[5];

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
      filters: { page: 3, query: 'foo' },
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

    mockWindow
      .expects('fetch')
      .withArgs(urlWithTheseParams({ page, q: query }))
      .returns(mockResponse());

    return _search({ filters: { page, query } }).then(() =>
      mockWindow.verify(),
    );
  });

  it('sets appversion if Firefox version is 57 or above', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefox57,
    }).store.getState().api;

    mockWindow
      .expects('fetch')
      .withArgs(urlWithTheseParams({ appversion: '57.1' }))
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
  });

  it('sets appversion if Firefox for Android', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_ANDROID,
      userAgent: userAgents.firefoxAndroid[4],
    }).store.getState().api;

    mockWindow
      .expects('fetch')
      .withArgs(urlWithTheseParams({ appversion: '57.0' }))
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
  });

  it('does not set appversion if Firefox for iOS', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: userAgents.firefoxIOS[2],
    }).store.getState().api;

    mockWindow.expects('fetch').callsFake((urlString) => {
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

    mockWindow.expects('fetch').callsFake((urlString) => {
      expect(urlString).not.toContain('appversion');
      return mockResponse();
    });

    return _search().then(() => mockWindow.verify());
  });

  it('sets appversion', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefox57,
    }).store.getState().api;

    mockWindow
      .expects('fetch')
      .withArgs(urlWithTheseParams({ appversion: '57.1' }))
      .returns(mockResponse());

    return _search({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        query: 'foo',
      },
    }).then(() => mockWindow.verify());
  });

  it('sets appversion if addonType is not set', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefox57,
    }).store.getState().api;

    mockWindow
      .expects('fetch')
      .withArgs(urlWithTheseParams({ appversion: '57.1' }))
      .once()
      .returns(mockResponse());

    return _search({ addonType: undefined }).then(() => mockWindow.verify());
  });

  it('surfaces status and apiURL on Error instance', () => {
    mockWindow
      .expects('fetch')
      .returns(mockResponse({ ok: false, status: 401 }));

    return _search().then(unexpectedSuccess, (err) => {
      expect(err.response.status).toEqual(401);
      expect(err.response.apiURL).toMatch('/api/v5/addons/search/');
    });
  });

  it('removes sort=random when the promoted filter is missing', () => {
    mockWindow
      .expects('fetch')
      .withArgs(sinon.match((url) => !url.includes('sort')))
      .returns(mockResponse());

    return _search({ filters: { sort: SEARCH_SORT_RANDOM } }).then(() => {
      mockWindow.verify();
    });
  });

  it('removes sort=random when the promoted and query filters are set', () => {
    const promoted = RECOMMENDED;
    const q = 'some_query';

    mockWindow
      .expects('fetch')
      .withArgs(sinon.match((url) => !url.includes('sort')))
      .withArgs(urlWithTheseParams({ promoted, q }))
      .returns(mockResponse());

    return _search({
      filters: { sort: SEARCH_SORT_RANDOM, promoted, query: q },
    }).then(() => {
      mockWindow.verify();
    });
  });

  it('does not remove sort=random when promoted is set', () => {
    const promoted = RECOMMENDED;
    const sort = SEARCH_SORT_RANDOM;

    mockWindow
      .expects('fetch')
      .withArgs(urlWithTheseParams({ sort, promoted }))
      .returns(mockResponse());

    return _search({ filters: { sort, promoted } }).then(() => {
      mockWindow.verify();
    });
  });

  it('does not remove the sort filter when its value is not "random"', () => {
    const promoted = RECOMMENDED;
    const sort = SEARCH_SORT_RELEVANCE;

    mockWindow
      .expects('fetch')
      .withArgs(urlWithTheseParams({ sort, promoted }))
      .returns(mockResponse());

    return _search({ filters: { sort, promoted } }).then(() => {
      mockWindow.verify();
    });
  });

  it('calls fixFiltersForClientApp to adjust the filters', () => {
    const filters = { query: 'foo' };
    const _fixFiltersForClientApp = sinon.stub().returns(filters);

    mockWindow.expects('fetch').returns(mockResponse());

    return _search({ _fixFiltersForClientApp, filters }).then(() => {
      sinon.assert.calledWith(_fixFiltersForClientApp, { api, filters });
    });
  });
});
