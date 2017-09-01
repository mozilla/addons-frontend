/* global window */
import config from 'config';

import search from 'core/api/search';
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
  userAgents,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let api;
  let mockWindow;
  const apiHost = config.get('apiHost');
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

  it('sets the lang, limit, page and query', () => {
    // FIXME: This shouldn't fail if the args are in a different order.
    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());
    return _search().then(() => mockWindow.verify());
  });

  it('sets appversion if Firefox version is 57 or above', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefox57,
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&appversion=57.1&page=3&q=foo&lang=en-US`)
      .once()
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
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
  });

  it('sets appversion if Firefox for Android', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_ANDROID,
      userAgent: userAgents.firefoxAndroid[4],
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/search/?app=android&appversion=57.0&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
  });

  it('does not set appversion if Firefox for iOS', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: userAgents.firefoxIOS[3],
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
  });

  it('does not set appversion if browser is not Firefox', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: 'Lynx Beta',
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
  });

  it('sets appversion if browser is Firefox 57+', () => {
    api = dispatchSignInActions({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: firefox57,
    }).store.getState().api;

    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&appversion=57.1&page=3&q=foo&type=extension&lang=en-US`)
      .once()
      .returns(mockResponse());

    return _search({
      filters: {
        addonType: ADDON_TYPE_EXTENSION,
        page: parsePage(3),
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
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&appversion=57.1&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());

    return _search().then(() => mockWindow.verify());
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
    const url = `${apiHost}/api/v3/addons/search/?app=firefox&page=3&q=foo&lang=en-US`;
    mockWindow.expects('fetch')
      .withArgs(url)
      .once()
      .returns(mockResponse({ ok: false, status: 401 }));

    return _search()
      .then(unexpectedSuccess, (err) => {
        expect(err.response.status).toEqual(401);
        expect(err.response.apiURL).toEqual(url);
      });
  });

  it('changes theme requests for android to firefox results', () => {
    // FIXME: This shouldn't fail if the args are in a different order.
    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&page=3&type=persona&lang=en-US`)
      .once()
      .returns(mockResponse());

    return _search({
      filters: {
        addonType: ADDON_TYPE_THEME,
        clientApp: CLIENT_APP_ANDROID,
        page: parsePage(3),
      },
    })
      .then(() => mockWindow.verify());
  });

  it('allows overrides to clientApp', () => {
    // FIXME: This shouldn't fail if the args are in a different order.
    mockWindow.expects('fetch')
      .withArgs(`${apiHost}/api/v3/addons/search/?app=android&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());
    return _search({
      filters: {
        clientApp: CLIENT_APP_ANDROID,
        page: parsePage(3),
        query: 'foo',
      },
    })
      .then(() => mockWindow.verify());
  });
});
