import * as React from 'react';
import { mount } from 'enzyme';

import DropdownMenu, { DropdownMenuBase } from 'amo/components/DropdownMenu';
import DropdownMenuItem from 'amo/components/DropdownMenuItem';
import Icon from 'amo/components/Icon';
import { createFakeEvent, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const renderComponent = (componentInstance) => {
    return shallowUntilTarget(componentInstance, DropdownMenuBase, {
      // This is needed because of `react-onclickoutside`, see:
      // https://github.com/mozilla/addons-frontend/issues/5879
      shallowOptions: { disableLifecycleMethods: true },
    });
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
      </DropdownMenu>,
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
    // When using `mount`, Enzyme 3+ requires to `.find()` the elements all the
    // time, in case something has changed.
    const getMenu = () => root.find('.DropdownMenu');

    // User clicks the menu main button.
    getMenu().find('.DropdownMenu-button').simulate('click', createFakeEvent());
    expect(getMenu()).toHaveClassName('DropdownMenu--active');

    // User clicks somewhere else.
    // The first `instance()` call is Enzyme API, the second `getInstance()`
    // call is react-onclickoutside API. See:
    // https://github.com/Pomax/react-onclickoutside#but-how-can-i-access-my-component-it-has-an-api-that-i-rely-on
    root.instance().getInstance().handleClickOutside();
    // When using `mount`, Enzyme 3+ requires to `.update()` when we manually
    // make changes, like above.
    root.update();

    expect(getMenu()).not.toHaveClassName('DropdownMenu--active');
  });

  it('resets the menu state on click', () => {
    // See: https://github.com/mozilla/addons-frontend/issues/3452
    const root = mount(
      <DropdownMenu text="Menu">
        <DropdownMenuItem>
          <a className="TestLink" href="/test-link/">
            Test!
          </a>
        </DropdownMenuItem>
      </DropdownMenu>,
    );
    const getMenu = () => root.find('.DropdownMenu');

    // User clicks the menu main button to open it.
    getMenu().find('.DropdownMenu-button').simulate('click', createFakeEvent());
    expect(getMenu()).toHaveClassName('DropdownMenu--active');

    // User clicks a link.
    getMenu().find('.TestLink').simulate('click', createFakeEvent());
    expect(getMenu()).not.toHaveClassName('DropdownMenu--active');
  });

  it('sets active on mouseEnter/clears on mouseLeave', () => {
    // We do this instead of a :hover with CSS to allow clearing the active
    // state after a click.
    const root = mount(<DropdownMenu text="Menu" />);
    const getMenu = () => root.find('.DropdownMenu');

    // User hovers on the menu.
    getMenu().simulate('mouseEnter', createFakeEvent());
    expect(getMenu()).toHaveClassName('DropdownMenu--active');

    // User's mouse leaves the menu.
    getMenu().simulate('mouseLeave', createFakeEvent());
    expect(getMenu()).not.toHaveClassName('DropdownMenu--active');
  });

  it('optionally takes a class name', () => {
    const menu = renderComponent(
      <DropdownMenu text="Menu" className="my-class" />,
    );

    expect(menu).toHaveClassName('DropdownMenu');
    expect(menu).toHaveClassName('my-class');
  });
});
