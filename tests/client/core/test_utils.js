/* eslint-disable arrow-body-style */
import url from 'url';

import config from 'config';
import { sprintf } from 'jed';

import * as actions from 'core/actions';
import * as categoriesActions from 'core/actions/categories';
import * as api from 'core/api';
import {
  addQueryParams,
  apiAddonType,
  convertBoolean,
  findAddon,
  getClientApp,
  getClientConfig,
  isAllowedOrigin,
  isValidClientApp,
  loadAddonIfNeeded,
  loadCategoriesIfNeeded,
  ngettext,
  nl2br,
  refreshAddon,
  visibleAddonType,
} from 'core/utils';
import { fakeAddon, signedInApiState } from 'tests/client/amo/helpers';
import { unexpectedSuccess } from 'tests/client/helpers';


describe('apiAddonType', () => {
  it('maps plural/visible addonTypes to internal types', () => {
    assert.equal(apiAddonType('extensions'), 'extension');
    assert.equal(apiAddonType('themes'), 'persona');
  });

  it('fails on unrecognised plural/visible addonType', () => {
    assert.throws(() => {
      // "theme" is not a valid pluralAddonType mapping; it should be "themes".
      apiAddonType('theme');
    }, '"theme" not found in API_ADDON_TYPES_MAPPING');
  });

  // See:
  // https://github.com/mozilla/addons-frontend/pull/1541#discussion_r95861202
  it('does not return a false positive on a method', () => {
    assert.throws(() => {
      apiAddonType('hasOwnProperty');
    }, '"hasOwnProperty" not found in API_ADDON_TYPES_MAPPING');
  });
});

describe('getClientConfig', () => {
  const fakeConfig = new Map();
  fakeConfig.set('hai', 'there');
  fakeConfig.set('what', 'evar');
  fakeConfig.set('secret', 'sauce');
  fakeConfig.set('clientConfigKeys', ['hai', 'what']);

  it('should add config data to object', () => {
    const clientConfig = getClientConfig(fakeConfig);
    assert.equal(clientConfig.hai, 'there');
    assert.equal(clientConfig.what, 'evar');
    assert.equal(clientConfig.secret, undefined);
  });
});


describe('convertBoolean', () => {
  it('should see "false" as false', () => {
    assert.equal(convertBoolean('false'), false);
  });

  it('should see "0" as false', () => {
    assert.equal(convertBoolean('0'), false);
  });

  it('should see 0 as false', () => {
    assert.equal(convertBoolean(0), false);
  });

  it('should get "true" as true', () => {
    assert.equal(convertBoolean('true'), true);
  });

  it('should get "1" as true', () => {
    assert.equal(convertBoolean('1'), true);
  });

  it('should get 1 as true', () => {
    assert.equal(convertBoolean(1), true);
  });

  it('should return true for true value', () => {
    assert.equal(convertBoolean(true), true);
  });

  it('should return false for random string value', () => {
    assert.equal(convertBoolean('whatevs'), false);
  });
});


