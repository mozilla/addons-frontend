/* global Response */
import url from 'url';

import PropTypes from 'prop-types';
import base64url from 'base64url';
import config, { util as configUtil } from 'config';
import invariant from 'invariant';
import { shallow } from 'enzyme';
import Jed from 'jed';
import { normalize } from 'normalizr';
import * as React from 'react';
import UAParser from 'ua-parser-js';
import { oneLine } from 'common-tags';

import { getDjangoBase62 } from 'amo/utils';
import * as coreApi from 'core/api';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_LANG } from 'core/constants';
import { makeI18n } from 'core/i18n/utils';
import { initialApiState } from 'core/reducers/api';
import { createUIStateMapper, mergeUIStateProps } from 'core/withUIState';
import { ErrorHandler } from 'core/errorHandler';
import { fakeAddon } from 'tests/unit/amo/helpers';

export const sampleUserAgent =
  'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1';
export const sampleUserAgentParsed = UAParser(sampleUserAgent);

export const randomId = () => {
  // Add 1 to make sure it's never zero.
  return Math.floor(Math.random() * 10000) + 1;
};

/*
 * Return a fake authentication token that can be
 * at least decoded in a realistic way.
 */
export function userAuthToken(
  dataOverrides = {},
  { tokenCreatedAt = (Date.now() / 1000).toFixed(0), tokenData } = {},
) {
  const data = {
    user_id: 102345,
    ...dataOverrides,
  };

  let encodedToken = tokenData;
  if (!encodedToken) {
    encodedToken = base64url.encode(JSON.stringify(data));
  }

  const base62 = getDjangoBase62();
  const timestamp = base62.encode(tokenCreatedAt);
  const sig = base64url.encode('pretend-this-is-a-signature');

  return `${encodedToken}:${timestamp}:${sig}`;
}

const enabledExtension = Promise.resolve({
  isActive: true,
  isEnabled: true,
  type: ADDON_TYPE_EXTENSION,
});

export function getFakeAddonManagerWrapper({
  getAddon = enabledExtension,
  permissionPromptsEnabled = true,
  ...overrides
} = {}) {
  return {
    addChangeListeners: sinon.stub(),
    enable: sinon.stub().returns(Promise.resolve()),
    getAddon: sinon.stub().returns(getAddon),
    install: sinon.stub().returns(Promise.resolve()),
    uninstall: sinon.stub().returns(Promise.resolve()),
    hasPermissionPromptsEnabled: sinon.stub().returns(permissionPromptsEnabled),
    ...overrides,
  };
}

/*
 * A promise resolution callback for expecting rejected promises.
 *
 * For example:
 *
 * return somePromiseThatShouldFail()
 *   .then(unexpectedSuccess, (error) => {
 *     expect(error.message).toMatch(/the error/);
 *   });
 */
export function unexpectedSuccess() {
  return Promise.reject(new Error('The promise succeeded unexpectedly'));
}

export function JedSpy(data = {}) {
  const _Jed = new Jed(data);
  _Jed.gettext = sinon.spy(_Jed.gettext);
  _Jed.dgettext = sinon.spy(_Jed.gettext);
  _Jed.ngettext = sinon.spy(_Jed.ngettext);
  _Jed.dngettext = sinon.spy(_Jed.dngettext);
  _Jed.dpgettext = sinon.spy(_Jed.dpgettext);
  _Jed.npgettext = sinon.spy(_Jed.npgettext);
  _Jed.dnpgettext = sinon.spy(_Jed.dnpgettext);
  _Jed.sprintf = sinon.spy(_Jed.sprintf);
  return _Jed;
}

/*
 * Creates a stand-in for a jed instance,
 */
export function fakeI18n({ lang = config.get('defaultLang') } = {}) {
  return makeI18n({}, lang, JedSpy);
}

export class MockedSubComponent extends React.Component {
  render() {
    return <div />;
  }
}

