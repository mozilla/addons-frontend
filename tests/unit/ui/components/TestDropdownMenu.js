import React from 'react';
import { mount } from 'enzyme';

import DropdownMenu, { DropdownMenuBase } from 'ui/components/DropdownMenu';
import DropdownMenuItem from 'ui/components/DropdownMenuItem';
import Icon from 'ui/components/Icon';
import { createFakeEvent, shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  it('renders a menu', () => {
    const menu = shallowUntilTarget(
      <DropdownMenu text="Menu" />,
      DropdownMenuBase
    );

    expect(menu).toHaveClassName('DropdownMenu');
    expect(menu.find('.DropdownMenu-text')).toIncludeText('Menu');
    expect(menu.find(Icon)).toHaveLength(1);
    expect(menu.find('.DropdownMenu-items')).toHaveLength(0);
  });

  it('renders items passed as children', () => {
    const menu = shallowUntilTarget(
      <DropdownMenu text="Menu">
        <DropdownMenuItem>A section</DropdownMenuItem>
      </DropdownMenu>,
      DropdownMenuBase
    );

    expect(menu.find('.DropdownMenu-items')).toHaveLength(1);
    expect(menu.find(DropdownMenuItem)).toHaveLength(1);
  });

  it('toggles the menu state when button is clicked', () => {
    const menu = shallowUntilTarget(
      <DropdownMenu text="Menu" />,
      DropdownMenuBase
    );
    expect(menu).not.toHaveClassName('DropdownMenu--active');

    // User clicks the menu main button.
    menu.find('.DropdownMenu-text').simulate('click', createFakeEvent());
    expect(menu).toHaveClassName('DropdownMenu--active');

    // User clicks the menu main button, again.
    menu.find('.DropdownMenu-text').simulate('click', createFakeEvent());
    expect(menu).not.toHaveClassName('DropdownMenu--active');
  });

  it('resets the menu state on blur', () => {
    const root = mount(<DropdownMenu text="Menu" />);
    const menu = root.find('.DropdownMenu');

    // User clicks the menu main button.
    menu.find('.DropdownMenu-text').simulate('click', createFakeEvent());
    expect(menu).toHaveClassName('DropdownMenu--active');

    // User clicks somewhere else.
    // The first `instance()` call is Enzyme API, the second `getInstance()`
    // call is react-onclickoutside API. See:
    // https://github.com/Pomax/react-onclickoutside#but-how-can-i-access-my-component-it-has-an-api-that-i-rely-on
    root.instance().getInstance().handleClickOutside();
    expect(menu).not.toHaveClassName('DropdownMenu--active');
  });

  it('optionally takes a class name', () => {
    const menu = shallowUntilTarget(
      <DropdownMenu text="Menu" className="my-class" />,
      DropdownMenuBase
    );

    expect(menu).toHaveClassName('DropdownMenu');
    expect(menu).toHaveClassName('my-class');
  });
});
