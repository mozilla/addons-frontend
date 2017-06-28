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
import * as api from 'core/api';
import {
  ADDON_TYPE_OPENSEARCH,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NO_OPENSEARCH,
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
  ngettext,
  nl2br,
  refreshAddon,
  render404IfConfigKeyIsFalse,
  safeAsyncConnect,
  safePromise,
  visibleAddonType,
  trimAndAddProtocolToUrl,
} from 'core/utils';
import { getIconUrl } from 'core/imageUtils';
import NotFound from 'core/components/ErrorPage/NotFound';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon, signedInApiState } from 'tests/unit/amo/helpers';
import { getFakeI18nInst, unexpectedSuccess, userAgents }
  from 'tests/unit/helpers';
import fallbackIcon from 'amo/img/icons/default-64.png';


describe('apiAddonType', () => {
  it('maps plural/visible addonTypes to internal types', () => {
    expect(apiAddonType('extensions')).toEqual('extension');
    expect(apiAddonType('themes')).toEqual('persona');
  });

  it('fails on unrecognised plural/visible addonType', () => {
    expect(() => {
      // "theme" is not a valid pluralAddonType mapping; it should be "themes".
      apiAddonType('theme');
    }).toThrowError('"theme" not found in API_ADDON_TYPES_MAPPING');
  });

  // See:
  // https://github.com/mozilla/addons-frontend/pull/1541#discussion_r95861202
  it('does not return a false positive on a method', () => {
    expect(() => {
      apiAddonType('hasOwnProperty');
    }).toThrowError('"hasOwnProperty" not found in API_ADDON_TYPES_MAPPING');
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
    expect(clientConfig.hai).toEqual('there');
    expect(clientConfig.what).toEqual('evar');
    expect(clientConfig.secret).toEqual(undefined);
  });
});


describe('convertBoolean', () => {
  it('should see "false" as false', () => {
    expect(convertBoolean('false')).toEqual(false);
  });

  it('should see "0" as false', () => {
    expect(convertBoolean('0')).toEqual(false);
  });

  it('should see 0 as false', () => {
    expect(convertBoolean(0)).toEqual(false);
  });

  it('should get "true" as true', () => {
    expect(convertBoolean('true')).toEqual(true);
  });

  it('should get "1" as true', () => {
    expect(convertBoolean('1')).toEqual(true);
  });

  it('should get 1 as true', () => {
    expect(convertBoolean(1)).toEqual(true);
  });

  it('should return true for true value', () => {
    expect(convertBoolean(true)).toEqual(true);
  });

  it('should return false for random string value', () => {
    expect(convertBoolean('whatevs')).toEqual(false);
  });
});


describe('getClientApp', () => {
  it('should return firefox by default with no args', () => {
    expect(getClientApp()).toEqual('firefox');
  });

  it('should return firefox by default with bad type', () => {
    expect(getClientApp(1)).toEqual('firefox');
  });

  userAgents.androidWebkit.forEach((ua) => {
    it(`should return 'android' for a androidWebkit UA string ${ua}`, () => {
      expect(getClientApp(ua)).toEqual('android');
    });
  });

  userAgents.chromeAndroid.forEach((ua) => {
    it(`should return 'android' for a chromeAndroid UA string ${ua}`, () => {
      expect(getClientApp(ua)).toEqual('android');
    });
  });

  userAgents.chrome.forEach((ua) => {
    it(`should fallback to 'firefox' for a chrome UA string ${ua}`, () => {
      expect(getClientApp(ua)).toEqual('firefox');
    });
  });

  userAgents.firefox.forEach((ua) => {
    it(`should return firefox by default for a Firefox UA string ${ua}`, () => {
      expect(getClientApp(ua)).toEqual('firefox');
    });
  });

  userAgents.firefoxOS.forEach((ua) => {
    it(`should return firefox by default for a Firefox OS UA string ${ua}`, () => {
      expect(getClientApp(ua)).toEqual('firefox');
    });
  });

  userAgents.firefoxAndroid.forEach((ua) => {
    it(`should return android for a Firefox Android UA string ${ua}`, () => {
      expect(getClientApp(ua)).toEqual('android');
    });
  });

  userAgents.firefoxIOS.forEach((ua) => {
    it(`should return 'firefox' for a Firefox iOS UA string ${ua}`, () => {
      expect(getClientApp(ua)).toEqual('firefox');
    });
  });

  it('should return "android" for lowercase UA string', () => {
    // This UA string has android, not Android.
    const ua = 'mozilla/5.0 (android; mobile; rv:40.0) gecko/40.0 firefox/40.0';
    expect(getClientApp(ua)).toEqual('android');
  });
});