export function assertHasClass(el, className) {
  expect(el.classList.contains(className)).toBeTruthy();
}

export function assertNotHasClass(el, className) {
  expect(el.classList.contains(className)).toBeFalsy();
}

const { browser, os } = sampleUserAgentParsed;
export const signedInApiState = Object.freeze({
  ...initialApiState,
  lang: 'en-US',
  token: 'secret-token',
  userAgent: sampleUserAgent,
  userAgentInfo: { browser, os },
  userId: 102345,
});

export const userAgentsByPlatform = {
  android: {
    firefox40Mobile: oneLine`Mozilla/5.0 (Android; Mobile; rv:40.0)
      Gecko/40.0 Firefox/40.0`,
    firefox40Tablet: oneLine`Mozilla/5.0 (Android; Tablet; rv:40.0)
      Gecko/40.0 Firefox/40.0`,
  },
  bsd: {
    firefox40FreeBSD: oneLine`Mozilla/5.0 (X11; FreeBSD amd64; rv:40.0)
      Gecko/20100101 Firefox/40.0`,
  },
  firefoxOS: {
    firefox26: 'Mozilla/5.0 (Mobile; rv:26.0) Gecko/26.0 Firefox/26.0',
  },
  ios: {
    firefox1iPad: oneLine`Mozilla/5.0 (iPad; CPU iPhone OS 8_3
      like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko)
      FxiOS/1.0 Mobile/12F69 Safari/600.1.4`,
    firefox1iPhone: oneLine`Mozilla/5.0 (iPhone; CPU iPhone OS 8_3
      like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko)
      FxiOS/1.0 Mobile/12F69n Safari/600.1.4`,
    firefox1iPodTouch: oneLine`Mozilla/5.0 (iPod touch; CPU iPhone
      OS 8_3 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko)
      FxiOS/1.0 Mobile/12F69 Safari/600.1.4`,
  },
  linux: {
    firefox10: oneLine`Mozilla/5.0 (X11; Linux i686; rv:10.0)
      Gecko/20100101 Firefox/10.0`,
    firefox57Ubuntu: oneLine`Mozilla/5.0 (X11; Ubuntu; Linux i686;
      rv:57.0) Gecko/20100101 Firefox/57.0`,
  },
  mac: {
    chrome41: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1)
      AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36`,
    firefox33: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10;
      rv:33.0) Gecko/20100101 Firefox/33.0`,
    firefox57: oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:57.0)
      Gecko/20100101 Firefox/57.1`,
  },
  unix: {
    firefox51: oneLine`Mozilla/51.0.2 (X11; Unix x86_64; rv:29.0)
      Gecko/20170101 Firefox/51.0.2`,
  },
  windows: {
    firefox40: oneLine`Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0)
      Gecko/20100101 Firefox/40.1`,
  },
};

export const userAgents = {
  androidWebkit: [
    oneLine`Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K)
      AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`,
    oneLine`Mozilla/5.0 (Linux; U; Android 2.3.4; fr-fr; HTC Desire Build/GRJ22)
      AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1`,
  ],
  chromeAndroid: [
    oneLine`Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C)
      AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile
      Safari/535.19`,
    oneLine`Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76K)
      AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile
      Safari/535.19`,
    oneLine`Mozilla/5.0 (Linux; Android 6.0.1; Nexus 6P Build/MMB29P)
      AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile
      Safari/537.36`,
  ],
  chrome: [
    oneLine`Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko)
      Chrome/41.0.2228.0 Safari/537.36`,
    userAgentsByPlatform.mac.chrome41,
  ],
  firefox: [
    userAgentsByPlatform.linux.firefox10,
    userAgentsByPlatform.windows.firefox40,
    userAgentsByPlatform.mac.firefox33,
    'Mozilla/5.0 (X11; Linux i586; rv:31.0) Gecko/20100101 Firefox/31.0',
    // Firefox ESR 52
    oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:52.2.1)
      Gecko/20100101 Firefox/52.2.1`,
    userAgentsByPlatform.mac.firefox57,
  ],
  firefoxOS: [
    userAgentsByPlatform.firefoxOS.firefox26,
    'Mozilla/5.0 (Tablet; rv:26.0) Gecko/26.0 Firefox/26.0',
    'Mozilla/5.0 (TV; rv:44.0) Gecko/44.0 Firefox/44.0',
    'Mozilla/5.0 (Mobile; nnnn; rv:26.0) Gecko/26.0 Firefox/26.0',
  ],
  firefoxAndroid: [
    userAgentsByPlatform.android.firefox40Mobile,
    userAgentsByPlatform.android.firefox40Tablet,
    'Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0',
    'Mozilla/5.0 (Android 4.4; Tablet; rv:41.0) Gecko/41.0 Firefox/41.0',
    'Mozilla/5.0 (Android 4.4; Tablet; rv:57.0) Gecko/57.0 Firefox/57.0',
  ],
  firefoxIOS: [
    userAgentsByPlatform.ios.firefox1iPodTouch,
    userAgentsByPlatform.ios.firefox1iPhone,
    userAgentsByPlatform.ios.firefox1iPad,
  ],
};

