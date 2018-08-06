import * as React from 'react';
import { shallow, mount } from 'enzyme';

import ShowMoreCard, {
  ShowMoreCardBase,
  MAX_HEIGHT,
} from 'ui/components/ShowMoreCard';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props) => {
    return shallowUntilTarget(
      <ShowMoreCard i18n={fakeI18n()} {...props} />,
      ShowMoreCardBase,
    );
  };

  it('reveals more text when clicking "show more" link', () => {
    const root = render({ children: 'Hello I am description' });

    // We have to manually set the expanded flag to false because we don't have
    // a clientHeight in the tests.
    root.setState({ expanded: false });

    expect(root).not.toHaveClassName('ShowMoreCard--expanded');

    // We have to shallow this prop because we pass a component to it.
    expect(shallow(root.prop('footerLink')).html()).toContain(
      '<span class="visually-hidden">Expand to</span> Read more',
    );

    // We cannot directly target the footer link, so we simulate the click here.
    root.instance().onClick(createFakeEvent());
    root.update();

    expect(root).toHaveClassName('ShowMoreCard--expanded');

    expect(root).toHaveProp('footerLink', null);
  });

  it('is expanded by default', () => {
    const root = render({ children: 'Hello I am description' });

    expect(root).toHaveClassName('ShowMoreCard--expanded');
  });

  it('truncates the contents if they are too long', () => {
    const root = render({ children: 'Hello I am description' });

    root.instance().truncateToMaxHeight({ clientHeight: MAX_HEIGHT + 1 });
    root.update();

    expect(root).not.toHaveClassName('ShowMoreCard--expanded');
  });

  it('renders className', () => {
    const className = 'test';
    const root = render({
      children: <p>Hi</p>,
      className,
    });

    expect(root).toHaveClassName(className);
  });

  it('renders children', () => {
    const root = render({ children: 'Hello I am description' });

    expect(root.childAt(0)).toHaveText('Hello I am description');
  });

  it('executes truncateToMaxHeight when it recieves props', () => {
    const root = mount(<ShowMoreCardBase i18n={fakeI18n()} />);
    const component = root.instance();

    const contentNode = component.contents;
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
