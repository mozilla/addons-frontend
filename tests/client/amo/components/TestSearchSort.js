import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Simulate,
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import SearchSort from 'amo/components/SearchSort';


function render(props) {
  const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

  return findRenderedComponentWithType(renderIntoDocument(
    <Provider store={createStore(initialState)}>
      <SearchSort {...props} />
    </Provider>
  ), SearchSort).getWrappedInstance();
}

describe('<SearchSortBase />', () => {
  it('toggles the search sort options when clicking "sort" link', () => {
    const root = render({ filters: { query: 'test' }, pathname: '/search/' });
    const rootNode = findDOMNode(root);

    assert.notInclude(rootNode.className, 'SearchSort--visible');

    Simulate.click(root.searchToggle);

    assert.include(rootNode.className, 'SearchSort--visible');
  });

  it('blurs the toggle when closing the sort options with a click/tap', () => {
    const root = render({ filters: { query: 'test' }, pathname: '/search/' });
    const blurSpy = sinon.spy(root.searchToggle, 'blur');

    // Open the sort options.
    Simulate.click(root.searchToggle);
    assert.ok(blurSpy.notCalled);

    // Close the sort options, which should blur the toggle link.
    Simulate.click(root.searchToggle);
    assert.ok(blurSpy.calledOnce);
  });

  it('does not alter keyboard focus when keypress closes the sorter', () => {
    const root = render({ filters: { query: 'test' }, pathname: '/search/' });
    const blurSpy = sinon.spy(root.searchToggle, 'blur');

    // Open the sort options.
    Simulate.keyPress(root.searchToggle);

    // Close the sort options, which should not blur the toggle link as it's
    // done with the keyboard and not a click/tap.
    Simulate.keyPress(root.searchToggle);
    assert.ok(blurSpy.notCalled);
  });
});