export function apiResponsePage({
  count,
  next,
  previous,
  pageSize = coreApi.DEFAULT_API_PAGE_SIZE,
  results = [],
} = {}) {
  return {
    count: typeof count !== 'undefined' ? count : results.length,
    next,
    page_size: pageSize,
    previous,
    results,
  };
}

export function createFetchAddonResult(addon) {
  // Simulate how callApi() applies the add-on schema to
  // the API server response.
  return normalize(addon, coreApi.addon);
}

export function createFetchAllAddonsResult(addons) {
  return normalize(
    // Simulate an API response that returns an array of addons.
    { results: addons },
    // Simulate how callApi() would apply an add-on schema to results.
    { results: [coreApi.addon] },
  );
}

/*
 * Repeatedly render a component tree using enzyme.shallow() until
 * finding and rendering TargetComponent.
 *
 * This is useful for testing a component wrapped in one or more
 * HOCs (higher order components).
 *
 * The `componentInstance` parameter is a React component instance.
 * Example: <MyComponent {...props} />
 *
 * The `TargetComponent` parameter is the React class (or function) that
 * you want to retrieve from the component tree.
 */
export function shallowUntilTarget(
  componentInstance,
  TargetComponent,
  { maxTries = 10, shallowOptions, _shallow = shallow } = {},
) {
  if (!componentInstance) {
    throw new Error('componentInstance parameter is required');
  }
  if (!TargetComponent) {
    throw new Error('TargetComponent parameter is required');
  }

  let root = _shallow(componentInstance, shallowOptions);

  if (typeof root.type() === 'string') {
    // If type() is a string then it's a DOM Node.
    // If it were wrapped, it would be a React component.
    throw new Error('Cannot unwrap this component because it is not wrapped');
  }

  for (let tries = 1; tries <= maxTries; tries++) {
    if (root.is(TargetComponent)) {
      // Now that we found the target component, render it.
      return root.shallow(shallowOptions);
    }
    // Unwrap the next component in the hierarchy.
    root = root.dive();
  }

  throw new Error(oneLine`Could not find ${TargetComponent} in rendered
    instance: ${componentInstance}; gave up after ${maxTries} tries`);
}

export function createFakeEvent(extraProps = {}) {
  return {
    currentTarget: sinon.stub(),
    preventDefault: sinon.stub(),
    stopPropagation: sinon.stub(),
    ...extraProps,
  };
}

export const createFakeMozWindow = () => {
  // This is a special Mozilla window that allows you to
  // install open search add-ons.
  return { external: { AddSearchProvider: sinon.stub() } };
};

