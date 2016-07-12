import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
} from 'react-addons-test-utils';

import Home from 'amo/containers/Home';


describe('Home', () => {
  it('renders a heading', () => {
    const root = renderIntoDocument(<Home />);
    const rootNode = findDOMNode(root);
    assert.include(rootNode.querySelector('h1').textContent, 'AMO Home Page');
  });
});
