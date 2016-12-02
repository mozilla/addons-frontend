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

    Simulate.click(rootNode.querySelector('.ShowMoreCard-revealMoreLink'));

    assert.include(rootNode.className, 'ShowMoreCard--expanded');
    assert.strictEqual(root.state.expanded, true);
  });

  it('renders className', () => {
    const root = render({
      children: <p>Hi</p>,
      className: 'test',
    });
    const rootNode = findDOMNode(root);
    assert.include(rootNode.className, 'test');
  });

  it('renders header and footer', () => {
    const root = render({ header: 'What is up', footer: 'I am down' });
    const rootNode = findDOMNode(root);
    assert.equal(rootNode.querySelector('h2').textContent, 'What is up');
    assert.equal(
      rootNode.querySelector('.Card-footer').textContent, 'I am down');
  });

  it('renders children', () => {
    const root = render({ children: 'Hello I am description' });
    const rootNode = findDOMNode(root);
    assert.include(rootNode.textContent, 'Hello I am description');
  });
});
