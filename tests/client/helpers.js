import base64url from 'base64url';
import config from 'config';
import Jed from 'jed';
import React from 'react';
import { createRenderer } from 'react-addons-test-utils';
import UAParser from 'ua-parser-js';

import { ADDON_TYPE_EXTENSION } from 'core/constants';
import { makeI18n } from 'core/i18n/utils';
import { initialApiState } from 'core/reducers/api';

/*
 * Return a fake authentication token that can be
 * at least decoded in a realistic way.
 */
export function userAuthToken(dataOverrides = {}, { tokenData } = {}) {
  const data = {
    user_id: 102345,
    ...dataOverrides,
  };

  let encodedToken = tokenData;
  if (!encodedToken) {
    encodedToken = base64url.encode(JSON.stringify(data));
  }
  const authId = base64url.encode('pretend this is an auth ID');
  const sig = base64url.encode('pretend this is a signature');

  return `${encodedToken}:${authId}:${sig}`;
}

export function shallowRender(stuff) {
  const renderer = createRenderer();
  renderer.render(stuff);
  return renderer.getRenderOutput();
}

export function findAllByTag(root, tag) {
  return root.props.children.filter((child) => child.type === tag);
}

export function findByTag(root, tag) {
  const matches = findAllByTag(root, tag);
  assert.equal(matches.length, 1, 'expected one match');
  return matches[0];
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
  return assert.fail(null, null, 'Unexpected success');
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

const formatClassList = (classList) => Array.prototype.join.call(classList, ', ');

export function assertHasClass(el, className) {
  assert.ok(
    el.classList.contains(className),
    `expected ${className} in ${formatClassList(el.classList)}`);
}

export function assertNotHasClass(el, className) {
  assert.notOk(
    el.classList.contains(className),
    `expected ${className} to not be in in ${formatClassList(el.classList)}`);
}

const userAgentForState = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1';
const { browser, os } = UAParser(userAgentForState);
export const signedInApiState = Object.freeze({
  ...initialApiState,
  lang: 'en-US',
  token: 'secret-token',
  userAgent: userAgentForState,
  userAgentInfo: { browser, os },
});

export const userAgents = {
  androidWebkit: [
    dedent`Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K)
      AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`,
    dedent`Mozilla/5.0 (Linux; U; Android 2.3.4; fr-fr; HTC Desire Build/GRJ22)
      AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1`,
  ],
  chromeAndroid: [
    dedent`Mozilla/5.0 (Linux; Android 4.1.1; Galaxy Nexus Build/JRO03C)
      AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile
      Safari/535.19`,
    dedent`Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76K)
      AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile
      Safari/535.19`,
    dedent`Mozilla/5.0 (Linux; Android 6.0.1; Nexus 6P Build/MMB29P)
      AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile
      Safari/537.36`,
  ],
  chrome: [
    dedent`Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko)
      Chrome/41.0.2228.0 Safari/537.36`,
    dedent`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36
      (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36`,
  ],
  firefox: [
    'Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/10.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
    dedent`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101
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
    dedent`Mozilla/5.0 (iPod touch; CPU iPhone OS 8_3 like Mac OS X)
      AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69
      Safari/600.1.4`,
    dedent`Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X)
      AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69
      Safari/600.1.4`,
    dedent`Mozilla/5.0 (iPad; CPU iPhone OS 8_3 like Mac OS X)
      AppleWebKit/600.1.4 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69
      Safari/600.1.4`,
  ],
};
