import url from 'url';

import { oneLine } from 'common-tags';
import React from 'react';
import config from 'config';
import { sprintf } from 'jed';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { compose } from 'redux';
import UAParser from 'ua-parser-js';

import * as actions from 'core/actions';
import * as categoriesActions from 'core/actions/categories';
import * as api from 'core/api';
import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import {
  addQueryParams,
  apiAddonType,
  convertBoolean,
  findAddon,
  getClientApp,
  getClientCompatibility,
  getClientConfig,
  getCompatibleVersions,
  isAllowedOrigin,
  isCompatibleWithUserAgent,
  isValidClientApp,
  loadAddonIfNeeded,
  loadCategoriesIfNeeded,
  ngettext,
  nl2br,
  refreshAddon,
  render404IfConfigKeyIsFalse,
  safeAsyncConnect,
  safePromise,
  visibleAddonType,
  trimAndAddProtocolToUrl,
} from 'core/utils';
import NotFound from 'core/components/ErrorPage/NotFound';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon, signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst, unexpectedSuccess, userAgents }
  from 'tests/client/helpers';


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


describe('getClientApp', () => {
  it('should return firefox by default with no args', () => {
    assert.equal(getClientApp(), 'firefox');
  });

  it('should return firefox by default with bad type', () => {
    assert.equal(getClientApp(1), 'firefox');
  });

  userAgents.androidWebkit.forEach((ua) => {
    it(`should return 'android' for a androidWebkit UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'android');
    });
  });

  userAgents.chromeAndroid.forEach((ua) => {
    it(`should return 'android' for a chromeAndroid UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'android');
    });
  });

  userAgents.chrome.forEach((ua) => {
    it(`should fallback to 'firefox' for a chrome UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'firefox');
    });
  });

  userAgents.firefox.forEach((ua) => {
    it(`should return firefox by default for a Firefox UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'firefox');
    });
  });

  userAgents.firefoxOS.forEach((ua) => {
    it(`should return firefox by default for a Firefox OS UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'firefox');
    });
  });

  userAgents.firefoxAndroid.forEach((ua) => {
    it(`should return android for a Firefox Android UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'android');
    });
  });

  userAgents.firefoxIOS.forEach((ua) => {
    it(`should return 'firefox' for a Firefox iOS UA string ${ua}`, () => {
      assert.equal(getClientApp(ua), 'firefox');
    });
  });

  it('should return "android" for lowercase UA string', () => {
    // This UA string has android, not Android.
    const ua = 'mozilla/5.0 (android; mobile; rv:40.0) gecko/40.0 firefox/40.0';
    assert.equal(getClientApp(ua), 'android');
  });
});