describe('isCompatibleWithUserAgent', () => {
  it('should throw if no userAgentInfo supplied', () => {
    expect(() => {
      isCompatibleWithUserAgent({ userAgent: null, reason: null });
    }).toThrowError('userAgentInfo is required');
  });

  it('is incompatible with Android/webkit', () => {
    userAgents.androidWebkit.forEach((userAgent) => {
      expect(isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });
  });

  it('is incompatible with Chrome Android', () => {
    userAgents.chromeAndroid.forEach((userAgent) => {
      expect(isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });
  });

  it('is incompatible with Chrome desktop', () => {
    userAgents.chrome.forEach((userAgent) => {
      expect(isCompatibleWithUserAgent({ userAgentInfo: UAParser(userAgent) }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
    });
  });

  it('is compatible with Firefox desktop', () => {
    userAgents.firefox.forEach((userAgent) => {
      expect(isCompatibleWithUserAgent({
        addon: fakeAddon, userAgentInfo: UAParser(userAgent) }))
          .toEqual({ compatible: true, reason: null });
    });
  });

  it('is compatible with Firefox Android', () => {
    userAgents.firefoxAndroid.forEach((userAgent) => {
      expect(isCompatibleWithUserAgent({
        addon: fakeAddon, userAgentInfo: UAParser(userAgent) }))
          .toEqual({ compatible: true, reason: null });
    });
  });

  it('is compatible with Firefox OS', () => {
    userAgents.firefoxOS.forEach((userAgent) => {
      expect(isCompatibleWithUserAgent({
        addon: fakeAddon, userAgentInfo: UAParser(userAgent) }))
          .toEqual({ compatible: true, reason: null });
    });
  });

  it('is incompatible with Firefox iOS', () => {
    userAgents.firefoxIOS.forEach((userAgent) => {
      expect(isCompatibleWithUserAgent({
        addon: fakeAddon, userAgentInfo: UAParser(userAgent) }))
          .toEqual({ compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS });
    });
  });

  it(oneLine`should use a Firefox for iOS reason code even if minVersion is
    also not met`, () => {
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '8.0' },
      os: { name: 'iOS' },
    };
    expect(isCompatibleWithUserAgent({
      addon: fakeAddon, minVersion: '9.0', userAgentInfo }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS });
  });

  it('should mark Firefox without window.external as incompatible', () => {
    const userAgentInfo = {
      browser: { name: 'Firefox' },
      os: { name: 'Windows' },
    };
    const fakeOpenSearchAddon = { ...fakeAddon, type: ADDON_TYPE_OPENSEARCH };
    const fakeWindow = {};

    expect(isCompatibleWithUserAgent({
      _window: fakeWindow, addon: fakeOpenSearchAddon, userAgentInfo }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NO_OPENSEARCH });
  });

  it('should mark Firefox without OpenSearch support as incompatible', () => {
    const userAgentInfo = {
      browser: { name: 'Firefox' },
      os: { name: 'Windows' },
    };
    const fakeOpenSearchAddon = { ...fakeAddon, type: ADDON_TYPE_OPENSEARCH };
    const fakeWindow = { external: {} };

    expect(isCompatibleWithUserAgent({
      _window: fakeWindow, addon: fakeOpenSearchAddon, userAgentInfo }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_NO_OPENSEARCH });
  });

  it('should mark Firefox with OpenSearch support as compatible', () => {
    const userAgentInfo = {
      browser: { name: 'Firefox' },
      os: { name: 'Windows' },
    };
    const fakeOpenSearchAddon = { ...fakeAddon, type: ADDON_TYPE_OPENSEARCH };
    const fakeWindow = { external: { AddSearchProvider: sinon.stub() } };

    expect(isCompatibleWithUserAgent({
      _window: fakeWindow, addon: fakeOpenSearchAddon, userAgentInfo }))
        .toEqual({ compatible: true, reason: null });
  });

  it('should mark non-Firefox UAs as incompatible', () => {
    const userAgentInfo = { browser: { name: 'Chrome' } };
    expect(isCompatibleWithUserAgent({ addon: fakeAddon, userAgentInfo }))
      .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
  });

  it('should mark Firefox 10 as incompatible with a minVersion of 10.1', () => {
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '10.0' },
      os: { name: 'Windows' },
    };
    expect(isCompatibleWithUserAgent({
      addon: fakeAddon, minVersion: '10.1', userAgentInfo }))
        .toEqual({ compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION });
  });

  it('should mark Firefox 24 as compatible with a maxVersion of 8', () => {
    // https://github.com/mozilla/addons-frontend/issues/2074
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '24.0' },
      os: { name: 'Windows' },
    };
    expect(isCompatibleWithUserAgent({
      addon: fakeAddon, maxVersion: '8', userAgentInfo })).toEqual({ compatible: true, reason: null });
  });

  it('should mark Firefox as compatible when no min or max version', () => {
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '10.0' },
      os: { name: 'Windows' },
    };
    expect(isCompatibleWithUserAgent({ addon: fakeAddon, userAgentInfo }))
      .toEqual({ compatible: true, reason: null });
  });

  it('should mark Firefox as compatible with maxVersion of "*"', () => {
    // WebExtensions are marked as having a maxVersion of "*" by addons-server
    // if their manifests don't contain explicit version information.
    const userAgentInfo = {
      browser: { name: 'Firefox', version: '54.0' },
      os: { name: 'Windows' },
    };
    expect(isCompatibleWithUserAgent({ addon: fakeAddon, maxVersion: '*', userAgentInfo }))
      .toEqual({ compatible: true, reason: null });
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
    expect(isCompatibleWithUserAgent({ _log: fakeLog, addon: fakeAddon, minVersion: '*', userAgentInfo }))
      .toEqual({ compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION });
    expect(fakeLog.error.firstCall.args[0])
      .toContain('minVersion of "*" was passed to isCompatibleWithUserAgent()');
  });

  it('is incompatible with empty user agent values', () => {
    const userAgentInfo = { browser: { name: '' } };
    expect(isCompatibleWithUserAgent({ addon: fakeAddon, userAgentInfo }))
      .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
  });

  it('is incompatible with non-string user agent values', () => {
    const userAgentInfo = { browser: { name: null }, os: { name: null } };
    expect(isCompatibleWithUserAgent({ addon: fakeAddon, userAgentInfo }))
      .toEqual({ compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX });
  });
});

