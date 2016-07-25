import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
} from 'react-addons-test-utils';

import DetailPage from 'amo/containers/DetailPage';


describe('DetailPage', () => {
  it('renders a heading', () => {
    const root = renderIntoDocument(<DetailPage />);
    const rootNode = findDOMNode(root);
    assert.include(rootNode.querySelector('h1').textContent, 'Detail Page');
  });
});
