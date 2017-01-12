import React from 'react';
import { findDOMNode } from 'react-dom';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import { ShowMoreCardBase } from 'ui/components/ShowMoreCard';
import { getFakeI18nInst } from 'tests/client/helpers';


function render(props) {
  return renderIntoDocument(
    <ShowMoreCardBase i18n={getFakeI18nInst()} {...props} />
  );
}

describe('<ShowMoreCard />', () => {
  it('reveals more text when clicking "show more" link', () => {
    const root = render({ children: 'Hello I am description' });
    const rootNode = findDOMNode(root);

    // We have to manually set the expanded flag to false because we
    // don't have a clientHeight in the tests.
    root.setState({ expanded: false });
    assert.notInclude(rootNode.className, '.ShowMoreCard--expanded');
    assert.strictEqual(root.state.expanded, false);

    Simulate.click(rootNode.querySelector('.Card-footer a'));

    assert.include(rootNode.className, 'ShowMoreCard--expanded');
    assert.strictEqual(root.state.expanded, true);

    assert.equal(rootNode.querySelector('.Card-footer').textContent, 'Expand to Read more');
  });

  it('is expanded by default', () => {
    const root = render({ children: 'Hello I am description' });
    assert.strictEqual(root.state.expanded, true);
  });

  it('truncates the contents if they are too long', () => {
    const root = render({ children: 'Hello I am description' });
    root.truncateToMaxHeight({ clientHeight: 101 });
    assert.strictEqual(root.state.expanded, false);
  });

  it('renders className', () => {
    const root = render({
      children: <p>Hi</p>,
      className: 'test',
    });
    const rootNode = findDOMNode(root);
    assert.include(rootNode.className, 'test');
  });

  it('renders children', () => {
    const root = render({ children: 'Hello I am description' });
    const rootNode = findDOMNode(root);
    assert.include(rootNode.textContent, 'Hello I am description');
  });
});
