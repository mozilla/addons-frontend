import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import { HomeBase } from 'amo/containers/Home';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('Home', () => {
  it('renders a heading', () => {
    const { store } = dispatchSignInActions();
    const fakeDispatch = sinon.stub();

    const root = findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <HomeBase dispatch={fakeDispatch} i18n={getFakeI18nInst()} />
      </Provider>
    ), HomeBase);
    const rootNode = findDOMNode(root);
    const content = [
      'You can change how Firefox works…',
      '…or what it looks like',
    ];
    Array.from(rootNode.querySelectorAll('.HomePage-subheading'))
      .map((el, index) => expect(el.textContent).toEqual(content[index]));
  });
});
