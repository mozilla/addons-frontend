import base64url from 'base64url';
import config from 'config';
import { ShallowWrapper } from 'enzyme';
import Jed from 'jed';
import { normalize } from 'normalizr';
import React from 'react';
import UAParser from 'ua-parser-js';
import { oneLine } from 'common-tags';

import { getDjangoBase62 } from 'amo/utils';
import * as coreApi from 'core/api';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import { makeI18n } from 'core/i18n/utils';
import { initialApiState } from 'core/reducers/api';

export const sampleUserAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1';
export const sampleUserAgentParsed = UAParser(sampleUserAgent);

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
  getAddon = enabledExtension, permissionPromptsEnabled = true } = {}) {
  return {
    addChangeListeners: sinon.stub(),
    enable: sinon.stub().returns(Promise.resolve()),
    getAddon: sinon.stub().returns(getAddon),
    install: sinon.stub().returns(Promise.resolve()),
    uninstall: sinon.stub().returns(Promise.resolve()),
    hasPermissionPromptsEnabled: sinon.stub().returns(permissionPromptsEnabled),
  };
}

export function unexpectedSuccess() {
  return expect(false).toBe(true);
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
export function getFakeI18nInst({ lang = config.get('defaultLang') } = {}) {
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
});

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
    oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36
      (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36`,
  ],
  firefox: [
    'Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/10.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
    oneLine`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101
      Firefox/33.0`,
    'Mozilla/5.0 (X11; Linux i586; rv:31.0) Gecko/20100101 Firefox/31.0',
  ],
  firefoxOS: [
    'Mozilla/5.0 (Mobile; rv:26.0) Gecko/26.0 Firefox/26.0',
    'Mozilla/5.0 (Tablet; rv:26.0) Gecko/26.0 Firefox/26.0',
    'Mozilla/5.0 (TV; rv:44.0) Gecko/44.0 Firefox/44.0',
    'Mozilla/5.0 (Mobile; nnnn; rv:26.0) Gecko/26.0 Firefox/26.0',
  ],
  firefoxAndroid: [
    'Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
    'Mozilla/5.0 (Android; Tablet; rv:40.0) Gecko/40.0 Firefox/40.0',
    'Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0',
    'Mozilla/5.0 (Android 4.4; Tablet; rv:41.0) Gecko/41.0 Firefox/41.0',
  ],
  firefoxIOS: [
    oneLine`Mozilla/5.0 (iPod touch; CPU iPhone OS 8_3 like Mac OS X)
      AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69
      Safari/600.1.4`,
    oneLine`Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X)
      AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69
      Safari/600.1.4`,
    oneLine`Mozilla/5.0 (iPad; CPU iPhone OS 8_3 like Mac OS X)
      AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69
      Safari/600.1.4`,
  ],
};

export function apiResponsePage({
  count, next, previous, pageSize = 25, results = [],
} = {}) {
  return Promise.resolve({
    count: typeof count !== 'undefined' ? count : results.length,
    next,
    page_size: pageSize,
    previous,
    results,
  });
}

export function createFetchAddonResult(addon) {
  // Simulate how callApi() applies the add-on schema to
  // the API server response.
  return normalize(addon, coreApi.addon);
}

/*
 * Unwraps a component to get the one you care about.
 *
 * The `componentInstance` parameter must be the result of enzyme.shallow().
 *
 * The `ComponentBase` parameter is the React class (or function) that
 * you want to retrieve from the shallow render tree.
 */
export function unwrapComponent(componentInstance, ComponentBase, {
  maxTries = 10,
} = {}) {
  if (!componentInstance) {
    throw new Error('componentInstance parameter is required');
  }
  if (!ComponentBase) {
    throw new Error('ComponentBase parameter is required');
  }
  let root = componentInstance;

  if (!(root instanceof ShallowWrapper)) {
    throw new Error(
      'componentInstance must be the result of enzyme.shallow()');
  }

  if (typeof root.type() === 'string') {
    // If type() is a string then it's a DOM Node.
    // If it were wrapped, it would be a component.
    throw new Error(
      'Cannot unwrap this component because it is not wrapped');
  }

  let tries = 0;
  const notFoundError = () => (
    oneLine`Could not find ${ComponentBase} in rendered
    instance: ${componentInstance.debug()}`
  );

  while (root) {
    tries++;
    if (tries > maxTries) {
      throw new Error(`${notFoundError()} (gave up after ${maxTries} tries)`);
    }
    if (root.is(ComponentBase)) {
      return root;
    }
    // Unwrap the next component in the hierarchy.
    root = root.first().shallow();
  }

  throw new Error(notFoundError());
}
