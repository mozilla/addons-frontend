import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import Card from 'ui/components/Card';


describe('<Card />', () => {
  function render(props = {}) {
    return renderIntoDocument(<Card {...props} />);
  }

  it('renders a Card', () => {
    const root = render({ className: 'TofuSection' });
    assert(root.cardContainer);
    assert.equal(root.cardContainer.tagName, 'SECTION');
    assert.include(root.cardContainer.className, 'Card');
    assert.include(root.cardContainer.className, 'TofuSection');
  });

  it('shows header if supplied', () => {
    const root = render({ header: 'foo' });
    assert(root.header);
  });

  it('hides header if none supplied', () => {
    const root = render({ children: 'hello' });
    assert(!root.header);
    assert.include(root.cardContainer.className, 'Card--no-header');
  });

  it('shows footer if supplied', () => {
    const root = render({ footer: 'foo' });
    assert(root.footer);
    assert.equal(root.footer.textContent, 'foo');
  });

  it('hides footer if none supplied', () => {
    const root = render({ children: 'hello' });
    assert(!root.footer);
    assert.include(root.cardContainer.className, 'Card--no-footer');
  });

  it('renders children', () => {
    const root = render({ children: 'hello' });
    assert(root.contents);
    assert.include(root.contents.textContent, 'hello');
  });

  it('omits the content div with no children', () => {
    const root = render();
    assert(!root.contents);
  });
});