export function createStubErrorHandler(capturedError = null) {
  return new ErrorHandler({
    id: 'create-stub-error-handler-id',
    dispatch: sinon.stub(),
    capturedError,
  });
}

export function generateHeaders(
  headerData = { 'Content-Type': 'application/json' },
) {
  const response = new Response();
  Object.keys(headerData).forEach((key) =>
    response.headers.append(key, headerData[key]),
  );
  return response.headers;
}

export function createApiResponse({
  ok = true,
  jsonData = {},
  ...responseProps
} = {}) {
  const response = {
    ok,
    headers: generateHeaders(),
    json: () => Promise.resolve(jsonData),
    ...responseProps,
  };
  return Promise.resolve(response);
}

export function createFakeLanguageTool(otherProps = {}) {
  return {
    id: fakeAddon.id,
    current_version: fakeAddon.current_version,
    default_locale: 'en-US',
    guid: fakeAddon.guid,
    locale_disambiguation: '',
    name: fakeAddon.name,
    target_locale: 'ach',
    type: ADDON_TYPE_LANG,
    url: 'https://addons.allizom.org/en-US/firefox/addon/acholi-ug-lp-test',
    ...otherProps,
  };
}

export function createUserAccountResponse({
  id = 123456,
  biography = 'I love making add-ons!',
  username = 'user-1234',
  created = '2017-08-15T12:01:13Z',
  /* eslint-disable camelcase */
  average_addon_rating = 4.3,
  display_name = null,
  is_addon_developer = false,
  is_artist = false,
  num_addons_listed = 1,
  picture_url = `${config.get('amoCDN')}/static/img/zamboni/anon_user.png`,
  picture_type = '',
  /* eslint-enable camelcase */
  homepage = null,
  permissions = [],
  occupation = null,
  location = null,
} = {}) {
  return {
    average_addon_rating,
    biography,
    created,
    display_name,
    homepage,
    id,
    is_addon_developer,
    is_artist,
    location,
    // This is the API behavior.
    // eslint-disable-next-line camelcase
    name: display_name || username,
    num_addons_listed,
    occupation,
    picture_type,
    picture_url,
    url: null,
    username,
    permissions,
  };
}

export function createFakeAddonAbuseReport({
  addon = fakeAddon,
  message,
  reporter = null,
} = {}) {
  return {
    addon: {
      guid: addon.guid,
      id: addon.id,
      slug: addon.slug,
    },
    message,
    reporter,
  };
}

export function createFakeUserAbuseReport({
  message,
  reporter = null,
  user = createUserAccountResponse(),
} = {}) {
  return {
    message,
    reporter,
    user: {
      id: user.id,
      name: user.name,
      url: user.url,
      username: user.username,
    },
  };
}

// Returns a real-ish config object with custom parameters.
//
// Example:
//
// const fakeConfig = getFakeConfig({ isDevelopment: true });
// if (fakeConfig.get('isDevelopment')) {
//   ...
// }
export const getFakeConfig = (params = {}) => {
  for (const key of Object.keys(params)) {
    if (!config.has(key)) {
      // This will help alert us when a test accidentally relies
      // on an invalid config key.
      throw new Error(
        `Cannot set a fake value for "${key}"; this key is invalid`,
      );
    }
  }
  return Object.assign(configUtil.cloneDeep(config), params);
};

/*
 * A sinon matcher to check if the URL contains the declared params.
 *
 * Example:
 *
 * mockWindow.expects('fetch').withArgs(urlWithTheseParams({ page: 1 }))
 */
export const urlWithTheseParams = (params) => {
  return sinon.match((urlString) => {
    const { query } = url.parse(urlString, true);

    for (const param in params) {
      if (!query[param] || query[param] !== params[param].toString()) {
        return false;
      }
    }

    return true;
  }, `urlWithTheseParams(${JSON.stringify(params)})`);
};

/*
 * Returns a fake ReactRouter location object.
 *
 * See ReactRouterLocationType in 'core/types/router';
 */
