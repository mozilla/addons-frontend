import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
} from 'react-addons-test-utils';

import { getFakeI18nInst } from 'tests/client/helpers';
import Home from 'amo/containers/Home';


describe('Home', () => {
  it('renders a heading', () => {
    const root = renderIntoDocument(<Home i18n={getFakeI18nInst()} />);
    const rootNode = findDOMNode(root);
    assert.include(rootNode.querySelectorAll('h2')[0].textContent, 'What do you want Firefox to do?');
  });
});
