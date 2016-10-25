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
    const content = [
      'What do you want Firefox to do?',
      'How do you want Firefox to look?',
    ];
    Array.from(rootNode.querySelectorAll('.HomePage-subheading'))
      .map((el, index) => assert.equal(el.textContent, content[index]));
  });
});