describe('isCompatibleWithUserAgent', () => {
  it('should throw if no userAgentInfo supplied', () => {
    assert.throws(() => {
      isCompatibleWithUserAgent({ userAgent: null, reason: null });
    }, 'userAgentInfo is required');
  });

  it('is incompatible with Android/webkit', () => {
    userAgents.androidWebkit.forEach((userAgent) => {
      assert.deepEqual(
        isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }),
        { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX },
        `UA string: ${userAgent}`);
    });
  });

  it('is incompatible with Chrome Android', () => {
    userAgents.chromeAndroid.forEach((userAgent) => {
      assert.deepEqual(
        isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }),
        { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX },
        `UA string: ${userAgent}`);
    });
  });

  it('is incompatible with Chrome desktop', () => {
    userAgents.chrome.forEach((userAgent) => {
      assert.deepEqual(
        isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }),
        { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX },
        `UA string: ${userAgent}`);
    });
  });

  it('is compatible with Firefox desktop', () => {
    userAgents.firefox.forEach((userAgent) => {
      assert.deepEqual(
        isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }),
        { compatible: true, reason: null },
        `UA string: ${userAgent}`);
    });
  });

  it('is compatible with Firefox Android', () => {
    userAgents.firefoxAndroid.forEach((userAgent) => {
      assert.deepEqual(
        isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }),
        { compatible: true, reason: null },
        `UA string: ${userAgent}`);
    });
  });

  it('is compatible with Firefox OS', () => {
    userAgents.firefoxOS.forEach((userAgent) => {
      assert.deepEqual(
        isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }),
        { compatible: true, reason: null },
        `UA string: ${userAgent}`);
    });
  });

  it('is incompatible with Firefox iOS', () => {
    userAgents.firefoxIOS.forEach((userAgent) => {
      assert.deepEqual(
        isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }),
        { compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS },
        `UA string: ${userAgent}`);
    });
  });

  it(oneLine`should use a Firefox for iOS reason code even if minVersion is
    also not met`, () => {
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '8.0' },
      os: { name: 'iOS' },
    };
    assert.deepEqual(
      isCompatibleWithUserAgent({ minVersion: '9.0', userAgentInfo }),
      { compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS }
    );
  });

  it('should mark non-Firefox UAs as incompatible', () => {
    const userAgentInfo = { browser: { name: 'Chrome' } };
    assert.deepEqual(
      isCompatibleWithUserAgent({ userAgentInfo }),
      { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
  });

  it('should mark Firefox 10 as incompatible with a minVersion of 10.1', () => {
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '10.0' },
      os: { name: 'Windows' },
    };
    assert.deepEqual(isCompatibleWithUserAgent({
      minVersion: '10.1', userAgentInfo }),
      { compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION });
  });

  it('should mark Firefox 24 as compatible with a maxVersion of 8', () => {
    // https://github.com/mozilla/addons-frontend/issues/2074
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '24.0' },
      os: { name: 'Windows' },
    };
    assert.deepEqual(isCompatibleWithUserAgent({
      maxVersion: '8', userAgentInfo }),
      { compatible: true, reason: null });
  });

  it('should mark Firefox as compatible when no min or max version', () => {
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '10.0' },
      os: { name: 'Windows' },
    };
    assert.deepEqual(isCompatibleWithUserAgent({ userAgentInfo }),
      { compatible: true, reason: null });
  });

  it('should mark Firefox as compatible with maxVersion of "*"', () => {
    // WebExtensions are marked as having a maxVersion of "*" by addons-server
    // if their manifests don't contain explicit version information.
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '54.0' },
      os: { name: 'Windows' },
    };
    assert.deepEqual(isCompatibleWithUserAgent({
      maxVersion: '*', userAgentInfo }),
      { compatible: true, reason: null });
  });

  it('should log warning when minVersion is "*"', () => {
    // Note that this should never happen as addons-server will mark a
    // WebExtension with no minVersion as having a minVersion of "48".
    // Still, we accept it (but it will log a warning).
    const fakeLog = { error: sinon.stub() };
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '54.0' },
      os: { name: 'Windows' },
    };
    assert.deepEqual(isCompatibleWithUserAgent({
      _log: fakeLog, minVersion: '*', userAgentInfo }),
      { compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION });
    assert.include(fakeLog.error.firstCall.args[0],
      'minVersion of "*" was passed to isCompatibleWithUserAgent()');
  });

  it('is incompatible with empty user agent values', () => {
    const userAgentInfo = { browser: { name: '' } };
    assert.deepEqual(isCompatibleWithUserAgent({ userAgentInfo }),
      { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
  });

  it('is incompatible with non-string user agent values', () => {
    const userAgentInfo = { browser: { name: null }, os: { name: null } };
    assert.deepEqual(isCompatibleWithUserAgent({ userAgentInfo }),
      { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
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

describe('safeAsyncConnect', () => {
  it('wraps promise callbacks in safePromise', () => {
    const asyncConnect = sinon.stub();

    safeAsyncConnect(
      [{
        promise: () => {
          throw new Error('error in callback');
        },
      }],
      { asyncConnect }
    );

    assert.ok(asyncConnect.called, 'asyncConnect() was not called');

    const aConfig = asyncConnect.firstCall.args[0][0];
    return aConfig.promise().then(unexpectedSuccess, (error) => {
      assert.equal(error.message, 'error in callback');
    });
  });

  it('requires a promise', () => {
    assert.throws(() => safeAsyncConnect([{ key: 'thing' }]),
      /Expected safeAsyncConnect.* config to define a promise/);
  });

  it('adds a deferred: true property', () => {
    const asyncConnect = sinon.stub();

    safeAsyncConnect(
      [{
        promise: () => {
          throw new Error('error in callback');
        },
      }],
      { asyncConnect }
    );

    assert.ok(asyncConnect.called, 'asyncConnect() was not called');

    const aConfig = asyncConnect.firstCall.args[0][0];
    assert.strictEqual(aConfig.deferred, true);
  });

  it('passes through other params', () => {
    const asyncConnect = sinon.stub();

    safeAsyncConnect(
      [{
        key: 'SomeKey',
        promise: () => {},
      }],
      { asyncConnect }
    );

    assert.ok(asyncConnect.called, 'asyncConnect() was not called');

    const aConfig = asyncConnect.firstCall.args[0][0];
    assert.equal(aConfig.key, 'SomeKey');
  });

  it('passes through all configs', () => {
    const asyncConnect = sinon.stub();

    const config1 = { key: 'one', promise: () => {} };
    const config2 = { key: 'two', promise: () => {} };
    safeAsyncConnect([config1, config2], { asyncConnect });

    assert.ok(asyncConnect.called, 'asyncConnect() was not called');

    assert.equal(asyncConnect.firstCall.args[0][0].key, 'one');
    assert.equal(asyncConnect.firstCall.args[0][1].key, 'two');
  });

  it('fills in an empty key to configs', () => {
    const asyncConnect = sinon.stub();

    safeAsyncConnect([{
      promise: () => Promise.resolve(),
    }], { asyncConnect });

    assert.equal(
      asyncConnect.firstCall.args[0][0].key,
      '__safeAsyncConnect_key__');
  });
});

describe('safePromise', () => {
  it('passes through a promised value', () => {
    const asPromised = safePromise(() => Promise.resolve('return value'));
    return asPromised().then((returnedValue) => {
      assert.equal(returnedValue, 'return value');
    });
  });

  it('passes along all arguments', () => {
    const callback = sinon.spy(() => Promise.resolve());
    const asPromised = safePromise(callback);
    return asPromised('one', 'two', 'three').then(() => {
      assert.ok(callback.called, 'callback was never called');
      assert.deepEqual(callback.firstCall.args, ['one', 'two', 'three']);
    });
  });

  it('catches errors and returns them as rejected promises', () => {
    const message = 'well, that was unfortunate';
    const asPromised = safePromise(() => {
      throw new Error(message);
    });
    return asPromised().then(unexpectedSuccess, (error) => {
      assert.equal(error.message, message);
    });
  });
});

describe('trimAndAddProtocolToUrl', () => {
  it('adds a protocol to a URL if missing', () => {
    assert.equal(
      trimAndAddProtocolToUrl('test.com'), 'http://test.com');
  });

  it('trims whitespace on a URL', () => {
    assert.equal(
      trimAndAddProtocolToUrl(' test.com '), 'http://test.com');
  });

  it('works with HTTPS URLs', () => {
    assert.equal(
      trimAndAddProtocolToUrl('https://test.com'), 'https://test.com');
  });
});

describe('render404IfConfigKeyIsFalse', () => {
  function render(
    props = {},
    {
      configKey = 'someConfigKey',
      _config = { get: () => true },
      SomeComponent = () => <div />,
    } = {}
  ) {
    const WrappedComponent = compose(
      render404IfConfigKeyIsFalse(configKey, { _config }),
    )(SomeComponent);

    return renderIntoDocument(
      <I18nProvider i18n={getFakeI18nInst()}>
        <WrappedComponent {...props} />
      </I18nProvider>
    );
  }

  it('requires a config key', () => {
    assert.throws(() => render404IfConfigKeyIsFalse(), /configKey cannot be empty/);
  });

  it('returns a 404 when disabled by the config', () => {
    const configKey = 'customConfigKey';
    const _config = {
      get: sinon.spy(() => false),
    };
    const root = render({}, { _config, configKey });
    const node = findRenderedComponentWithType(root, NotFound);

    assert.ok(node, '<NotFound /> was not rendered');
    assert.ok(_config.get.called, 'config.get() was not called');
    assert.equal(_config.get.firstCall.args[0], configKey);
  });

  it('passes through component and props when enabled', () => {
    const _config = { get: () => true };
    const SomeComponent = sinon.spy(() => <div />);
    render({ color: 'orange', size: 'large' }, { SomeComponent, _config });

    assert.ok(SomeComponent.called, '<SomeComponent /> was not rendered');
    const props = SomeComponent.firstCall.args[0];
    assert.equal(props.color, 'orange');
    assert.equal(props.size, 'large');
  });
});

describe('getCompatibleVersions', () => {
  it('gets the min and max versions', () => {
    const addon = {
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        compatibility: {
          firefox: {
            max: '20.0.*',
            min: '11.0.1',
          },
        },
      },
    };
    const { maxVersion, minVersion } = getCompatibleVersions({
      addon, clientApp: 'firefox' });

    assert.equal(maxVersion, '20.0.*');
    assert.equal(minVersion, '11.0.1');
  });

  it('gets null if the clientApp does not match', () => {
    const addon = {
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        compatibility: {
          firefox: {
            max: '20.0.*',
            min: '11.0.1',
          },
        },
      },
    };
    const { maxVersion, minVersion } = getCompatibleVersions({
      addon, clientApp: 'android' });

    assert.equal(maxVersion, null);
    assert.equal(minVersion, null);
  });

  it('returns null if clientApp has no compatibility', () => {
    const addon = {
      ...fakeAddon,
      current_version: {
        ...fakeAddon.current_version,
        compatibility: {},
      },
    };
    const { maxVersion, minVersion } = getCompatibleVersions({
      addon, clientApp: 'firefox' });

    assert.equal(maxVersion, null);
    assert.equal(minVersion, null);
  });

  it('returns null if current_version does not exist', () => {
    const addon = {
      ...fakeAddon,
      current_version: null,
    };
    const { maxVersion, minVersion } = getCompatibleVersions({
      addon, clientApp: 'firefox' });

    assert.equal(maxVersion, null);
    assert.equal(minVersion, null);
  });

  it('returns null if addon is null', () => {
    const { maxVersion, minVersion } = getCompatibleVersions({
      addon: null, clientApp: 'firefox' });

    assert.equal(maxVersion, null);
    assert.equal(minVersion, null);
  });
});

describe('getClientCompatibility', () => {
  it('returns true for Firefox (reason undefined when compatibile)', () => {
    const { browser, os } = UAParser(userAgents.firefox[0]);
    const userAgentInfo = { browser, os };

    assert.deepEqual(
      getClientCompatibility({
        addon: fakeAddon,
        clientApp: 'firefox',
        userAgentInfo,
      }),
      {
        compatible: true,
        maxVersion: null,
        minVersion: null,
        reason: null,
      }
    );
  });

  it('returns maxVersion when set', () => {
    const { browser, os } = UAParser(userAgents.firefox[0]);
    const userAgentInfo = { browser, os };

    assert.deepEqual(
      getClientCompatibility({
        addon: {
          ...fakeAddon,
          current_version: {
            compatibility: {
              firefox: { max: '200.0', min: null },
            },
          },
        },
        clientApp: 'firefox',
        userAgentInfo,
      }),
      {
        compatible: true,
        maxVersion: '200.0',
        minVersion: null,
        reason: null,
      }
    );
  });

  it('returns minVersion when set', () => {
    const { browser, os } = UAParser(userAgents.firefox[0]);
    const userAgentInfo = { browser, os };

    assert.deepEqual(
      getClientCompatibility({
        addon: {
          ...fakeAddon,
          current_version: {
            compatibility: {
              firefox: { max: null, min: '2.0' },
            },
          },
        },
        clientApp: 'firefox',
        userAgentInfo,
      }),
      {
        compatible: true,
        maxVersion: null,
        minVersion: '2.0',
        reason: null,
      }
    );
  });

  it('returns incompatible for non-Firefox UA', () => {
    const { browser, os } = UAParser(userAgents.firefox[0]);
    const userAgentInfo = { browser, os };

    assert.deepEqual(
      getClientCompatibility({
        addon: fakeAddon,
        clientApp: 'firefox',
        userAgentInfo,
      }),
      {
        compatible: true,
        maxVersion: null,
        minVersion: null,
        reason: null,
      }
    );
  });
});