describe('isValidClientApp', () => {
  const _config = new Map();
  _config.set('validClientApplications', ['firefox', 'android']);

  it('should be valid if passed "firefox"', () => {
    expect(isValidClientApp('firefox', { _config })).toEqual(true);
  });

  it('should be valid if passed "android"', () => {
    expect(isValidClientApp('android', { _config })).toEqual(true);
  });

  it('should be invalid if passed "whatever"', () => {
    expect(isValidClientApp('whatever', { _config })).toEqual(false);
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
    expect(findAddon(state, 'the-addon')).toBe(addon);
  });

  it('does not find the add-on in the state', () => {
    expect(findAddon(state, 'different-addon')).toBe(undefined);
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
        expect(dispatch.called).toBeTruthy();
        expect(dispatch.firstCall.args[0]).toEqual(actions.loadEntities(entities));
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
          expect(dispatch.called).toEqual(false);
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
        expect(dispatch.called).toEqual(false);
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

describe('nl2br', () => {
  it('converts \n to <br/>', () => {
    expect(nl2br('\n')).toEqual('<br />');
  });

  it('converts \r to <br/>', () => {
    expect(nl2br('\r')).toEqual('<br />');
  });

  it('converts \r\n to <br/>', () => {
    expect(nl2br('\r\n')).toEqual('<br />');
  });

  it('converts multiple new lines to multiple breaks', () => {
    expect(nl2br('\n\n')).toEqual('<br /><br />');
  });

  it('converts multiple new lines (Windows) to multiple breaks', () => {
    expect(nl2br('\r\n\r\n')).toEqual('<br /><br />');
  });

  it('handles null text', () => {
    expect(nl2br(null)).toEqual('');
  });
});

describe('isAllowedOrigin', () => {
  it('disallows a random origin', () => {
    expect(isAllowedOrigin('http://whatever.com')).toEqual(false);
  });

  it('allows amoCDN by default', () => {
    expect(isAllowedOrigin(`${config.get('amoCDN')}/foo.png`)).toEqual(true);
  });

  it('returns false for a bogus url', () => {
    expect(isAllowedOrigin(1)).toEqual(false);
  });

  it('returns false for an empty string', () => {
    expect(isAllowedOrigin('')).toEqual(false);
  });

  it('accepts overriding the allowed origins', () => {
    const allowedOrigins = ['http://foo.com', 'https://foo.com'];
    expect(isAllowedOrigin('http://foo.com', { allowedOrigins })).toEqual(true);
    expect(isAllowedOrigin('https://foo.com', { allowedOrigins })).toEqual(true);
  });
});

describe('getIconUrl', () => {
  const addon = {...fakeAddon};

  it('return icon url as in fake addon', () => {  
    expect(getIconUrl(addon)).toEqual('https://addons.cdn.mozilla.net/webdev-64.png');
  });
  it('return fallback icon in case of non allowed origin', () => {  
    expect(getIconUrl({icon_url:'https://xyz.com/a.png'})).toEqual(fallbackIcon);
  });
});

describe('addQueryParams', () => {
  it('adds a query param to a plain url', () => {
    const output = addQueryParams('http://whatever.com/', { foo: 'bar' });
    expect(url.parse(output, true).query).toEqual({ foo: 'bar' });
  });

  it('adds more than one query param to a plain url', () => {
    const output = addQueryParams('http://whatever.com/', { foo: 'bar', test: 1 });
    expect(url.parse(output, true).query).toEqual({ foo: 'bar', test: '1' });
  });

  it('overrides an existing parameter', () => {
    const output = addQueryParams('http://whatever.com/?foo=1', { foo: 'bar' });
    expect(url.parse(output, true).query).toEqual({ foo: 'bar' });
  });

  it('overrides multiple existing parameters', () => {
    const output = addQueryParams('http://whatever.com/?foo=1&bar=2', { foo: 'bar', bar: 'baz' });
    expect(url.parse(output, true).query).toEqual({ foo: 'bar', bar: 'baz' });
  });

  it('leaves other params intact', () => {
    const output = addQueryParams('http://whatever.com/?foo=1&bar=2', { bar: 'updated' });
    expect(url.parse(output, true).query).toEqual({ foo: '1', bar: 'updated' });
  });
});

describe('ngettext', () => {
  function fileCount(count) {
    return sprintf(ngettext('%(count)s file', '%(count)s files', count),
                   { count });
  }

  it('outputs singular when count is one', () => {
    expect('1 file').toEqual(fileCount(1));
  });

  it('outputs plural when count is zero', () => {
    expect('0 files').toEqual(fileCount(0));
  });

  it('outputs plural when count is above one', () => {
    expect('2 files').toEqual(fileCount(2));
  });
});

describe('visibleAddonType', () => {
  it('maps internal addonTypes to plural/visible types', () => {
    expect(visibleAddonType('extension')).toEqual('extensions');
    expect(visibleAddonType('persona')).toEqual('themes');
  });

  it('fails on unrecognised internal addonType', () => {
    expect(() => {
      // "theme" is not a valid visible addonType; it should be "themes".
      visibleAddonType('personas');
    }).toThrowError('"personas" not found in VISIBLE_ADDON_TYPES_MAPPING');
  });

  // See:
  // https://github.com/mozilla/addons-frontend/pull/1541#discussion_r95861202
  it('does not return a false positive on a method', () => {
    expect(() => {
      visibleAddonType('hasOwnProperty');
    }).toThrowError('"hasOwnProperty" not found in VISIBLE_ADDON_TYPES_MAPPING');
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

    expect(asyncConnect.called).toBeTruthy();

    const aConfig = asyncConnect.firstCall.args[0][0];
    return aConfig.promise().then(unexpectedSuccess, (error) => {
      expect(error.message).toEqual('error in callback');
    });
  });

  it('requires a promise', () => {
    expect(() => safeAsyncConnect([{ key: 'thing' }]))
      .toThrowError(/Expected safeAsyncConnect.* config to define a promise/);
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

    expect(asyncConnect.called).toBeTruthy();

    const aConfig = asyncConnect.firstCall.args[0][0];
    expect(aConfig.deferred).toBe(true);
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

    expect(asyncConnect.called).toBeTruthy();

    const aConfig = asyncConnect.firstCall.args[0][0];
    expect(aConfig.key).toEqual('SomeKey');
  });

  it('passes through all configs', () => {
    const asyncConnect = sinon.stub();

    const config1 = { key: 'one', promise: () => {} };
    const config2 = { key: 'two', promise: () => {} };
    safeAsyncConnect([config1, config2], { asyncConnect });

    expect(asyncConnect.called).toBeTruthy();

    expect(asyncConnect.firstCall.args[0][0].key).toEqual('one');
    expect(asyncConnect.firstCall.args[0][1].key).toEqual('two');
  });

  it('fills in an empty key to configs', () => {
    const asyncConnect = sinon.stub();

    safeAsyncConnect([{
      promise: () => Promise.resolve(),
    }], { asyncConnect });

    expect(asyncConnect.firstCall.args[0][0].key).toEqual('__safeAsyncConnect_key__');
  });
});

describe('safePromise', () => {
  it('passes through a promised value', () => {
    const asPromised = safePromise(() => Promise.resolve('return value'));
    return asPromised().then((returnedValue) => {
      expect(returnedValue).toEqual('return value');
    });
  });

  it('passes along all arguments', () => {
    const callback = sinon.spy(() => Promise.resolve());
    const asPromised = safePromise(callback);
    return asPromised('one', 'two', 'three').then(() => {
      expect(callback.called).toBeTruthy();
      expect(callback.firstCall.args).toEqual(['one', 'two', 'three']);
    });
  });

  it('catches errors and returns them as rejected promises', () => {
    const message = 'well, that was unfortunate';
    const asPromised = safePromise(() => {
      throw new Error(message);
    });
    return asPromised().then(unexpectedSuccess, (error) => {
      expect(error.message).toEqual(message);
    });
  });
});

describe('trimAndAddProtocolToUrl', () => {
  it('adds a protocol to a URL if missing', () => {
    expect(trimAndAddProtocolToUrl('test.com')).toEqual('http://test.com');
  });

  it('trims whitespace on a URL', () => {
    expect(trimAndAddProtocolToUrl(' test.com ')).toEqual('http://test.com');
  });

  it('works with HTTPS URLs', () => {
    expect(trimAndAddProtocolToUrl('https://test.com')).toEqual('https://test.com');
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
    expect(() => render404IfConfigKeyIsFalse()).toThrowError(/configKey cannot be empty/);
  });

  it('returns a 404 when disabled by the config', () => {
    const configKey = 'customConfigKey';
    const _config = {
      get: sinon.spy(() => false),
    };
    const root = render({}, { _config, configKey });
    const node = findRenderedComponentWithType(root, NotFound);

    expect(node).toBeTruthy();
    expect(_config.get.called).toBeTruthy();
    expect(_config.get.firstCall.args[0]).toEqual(configKey);
  });

  it('passes through component and props when enabled', () => {
    const _config = { get: () => true };
    const SomeComponent = sinon.spy(() => <div />);
    render({ color: 'orange', size: 'large' }, { SomeComponent, _config });

    expect(SomeComponent.called).toBeTruthy();
    const props = SomeComponent.firstCall.args[0];
    expect(props.color).toEqual('orange');
    expect(props.size).toEqual('large');
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

    expect(maxVersion).toEqual('20.0.*');
    expect(minVersion).toEqual('11.0.1');
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

    expect(maxVersion).toEqual(null);
    expect(minVersion).toEqual(null);
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

    expect(maxVersion).toEqual(null);
    expect(minVersion).toEqual(null);
  });

  it('returns null if current_version does not exist', () => {
    const addon = {
      ...fakeAddon,
      current_version: null,
    };
    const { maxVersion, minVersion } = getCompatibleVersions({
      addon, clientApp: 'firefox' });

    expect(maxVersion).toEqual(null);
    expect(minVersion).toEqual(null);
  });

  it('returns null if addon is null', () => {
    const { maxVersion, minVersion } = getCompatibleVersions({
      addon: null, clientApp: 'firefox' });

    expect(maxVersion).toEqual(null);
    expect(minVersion).toEqual(null);
  });

  it('should log info when OpenSearch type is found', () => {
    const fakeLog = { info: sinon.stub() };
    const openSearchAddon = {
      ...fakeAddon,
      current_version: {
        compatibility: {},
      },
      type: ADDON_TYPE_OPENSEARCH,
    };
    const { maxVersion, minVersion } = getCompatibleVersions({
      _log: fakeLog, addon: openSearchAddon, clientApp: 'firefox' });

    expect(maxVersion).toEqual(null);
    expect(minVersion).toEqual(null);
    expect(fakeLog.info.firstCall.args[0]).toContain(`addon is type ${ADDON_TYPE_OPENSEARCH}`);
  });
});

describe('getClientCompatibility', () => {
  it('returns true for Firefox (reason undefined when compatibile)', () => {
    const { browser, os } = UAParser(userAgents.firefox[0]);
    const userAgentInfo = { browser, os };

    expect(getClientCompatibility({
      addon: fakeAddon,
      clientApp: 'firefox',
      userAgentInfo,
    })).toEqual({
      compatible: true,
      maxVersion: null,
      minVersion: null,
      reason: null,
    });
  });

  it('returns maxVersion when set', () => {
    const { browser, os } = UAParser(userAgents.firefox[0]);
    const userAgentInfo = { browser, os };

    expect(getClientCompatibility({
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
    })).toEqual({
      compatible: true,
      maxVersion: '200.0',
      minVersion: null,
      reason: null,
    });
  });

  it('returns minVersion when set', () => {
    const { browser, os } = UAParser(userAgents.firefox[0]);
    const userAgentInfo = { browser, os };

    expect(getClientCompatibility({
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
    })).toEqual({
      compatible: true,
      maxVersion: null,
      minVersion: '2.0',
      reason: null,
    });
  });

  it('returns incompatible for non-Firefox UA', () => {
    const { browser, os } = UAParser(userAgents.firefox[0]);
    const userAgentInfo = { browser, os };

    expect(getClientCompatibility({
      addon: fakeAddon,
      clientApp: 'firefox',
      userAgentInfo,
    })).toEqual({
      compatible: true,
      maxVersion: null,
      minVersion: null,
      reason: null,
    });
  });
});
