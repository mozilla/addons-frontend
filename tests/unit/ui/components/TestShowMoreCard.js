import * as React from 'react';
import { mount } from 'enzyme';
import { findDOMNode } from 'react-dom';
import { Simulate, renderIntoDocument } from 'react-dom/test-utils';

import { ShowMoreCardBase, MAX_HEIGHT } from 'ui/components/ShowMoreCard';
import { fakeI18n } from 'tests/unit/helpers';

function render(props) {
  return renderIntoDocument(<ShowMoreCardBase i18n={fakeI18n()} {...props} />);
}

describe(__filename, () => {
  it('reveals more text when clicking "show more" link', () => {
    const root = render({ children: 'Hello I am description' });
    const rootNode = findDOMNode(root);

    // We have to manually set the expanded flag to false because we
    // don't have a clientHeight in the tests.
    root.setState({ expanded: false });
    expect(rootNode.className).not.toContain('.ShowMoreCard--expanded');
    expect(root.state.expanded).toEqual(false);
    expect(rootNode.querySelector('.Card-footer-link').textContent).toEqual(
      'Expand to Read more',
    );

    Simulate.click(rootNode.querySelector('.Card-footer-link a'));

    expect(rootNode.className).toContain('ShowMoreCard--expanded');
    expect(root.state.expanded).toEqual(true);

    expect(rootNode.querySelector('.Card-footer-link')).toEqual(null);
  });

  it('is expanded by default', () => {
    const root = render({ children: 'Hello I am description' });
    expect(root.state.expanded).toEqual(true);
  });

  it('truncates the contents if they are too long', () => {
    const root = render({ children: 'Hello I am description' });
    root.truncateToMaxHeight({ clientHeight: MAX_HEIGHT + 1 });
    expect(root.state.expanded).toEqual(false);
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

  it('executes truncateToMaxHeight when it recieves props', () => {
    const root = mount(<ShowMoreCardBase i18n={fakeI18n()} />);
    const component = root.instance();

    const contentNode = findDOMNode(component.contents);
    const truncateToMaxHeight = sinon.spy(component, 'truncateToMaxHeight');
    root.setProps(); // simulate any kind of update to properties

    sinon.assert.calledWith(truncateToMaxHeight, contentNode);
  });

  it('expands if new child content is smaller', () => {
    const root = mount(
      <ShowMoreCardBase i18n={fakeI18n()}>
        This would be very long content, but we cannot get `clientHeight` in the
        tests, so this will be forced below (via setState()).
      </ShowMoreCardBase>,
    );

    // We have to manually set the expanded flag to false because we don't have
    // a `clientHeight` in the tests.
    root.setState({ expanded: false });

    expect(root.state('expanded')).toEqual(false);
    // This will call `componentWillReceiveProps()`, the content of `children`
    // is for example purpose.
    root.setProps({ children: 'short content' });
    expect(root.state('expanded')).toEqual(true);
  });
});
