import React from 'react';
import { mount } from 'enzyme';

import DropdownMenu, { DropdownMenuBase } from 'ui/components/DropdownMenu';
import DropdownMenuItem from 'ui/components/DropdownMenuItem';
import Icon from 'ui/components/Icon';
import { createFakeEvent, shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  const renderComponent = (componentInstance) => {
    return shallowUntilTarget(componentInstance, DropdownMenuBase);
  };

  it('renders a menu', () => {
    const menu = renderComponent(<DropdownMenu text="Menu" />);

    expect(menu).toHaveClassName('DropdownMenu');
    expect(menu.find('.DropdownMenu-button')).toIncludeText('Menu');
    expect(menu.find(Icon)).toHaveLength(1);
    expect(menu.find('.DropdownMenu-items')).toHaveLength(0);
  });

  it('renders items passed as children', () => {
    const menu = renderComponent(
      <DropdownMenu text="Menu">
        <DropdownMenuItem>A section</DropdownMenuItem>
      </DropdownMenu>
    );

    expect(menu.find('.DropdownMenu-items')).toHaveLength(1);
    expect(menu.find(DropdownMenuItem)).toHaveLength(1);
  });

  it('toggles the menu state when button is clicked', () => {
    const menu = renderComponent(<DropdownMenu text="Menu" />);
    expect(menu).not.toHaveClassName('DropdownMenu--active');

    // User clicks the menu main button.
    menu.find('.DropdownMenu-button').simulate('click', createFakeEvent());
    expect(menu).toHaveClassName('DropdownMenu--active');

    // User clicks the menu main button, again.
    menu.find('.DropdownMenu-button').simulate('click', createFakeEvent());
    expect(menu).not.toHaveClassName('DropdownMenu--active');
  });

  it('resets the menu state on blur', () => {
    const root = mount(<DropdownMenu text="Menu" />);
    const menu = root.find('.DropdownMenu');

    // User clicks the menu main button.
    menu.find('.DropdownMenu-button').simulate('click', createFakeEvent());
    expect(menu).toHaveClassName('DropdownMenu--active');

    // User clicks somewhere else.
    // The first `instance()` call is Enzyme API, the second `getInstance()`
    // call is react-onclickoutside API. See:
    // https://github.com/Pomax/react-onclickoutside#but-how-can-i-access-my-component-it-has-an-api-that-i-rely-on
    root.instance().getInstance().handleClickOutside();
    expect(menu).not.toHaveClassName('DropdownMenu--active');
  });

  it('optionally takes a class name', () => {
    const menu = renderComponent(
      <DropdownMenu text="Menu" className="my-class" />
    );

    expect(menu).toHaveClassName('DropdownMenu');
    expect(menu).toHaveClassName('my-class');
  });
});
