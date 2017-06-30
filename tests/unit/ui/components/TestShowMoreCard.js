import React from 'react';
import { findDOMNode } from 'react-dom';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import { ShowMoreCardBase } from 'ui/components/ShowMoreCard';
import { getFakeI18nInst } from 'tests/unit/helpers';


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
    expect(rootNode.className).not.toContain('.ShowMoreCard--expanded');
    expect(root.state.expanded).toBe(false);
    expect(rootNode.querySelector('.Card-footer-link').textContent).toEqual('Expand to Read more');

    Simulate.click(rootNode.querySelector('.Card-footer-link a'));

    expect(rootNode.className).toContain('ShowMoreCard--expanded');
    expect(root.state.expanded).toBe(true);

    expect(rootNode.querySelector('.Card-footer-link')).toEqual(null);
  });

  it('is expanded by default', () => {
    const root = render({ children: 'Hello I am description' });
    expect(root.state.expanded).toBe(true);
  });

  it('truncates the contents if they are too long', () => {
    const root = render({ children: 'Hello I am description' });
    root.truncateToMaxHeight({ clientHeight: 101 });
    expect(root.state.expanded).toBe(false);
  });

  it('renders className', () => {
    const root = render({
      children: <p>Hi</p>,
      className: 'test',
    });
    const rootNode = findDOMNode(root);
    expect(rootNode.className).toContain('test');
  });

  it('renders children', () => {
    const root = render({ children: 'Hello I am description' });
    const rootNode = findDOMNode(root);
    expect(rootNode.textContent).toContain('Hello I am description');
  });
});
