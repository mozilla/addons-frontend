import React from 'react';
import { findDOMNode } from 'react-dom';
import { renderIntoDocument } from 'react-addons-test-utils';

import CardList from 'ui/components/CardList';


function renderToDOM(props) {
  return findDOMNode(renderIntoDocument(<CardList {...props} />));
}

describe('ui/components/CardList', () => {
  it('adds a CardList class', () => {
    const root = renderToDOM();
    assert.include(root.className, 'CardList');
  });

  it('adds a custom CSS class', () => {
    const root = renderToDOM({ className: 'SystematicDysfunctioner' });
    assert.include(root.className, 'SystematicDysfunctioner');
  });

  it('renders children', () => {
    const root = renderToDOM({ children: <div>Child Content</div> });
    assert.equal(root.textContent, 'Child Content');
  });
});