export const createFakeLocation = (props = {}) => {
  return {
    action: 'PUSH',
    hash: '',
    key: 'some-key',
    pathname: '/some/url',
    query: {},
    search: '',
    ...props,
  };
};

// TODO: remove this alias and use `createFakeLocation()` only.
export const fakeRouterLocation = createFakeLocation;

/*
 * Returns a fake ReactRouter history object.
 *
 * See ReactRouterHistoryType in 'core/types/router';
 */
export const createFakeHistory = ({ location = createFakeLocation() } = {}) => {
  return {
    location,
    goBack: sinon.spy(),
    listen: sinon.spy(),
    push: sinon.spy(),
  };
};

export const createContextWithFakeRouter = ({
  history = createFakeHistory(),
  location = history.location,
  match = {},
  ...overrides
} = {}) => {
  return {
    context: {
      router: {
        history,
        route: {
          location,
          match,
        },
      },
    },
    childContextTypes: {
      router: PropTypes.object.isRequired,
    },
    ...overrides,
  };
};

/*
 * Simulate how a component you depend on will invoke a callback.
 *
 * The return value is an executable callback that you can call
 * with the necessary arguments.
 *
 * type SimulateComponentCallbackParams = {|
 *   // This is the root of your parent component (an enzyme wrapper object).
 *   root: Object,
 *   // This is the component class you want to simulate.
 *   Component: React.Element<any>,
 *   // This is the property name for the callback.
 *   propName: string,
 * |};
 */
export const simulateComponentCallback = ({ Component, root, propName }) => {
  const component = root.find(Component);
  expect(component).toHaveProp(propName);

  const callback = component.prop(propName);
  expect(typeof callback).toEqual('function');

  return (...args) => {
    const result = callback(...args);

    // Since the component might call setState() and that would happen
    // outside of a standard React lifestyle hook, we have to re-render.
    root.update();

    return result;
  };
};

export const createUserNotificationsResponse = () => {
  return [
    {
      name: 'reply',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'new_features',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'upgrade_success',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'sdk_upgrade_success',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'new_review',
      enabled: true,
      mandatory: false,
    },
    {
      name: 'upgrade_fail',
      enabled: true,
      mandatory: true,
    },
    {
      name: 'sdk_upgrade_fail',
      enabled: true,
      mandatory: true,
    },
    {
      name: 'reviewer_reviewed',
      enabled: true,
      mandatory: true,
    },
    {
      name: 'individual_contact',
      enabled: true,
      mandatory: true,
    },
    {
      name: 'announcements',
      enabled: false,
      mandatory: false,
    },
  ];
};

/*
 * Call this in a test after any shallowUntilTarget() component might
 * have adjusted its uiState.
 *
 * This simulates how Redux will update component props after
 * an action dispatch.
 * It's necessary because shallow Enzyme wrapper updates do not
 * propagate to all HOCs.
 */
export function applyUIStateChanges({ root, store }) {
  const ownProps = root.instance().props;
  invariant(
    ownProps.uiStateID,
    'uiStateID cannot be undefined; was the component wrapped in withUIState()?',
  );

  const mapStateToProps = createUIStateMapper({
    uiStateID: ownProps.uiStateID,
  });
  const stateProps = mapStateToProps(store.getState(), ownProps);
  const mappedProps = mergeUIStateProps(
    stateProps,
    { dispatch: store.dispatch },
    ownProps,
  );

  root.setProps(mappedProps);
}

/*
 * Change a component's uiState.
 */
export function setUIState({ root, change, store }) {
  root.instance().props.setUIState(change);
  applyUIStateChanges({ root, store });
}

export function fakeCookie(overrides = {}) {
  return { load: sinon.stub(), save: sinon.stub(), ...overrides };
}

export const createFakeTracking = (overrides = {}) => {
  return {
    sendEvent: sinon.stub(),
    setDimension: sinon.stub(),
    ...overrides,
  };
};
