import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Header, { HeaderBase } from 'amo/components/Header';
import Link from 'amo/components/Link';
import AuthenticateButton from 'core/components/AuthenticateButton';
import DropdownMenu from 'ui/components/DropdownMenu';
import { VIEW_CONTEXT_HOME } from 'core/constants';
import {
  createFakeEvent,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function renderHeader({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    const allProps = {
      i18n: fakeI18n(),
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
    expect(root.find('.Header-title .visually-hidden').childAt(0)).toHaveText(
      'Firefox Add-ons',
    );
  });

  it('always renders a link in the header when not on homepage', () => {
    const root = renderHeader();

    // There shouldn't be an H1 in the header on pages that aren't the
    // homepage; other routes will render their own, more relevant, H1 tags.
    expect(root.find('h1')).toHaveLength(0);
    expect(root.find('.Header-title').type()).toEqual(Link);
    expect(root.find('.Header-title .visually-hidden').childAt(0)).toHaveText(
      'Firefox Add-ons',
    );
  });

  it('displays `login` text when user is not signed in', () => {
    const wrapper = renderHeader();

    expect(wrapper.find(AuthenticateButton)).toHaveLength(1);
    expect(wrapper.find(DropdownMenu)).toHaveLength(0);
  });

  it('displays a menu and the display name when user is signed in', () => {
    const displayName = 'King of the Elephants';
    const { store } = dispatchSignInActions({
      userProps: {
        display_name: displayName,
      },
    });
    const wrapper = renderHeader({ store });

    expect(wrapper.find(DropdownMenu)).toHaveLength(1);
    expect(wrapper.find(DropdownMenu)).toHaveProp('text', displayName);
  });

  it('displays the username when user is signed in but has no display name', () => {
    const { store } = dispatchSignInActions({
      userProps: { username: 'babar' },
    });
    const wrapper = renderHeader({ store });

    expect(wrapper.find(DropdownMenu)).toHaveLength(1);
    expect(wrapper.find(DropdownMenu)).toHaveProp('text', 'babar');
  });

  it('displays link to my collections when user is signed in', () => {
    const { store } = dispatchSignInActions();
    const wrapper = renderHeader({ store });
    const link = wrapper.find('.Header-user-menu-collections-link');

    expect(link).toHaveLength(1);
    expect(link.prop('children')).toEqual('View My Collections');
    expect(link.prop('to')).toEqual('/collections/');
  });

  it('displays a view profile link when user is signed in', () => {
    const id = 124;
    const { store } = dispatchSignInActions({
      userProps: { id },
    });
    const wrapper = renderHeader({ store });
    const link = wrapper.find('.Header-user-menu-view-profile-link');

    expect(link).toHaveLength(1);
    expect(link.prop('children')).toEqual('View My Profile');
    expect(link.prop('to')).toEqual(`/user/${id}/`);
  });

  it('displays an edit profile link when user is signed in', () => {
    const { store } = dispatchSignInActions();
    const wrapper = renderHeader({ store });
    const link = wrapper.find('.Header-user-menu-edit-profile-link');

    expect(link).toHaveLength(1);
    expect(link.prop('children')).toEqual('Edit My Profile');
    expect(link.prop('to')).toEqual('/users/edit');
  });

  it('allows a signed-in user to log out', () => {
    const { store } = dispatchSignInActions();
    const handleLogOut = sinon.stub();

    const wrapper = renderHeader({ store, handleLogOut });

    const onClick = wrapper.find('.Header-logout-button').prop('onClick');
    onClick(createFakeEvent());

    sinon.assert.calledWith(handleLogOut, {
      api: store.getState().api,
    });
  });

  it('displays the reviewer tools link when user has a reviewer permission', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        permissions: ['Addons:PostReview'],
      },
    });
    const wrapper = renderHeader({ store });
    const link = wrapper.find('.Header-user-menu-reviewer-tools-link');

    expect(link).toHaveLength(1);
    expect(link.prop('children')).toEqual('Reviewer Tools');
    expect(link).toHaveProp('href', '/reviewers/');
  });

  it('does not display the reviewer tools link when user does not have permission', () => {
    const { store } = dispatchSignInActions();
    const wrapper = renderHeader({ store });
    const link = wrapper.find('.Header-user-menu-reviewer-tools-link');

    expect(link).toHaveLength(0);
  });

  it('displays a "manage my submissions" link when user is logged in', () => {
    const { store } = dispatchSignInActions();
    const wrapper = renderHeader({ store });
    const link = wrapper.find('.Header-user-menu-developers-submissions-link');

    expect(link).toHaveLength(1);
    expect(link.children()).toHaveText('Manage My Submissions');
    expect(link).toHaveProp('href', '/developers/addons/');
  });
});