describe('getClientApplication', () => {
  const androidWebkit = [
    dedent`'Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K) AppleWebkit/534.30
      (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`,
    dedent`Mozilla/5.0 (Linux; U; Android 2.3.4; fr-fr; HTC Desire Build/GRJ22) AppleWebKit/533.1
      (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1`,
  ];

  const chromeAndroid = [
    dedent`Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C) AppleWebKit/535.19
      (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19`,
    dedent`Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76K) AppleWebKit/535.19
      (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19`,
    dedent`Mozilla/5.0 (Linux; Android 6.0.1; Nexus 6P Build/MMB29P) AppleWebKit/537.36
      (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile Safari/537.36`,
  ];

  const chrome = [
    dedent`Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko)
      Chrome/41.0.2228.0 Safari/537.36`,
    dedent`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36
      (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36`,
  ];

  const firefox = [
    'Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/10.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0',
    'Mozilla/5.0 (X11; Linux i586; rv:31.0) Gecko/20100101 Firefox/31.0',
  ];

  const firefoxOS = [
    'Mozilla/5.0 (Mobile; rv:26.0) Gecko/26.0 Firefox/26.0',
    'Mozilla/5.0 (Tablet; rv:26.0) Gecko/26.0 Firefox/26.0',
    'Mozilla/5.0 (TV; rv:44.0) Gecko/44.0 Firefox/44.0',
    'Mozilla/5.0 (Mobile; nnnn; rv:26.0) Gecko/26.0 Firefox/26.0',
  ];

  const firefoxAndroid = [
    'Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
    'Mozilla/5.0 (Android; Tablet; rv:40.0) Gecko/40.0 Firefox/40.0',
    'Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0',
    'Mozilla/5.0 (Android 4.4; Tablet; rv:41.0) Gecko/41.0 Firefox/41.0',
  ];

  const firefoxIOS = [
    dedent`Mozilla/5.0 (iPod touch; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4
      (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4`,
    dedent`Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4
      (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4`,
    dedent`Mozilla/5.0 (iPad; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4
      (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4`,
  ];

  it('should return firefox by default with no args', () => {
    assert.equal(getClientApp(), 'firefox');
  });

  it('should return firefox by default with bad type', () => {
    assert.equal(getClientApp(1), 'firefox');
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const ua of androidWebkit) {
    it(`should return 'android' for a androidWebkit UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'android');
    });
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const ua of chromeAndroid) {
    it(`should return 'android' for a chromeAndroid UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'android');
    });
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const ua of chrome) {
    it(`should fallback to 'firefox' for a chrome UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'firefox');
    });
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const ua of firefox) {
    it(`should return firefox by default for a Firefox UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'firefox');
    });
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const ua of firefoxOS) {
    it(`should return firefox by default for a Firefox OS UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'firefox');
    });
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const ua of firefoxAndroid) {
    it(`should return android for a Firefox Android UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'android');
    });
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const ua of firefoxIOS) {
    it(`should return 'firefox' for a Firefox iOS UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'firefox');
    });
  }

  it('should return "android" for a UA string that contains android not Android', () => {
    const ua = 'mozilla/5.0 (android; mobile; rv:40.0) gecko/40.0 firefox/40.0';
    assert.equal(getClientApp(ua), 'android');
  });
});


describe('isValidClientApp', () => {
  const _config = new Map();
  _config.set('validClientApplications', ['firefox', 'android']);

  it('should be valid if passed "firefox"', () => {
    assert.equal(isValidClientApp('firefox', { _config }), true);
  });

  it('should be valid if passed "android"', () => {
    assert.equal(isValidClientApp('android', { _config }), true);
  });

  it('should be invalid if passed "whatever"', () => {
    assert.equal(isValidClientApp('whatever', { _config }), false);
  });
});

describe('findAddon', () => {
  const addon = sinon.stub();
  const state = {
    addons: {
      'the-addon': addon,
    },
  };

  it('finds the add-on in the state', () => {
    assert.strictEqual(findAddon(state, 'the-addon'), addon);
  });

  it('does not find the add-on in the state', () => {
    assert.strictEqual(findAddon(state, 'different-addon'), undefined);
  });
});

describe('refreshAddon', () => {
  const addonSlug = fakeAddon.slug;
  const apiState = signedInApiState;
  let dispatch;
  let mockApi;

  beforeEach(() => {
    dispatch = sinon.spy();
    mockApi = sinon.mock(api);
  });

  it('fetches and dispatches an add-on', () => {
    const entities = { [addonSlug]: fakeAddon };
    mockApi
      .expects('fetchAddon')
      .once()
      .withArgs({ slug: addonSlug, api: apiState })
      .returns(Promise.resolve({ entities }));

    return refreshAddon({ addonSlug, apiState, dispatch })
      .then(() => {
        assert.ok(dispatch.called);
        assert.deepEqual(dispatch.firstCall.args[0],
                         actions.loadEntities(entities));
        mockApi.verify();
      });
  });

  it('handles 404s when loading the add-on', () => {
    mockApi
      .expects('fetchAddon')
      .once()
      .withArgs({ slug: addonSlug, api: signedInApiState })
      .returns(Promise.reject(new Error('Error accessing API')));
    return refreshAddon({ addonSlug, apiState, dispatch })
      .then(unexpectedSuccess,
        () => {
          assert.equal(dispatch.called, false);
        });
  });
});

describe('loadAddonIfNeeded', () => {
  const loadedSlug = 'my-addon';
  let loadedAddon;
  let dispatch;

  beforeEach(() => {
    loadedAddon = sinon.stub();
    dispatch = sinon.spy();
  });

  function makeProps(slug) {
    return {
      store: {
        getState: () => ({
          addons: {
            [loadedSlug]: loadedAddon,
          },
          api: signedInApiState,
        }),
        dispatch,
      },
      params: { slug },
    };
  }

  it('does not re-fetch the add-on if already loaded', () => {
    return loadAddonIfNeeded(makeProps(loadedSlug))
      .then(() => {
        assert.equal(dispatch.called, false,
          'loadAddonIfNeeded() dispatched an add-on unexpectedly');
      });
  });

  it('loads the add-on if it is not loaded', () => {
    const slug = 'other-addon';
    const props = makeProps(slug);
    const mockAddonRefresher = sinon.mock()
      .once()
      .withArgs({
        addonSlug: slug,
        apiState: signedInApiState,
        dispatch,
      })
      .returns(Promise.resolve());

    return loadAddonIfNeeded(props, { _refreshAddon: mockAddonRefresher })
      .then(() => {
        mockAddonRefresher.verify();
      });
  });
});

describe('loadCategoriesIfNeeded', () => {
  const apiState = { clientApp: 'android', lang: 'en-US' };
  let dispatch;
  let loadedCategories;

  beforeEach(() => {
    dispatch = sinon.spy();
    loadedCategories = ['foo', 'bar'];
  });

  function makeProps(categories = loadedCategories) {
    return {
      store: {
        getState: () => (
          {
            api: apiState,
            categories: { categories, loading: false },
          }
        ),
        dispatch,
      },
    };
  }

  it('returns the categories if loaded', () => {
    assert.strictEqual(loadCategoriesIfNeeded(makeProps()), true);
  });

  it('loads the categories if they are not loaded', () => {
    const props = makeProps([]);
    const results = ['foo', 'bar'];
    const mockApi = sinon.mock(api);
    mockApi
      .expects('categories')
      .once()
      .withArgs({ api: apiState })
      .returns(Promise.resolve({ results }));
    const action = sinon.stub();
    const mockActions = sinon.mock(categoriesActions);
    mockActions
      .expects('categoriesLoad')
      .once()
      .withArgs({ results })
      .returns(action);
    return loadCategoriesIfNeeded(props).then(() => {
      assert(dispatch.calledWith(action), 'dispatch not called');
      mockApi.verify();
      mockActions.verify();
    });
  });

  it('sends an error when it fails', () => {
    const props = makeProps([]);
    const mockApi = sinon.mock(api);
    mockApi
      .expects('categories')
      .once()
      .withArgs({ api: apiState })
      .returns(Promise.reject());
    const action = sinon.stub();
    const mockActions = sinon.mock(categoriesActions);
    mockActions
      .expects('categoriesFail')
      .once()
      .withArgs()
      .returns(action);
    return loadCategoriesIfNeeded(props).then(() => {
      assert(dispatch.calledWith(action), 'dispatch not called');
      mockApi.verify();
      mockActions.verify();
    });
  });
});

describe('nl2br', () => {
  it('converts \n to <br/>', () => {
    assert.equal(nl2br('\n'), '<br />');
  });

  it('converts \r to <br/>', () => {
    assert.equal(nl2br('\r'), '<br />');
  });

  it('converts \r\n to <br/>', () => {
    assert.equal(nl2br('\r\n'), '<br />');
  });

  it('converts multiple new lines to multiple breaks', () => {
    assert.equal(nl2br('\n\n'), '<br /><br />');
  });

  it('converts multiple new lines (Windows) to multiple breaks', () => {
    assert.equal(nl2br('\r\n\r\n'), '<br /><br />');
  });

  it('handles null text', () => {
    assert.equal(nl2br(null), '');
  });
});

describe('isAllowedOrigin', () => {
  it('disallows a random origin', () => {
    assert.equal(isAllowedOrigin('http://whatever.com'), false);
  });

  it('allows amoCDN by default', () => {
    assert.equal(isAllowedOrigin(`${config.get('amoCDN')}/foo.png`), true);
  });

  it('returns false for a bogus url', () => {
    assert.equal(isAllowedOrigin(1), false);
  });

  it('returns false for an empty string', () => {
    assert.equal(isAllowedOrigin(''), false);
  });

  it('accepts overriding the allowed origins', () => {
    const allowedOrigins = ['http://foo.com', 'https://foo.com'];
    assert.equal(isAllowedOrigin('http://foo.com', { allowedOrigins }), true);
    assert.equal(isAllowedOrigin('https://foo.com', { allowedOrigins }), true);
  });
});

describe('addQueryParams', () => {
  it('adds a query param to a plain url', () => {
    const output = addQueryParams('http://whatever.com/', { foo: 'bar' });
    assert.deepEqual(url.parse(output, true).query, { foo: 'bar' });
  });

  it('adds more than one query param to a plain url', () => {
    const output = addQueryParams('http://whatever.com/', { foo: 'bar', test: 1 });
    assert.deepEqual(url.parse(output, true).query, { foo: 'bar', test: '1' });
  });

  it('overrides an existing parameter', () => {
    const output = addQueryParams('http://whatever.com/?foo=1', { foo: 'bar' });
    assert.deepEqual(url.parse(output, true).query, { foo: 'bar' });
  });

  it('overrides multiple existing parameters', () => {
    const output = addQueryParams('http://whatever.com/?foo=1&bar=2', { foo: 'bar', bar: 'baz' });
    assert.deepEqual(url.parse(output, true).query, { foo: 'bar', bar: 'baz' });
  });

  it('leaves other params intact', () => {
    const output = addQueryParams('http://whatever.com/?foo=1&bar=2', { bar: 'updated' });
    assert.deepEqual(url.parse(output, true).query, { foo: '1', bar: 'updated' });
  });
});

describe('ngettext', () => {
  function fileCount(count) {
    return sprintf(ngettext('%(count)s file', '%(count)s files', count),
                   { count });
  }

  it('outputs singular when count is one', () => {
    assert.equal('1 file', fileCount(1));
  });

  it('outputs plural when count is zero', () => {
    assert.equal('0 files', fileCount(0));
  });

  it('outputs plural when count is above one', () => {
    assert.equal('2 files', fileCount(2));
  });
});

describe('visibleAddonType', () => {
  it('maps internal addonTypes to plural/visible types', () => {
    assert.equal(visibleAddonType('extension'), 'extensions');
    assert.equal(visibleAddonType('persona'), 'themes');
  });

  it('fails on unrecognised internal addonType', () => {
    assert.throws(() => {
      // "theme" is not a valid visible addonType; it should be "themes".
      visibleAddonType('personas');
    }, '"personas" not found in VISIBLE_ADDON_TYPES_MAPPING');
  });

  // See:
  // https://github.com/mozilla/addons-frontend/pull/1541#discussion_r95861202
  it('does not return a false positive on a method', () => {
    assert.throws(() => {
      visibleAddonType('hasOwnProperty');
    }, '"hasOwnProperty" not found in VISIBLE_ADDON_TYPES_MAPPING');
  });
});
