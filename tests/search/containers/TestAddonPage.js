import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import AddonPage from 'search/containers/AddonPage';
import createStore from 'search/store';

describe('AddonPage', () => {
  const initialState = {addons: {'my-addon': {name: 'Addon!', slug: 'my-addon'}}};

  function render({props, state}) {
    const store = createStore(state);
    return findDOMNode(renderIntoDocument(
      <Provider store={store} key="provider">
        <AddonPage {...props} />
      </Provider>
    ));
  }

  it('renders the name', () => {
    const root = render({state: initialState, props: {params: {slug: 'my-addon'}}});
    assert.equal(root.querySelector('h1').textContent, 'Addon!');
  });

  it('renders the slug', () => {
    const root = render({state: initialState, props: {params: {slug: 'my-addon'}}});
    assert.equal(root.querySelector('p').textContent, 'This is the page for my-addon.');
  });

  it('loads the add-on if not found', () => {
    const root = render({state: initialState, props: {params: {slug: 'other-addon'}}});
    assert.equal(root.querySelector('h1').textContent, 'Loading...');
    assert.equal(root.querySelector('p').textContent, 'This is the page for other-addon.');
  });
});
