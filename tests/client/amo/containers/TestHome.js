import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import Home from 'amo/containers/Home';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('Home', () => {
  function render(props) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <Home i18n={getFakeI18nInst()} {...props} />
      </Provider>
    ), Home).getWrappedInstance());
  }

  it('renders a heading', () => {
    const root = render();
    const content = [
      'What do you want Firefox to do?',
      'How do you want Firefox to look?',
    ];

    Array.from(root.querySelectorAll('.HomePage-subheading'))
      .forEach((element, index) => {
        assert.equal(element.textContent, content[index]);
      });
  });
});
