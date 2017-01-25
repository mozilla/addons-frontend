import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import Footer from 'amo/components/Footer';
import createStore from 'amo/store';


describe('Footer', () => {
  function renderFooter({ ...props }) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <Footer {...props} />
      </Provider>
    ), Footer));
  }

  it('renders a footer', () => {
    const root = renderFooter();

    assert.equal(root.querySelector('.Footer-privacy').textContent,
      'Privacy policy');
    assert.equal(root.querySelector('.Footer-privacy').href,
      'https://www.mozilla.org/en-GB/privacy/websites/');

    assert.equal(root.querySelector('.Footer-legal').textContent,
      'Legal notices');
    assert.equal(root.querySelector('.Footer-legal').href,
      'https://www.mozilla.org/en-GB/about/legal/');
  });
});
