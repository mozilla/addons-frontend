import { createRenderer } from 'react-addons-test-utils';

import * as addonManager from 'disco/addonManager';
const AddonManager = addonManager.AddonManager;

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

export function stubAddonManager({ getAddon = Promise.resolve({type: 'addon'}) } = {}) {
  const instance = sinon.createStubInstance(AddonManager);
  instance.getAddon = sinon.stub().returns(getAddon);
  instance.install = sinon.stub().returns(Promise.resolve());
  instance.uninstall = sinon.stub().returns(Promise.resolve());
  const mockAddonManager = sinon.spy(() => instance);
  sinon.stub(addonManager, 'AddonManager', mockAddonManager);
  return instance;
}

export function unexpectedSuccess() {
  return assert.fail(null, null, 'Unexpected success');
}

/*
 * Creates a stand-in for a jed instance,
 */
export function getFakeI18nInst() {
  return {
    gettext: sinon.stub(),
    dgettext: sinon.stub(),
    ngettext: sinon.stub(),
    dngettext: sinon.stub(),
    pgettext: sinon.stub(),
    dpgettext: sinon.stub(),
    npgettext: sinon.stub(),
    dnpgettext: sinon.stub(),
  };
}
