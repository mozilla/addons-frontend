import React from 'react';
import { createRenderer } from 'react-addons-test-utils';

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

export function getFakeAddonManagerWrapper({ getAddon = Promise.resolve({type: 'addon'}) } = {}) {
  return {
    getAddon: sinon.stub().returns(getAddon),
    install: sinon.stub().returns(Promise.resolve()),
    uninstall: sinon.stub().returns(Promise.resolve()),
    addChangeListerners: sinon.stub(),
  };
}

export function unexpectedSuccess() {
  return assert.fail(null, null, 'Unexpected success');
}

/*
 * Creates a stand-in for a jed instance,
 */
export function getFakeI18nInst() {
  return {
    gettext: sinon.spy((str) => str),
    dgettext: sinon.stub(),
    ngettext: sinon.stub(),
    dngettext: sinon.stub(),
    pgettext: sinon.stub(),
    dpgettext: sinon.stub(),
    npgettext: sinon.stub(),
    dnpgettext: sinon.stub(),
  };
}

export class MockedSubComponent extends React.Component {
  render() {
    return <div></div>;
  }
}
