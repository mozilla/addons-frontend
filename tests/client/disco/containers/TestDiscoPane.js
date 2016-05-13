import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import createStore from 'disco/store';
import DiscoPane from 'disco/containers/DiscoPane';
import * as addonManager from 'disco/addonManager';

const AddonManager = addonManager.AddonManager;

describe('AddonPage', () => {
  let sandbox;

  function stubAddonManager({ getAddon = Promise.resolve() } = {}) {
    const instance = sinon.createStubInstance(AddonManager);
    instance.getAddon = sandbox.stub().returns(getAddon);
    const mockAddonManager = sandbox.spy(() => instance);
    sandbox.stub(addonManager, 'AddonManager', mockAddonManager);
    return instance;
  }

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    stubAddonManager();
  });

  afterEach(() => {
    sandbox.restore();
    sandbox = null;
  });

  function render({props, state}) {
    const store = createStore(state);
    return findDOMNode(renderIntoDocument(
      <Provider store={store} key="provider">
        <DiscoPane {...props} />
      </Provider>
    ));
  }

  describe('rendered fields', () => {
    let root;

    beforeEach(() => {
      root = render({state: {}, props: {}});
    });

    it('renders an addon', () => {
      assert.ok(root.querySelector('.addon'));
    });
  });
});
