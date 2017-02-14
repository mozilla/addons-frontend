import base64url from 'base64url';
import config from 'config';
import { sprintf } from 'jed';
import React from 'react';
import { createRenderer } from 'react-addons-test-utils';

import { ADDON_TYPE_EXTENSION } from 'core/constants';
import { ngettext } from 'core/utils';
import { makeI18n } from 'core/i18n/utils';

/*
 * Return a fake authentication token (a JWT) that can be
 * at least decoded like a real JWT.
 */
export function userAuthToken(dataOverrides = {}, { tokenData } = {}) {
  const data = {
    iss: 'some issuer',
    exp: 12345,
    iat: 12345,
    username: 'some-username',
    user_id: 102345,
    email: 'some-username@somewhere.org',
    ...dataOverrides,
  };

  const algo = base64url.encode('{"example": "of JWT algorithms"}');
  let encodedToken = tokenData;
  if (!encodedToken) {
    encodedToken = base64url.encode(JSON.stringify(data));
  }
  const sig = base64url.encode('pretend this is a signature of the content');

  return `${algo}.${encodedToken}.${sig}`;
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

class FakeJed {
  gettext = sinon.spy((str) => str)
  dgettext = sinon.stub()
  ngettext = sinon.spy(ngettext)
  dngettext = sinon.stub()
  pgettext = sinon.stub()
  dpgettext = sinon.stub()
  npgettext = sinon.stub()
  dnpgettext = sinon.stub()
  sprintf = sinon.spy(sprintf)
}

/*
 * Creates a stand-in for a jed instance,
 */
export function getFakeI18nInst({ lang = config.get('defaultLang') } = {}) {
  return makeI18n({}, lang, FakeJed);
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

export const signedInApiState = Object.freeze({
  lang: 'en-US',
  token: 'secret-token',
});
