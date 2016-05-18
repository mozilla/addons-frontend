import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import createStore from 'disco/store';
import DiscoPane from 'disco/containers/DiscoPane';
import { stubAddonManager } from 'tests/client/helpers';

describe('AddonPage', () => {
  beforeEach(() => {
    stubAddonManager();
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
