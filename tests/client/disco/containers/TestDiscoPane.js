import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import createStore from 'disco/store';
import DiscoPane from 'disco/containers/DiscoPane';
import { stubAddonManager } from 'tests/client/helpers';

describe('AddonPage', () => {
  beforeEach(() => {
    stubAddonManager();
  });

  function render() {
    return findDOMNode(renderIntoDocument(
      <Provider store={createStore()} key="provider">
        <DiscoPane />
      </Provider>
    ));
  }

  describe('rendered fields', () => {
    let root;

    beforeEach(() => {
      root = render();
    });

    it('renders an addon', () => {
      assert.ok(root.querySelector('.addon'));
    });
  });

  describe('video', () => {
    it('is small by default', () => {
      const root = render();
      assert.notOk(root.querySelector('.show-video'));
    });

    it('gets bigger and smaller when clicked', () => {
      const root = render();
      Simulate.click(root.querySelector('.play-video'));
      assert.ok(root.querySelector('.show-video'));
      Simulate.click(root.querySelector('.close-video a'));
      assert.notOk(root.querySelector('.show-video'));
    });
  });
});
