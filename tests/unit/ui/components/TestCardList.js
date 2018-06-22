import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { renderIntoDocument } from 'react-dom/test-utils';

import CardList from 'ui/components/CardList';

function renderToDOM(props) {
  return findDOMNode(renderIntoDocument(<CardList {...props} />));
}

describe('ui/components/CardList', () => {
  it('adds a CardList class', () => {
    const root = renderToDOM();
    expect(root.className).toContain('CardList');
  });

  it('adds a custom CSS class', () => {
    const root = renderToDOM({ className: 'SystematicDysfunctioner' });
    expect(root.className).toContain('SystematicDysfunctioner');
  });

  it('renders children', () => {
    const root = renderToDOM({ children: <div>Child Content</div> });
    expect(root.textContent).toEqual('Child Content');
  });
});
