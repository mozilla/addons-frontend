import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Header, { HeaderBase } from 'amo/components/Header';
import Link from 'amo/components/Link';
import AuthenticateButton from 'core/components/AuthenticateButton';
import DropdownMenu from 'ui/components/DropdownMenu';
import DropdownMenuItem from 'ui/components/DropdownMenuItem';
import { VIEW_CONTEXT_HOME } from 'core/constants';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  getFakeI18nInst,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  function renderHeader({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    const fakeI18n = getFakeI18nInst();
    const allProps = {
      i18n: fakeI18n,
      location: {},
      query: '',
      ...props,
    };

    return shallowUntilTarget(
      <Header store={store} {...allProps} />,
      HeaderBase,
    );
  }

  it('renders an <h1> when isHomepage is true', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(setViewContext(VIEW_CONTEXT_HOME));
    const root = renderHeader({ store });

    expect(root.find('.Header-title-wrapper')).toHaveTagName('h1');
    expect(root.find('.Header-title').type()).toEqual(Link);
    expect(root.find('.Header-title').prop('children'))
      .toContain('Firefox Add-ons');
  });

  it('always renders a link in the header when not on homepage', () => {
    const root = renderHeader();

    // There shouldn't be an H1 in the header on pages that aren't the
    // homepage; other routes will render their own, more relevant, H1 tags.
    expect(root.find('h1')).toHaveLength(0);
    expect(root.find('.Header-title').type()).toEqual(Link);
    expect(root.find('.Header-title').prop('children'))
      .toContain('Firefox Add-ons');
  });

  it('displays `login` text when user is not signed in', () => {
    const wrapper = renderHeader();

    expect(wrapper.find(AuthenticateButton)).toHaveLength(1);
    expect(wrapper.find(DropdownMenu)).toHaveLength(0);
  });

  it('displays a menu and the username when user is signed in', () => {
    const { store } = dispatchSignInActions({ username: 'babar' });
    const wrapper = renderHeader({ store });

    expect(wrapper.find(DropdownMenu)).toHaveLength(1);
    expect(wrapper.find(DropdownMenu)).toHaveProp('text', 'babar');
  });

  it('allows a signed-in user to log out', () => {
    const { store } = dispatchSignInActions({ username: 'babar' });
    const handleLogOut = sinon.stub();

    const wrapper = renderHeader({ store, handleLogOut });

    const onClick = wrapper.find(DropdownMenuItem).last().prop('onClick');
    onClick(createFakeEvent());

    sinon.assert.calledWith(handleLogOut, {
      api: store.getState().api,
    });
  });
});
