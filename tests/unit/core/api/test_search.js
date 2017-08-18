/* global window */
import config from 'config';

import search from 'core/api/search';
import { ADDON_TYPE_THEME, CLIENT_APP_ANDROID } from 'core/constants';
import { parsePage } from 'core/utils';
import { createApiResponse } from 'tests/unit/core/api/helpers';
import { unexpectedSuccess } from 'tests/unit/helpers';


describe(__filename, () => {
  let mockWindow;
  const apiHost = config.get('apiHost');

  beforeEach(() => {
    mockWindow = sinon.mock(window);
  });

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
      .withArgs(`${apiHost}/api/v3/addons/search/?app=android&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());
    return search({
      api: { clientApp: 'android', lang: 'en-US' },
      auth: true,
      filters: { page: parsePage(3), query: 'foo' },
    })
      .then(() => mockWindow.verify());
  });

  it('normalizes the response', () => {
    mockWindow.expects('fetch').once().returns(mockResponse());
    return search({ api: {}, auth: true, filters: { query: 'foo' } })
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
    const url = `${apiHost}/api/v3/addons/search/?page=3&q=foo&lang=en-US`;
    mockWindow.expects('fetch')
      .withArgs(url)
      .once()
      .returns(mockResponse({ ok: false, status: 401 }));

    return search({
      api: { lang: 'en-US' },
      auth: true,
      filters: { page: parsePage(3), query: 'foo' },
    })
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
    return search({
      api: { clientApp: 'android', lang: 'en-US' },
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
      .withArgs(`${apiHost}/api/v3/addons/search/?app=firefox&page=3&q=foo&lang=en-US`)
      .once()
      .returns(mockResponse());
    return search({
      api: { clientApp: 'android', lang: 'en-US' },
      filters: { clientApp: 'firefox', page: parsePage(3), query: 'foo' },
    })
      .then(() => mockWindow.verify());
  });
});
