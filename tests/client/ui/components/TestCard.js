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

  it('shows footer text if supplied', () => {
    const root = render({ footerText: 'foo' });
    assert(root.footer);
    assert.equal(root.footer.textContent, 'foo');
    assert.equal(root.footer.className, 'Card-footer-text');
  });

  it('shows a footer link if supplied', () => {
    const root = render({ footerLink: <a href="#">Some link</a> });
    assert(root.footer);
    assert.equal(root.footer.textContent, 'Some link');
    assert.equal(root.footer.className, 'Card-footer-link');
  });

  it('throws an error if you mix footer content', () => {
    assert.throws(() => render({
      footerLink: <a href="#">Some link</a>,
      footerText: 'something else',
    }), /cannot specify footerLink and footerText/);
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
