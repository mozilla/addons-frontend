import { oneLine } from 'common-tags';
import * as React from 'react';

import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import UserProfileEdit, {
  UserProfileEditBase,
} from 'amo/components/UserProfileEdit';
import {
  editUserAccount,
  fetchUserAccount,
  finishEditUserAccount,
  getCurrentUser,
  loadUserAccount,
} from 'amo/reducers/users';
import { USERS_EDIT } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import Notice from 'ui/components/Notice';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createStubErrorHandler,
  createUserAccountResponse,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  const defaultUserProps = {
    biography: 'Saved the world, too many times.',
    display_name: 'Matt MacTofu',
    homepage: 'https://example.org',
    location: 'Earth',
    occupation: 'Superman',
    userId: 500,
    username: 'tofumatt',
  };

  function createFakeEventChange({ name, value }) {
    return createFakeEvent({
      currentTarget: {
        name,
        value,
      },
    });
  }

  function signInUserWithUsername(username) {
    return dispatchSignInActions({
      userProps: { ...defaultUserProps, username },
    });
  }

  function renderUserProfileEdit({
    i18n = fakeI18n(),
    params = { username: 'tofumatt' },
    userProps = { ...defaultUserProps },
    store = null,
    ...props
  } = {}) {
    if (!store) {
      // eslint-disable-next-line no-param-reassign
      store = dispatchSignInActions({ userProps }).store;
    }

    return shallowUntilTarget(
      <UserProfileEdit i18n={i18n} params={params} store={store} {...props} />,
      UserProfileEditBase
    );
  }

  function _editUserAccount({
    store,
    userFields = {},
    userId = 'user-id',
    errorHandlerId = createStubErrorHandler().id,
  }) {
    store.dispatch(editUserAccount({
      errorHandlerId,
      userFields,
      userId,
    }));
  }

  it('renders user profile page for current logged-in user', () => {
    const root = renderUserProfileEdit();

    expect(root.find('.UserProfileEdit')).toHaveLength(1);
    expect(root.find(Notice)).toHaveLength(0);

    expect(root.find('.UserProfileEdit--Card').first())
      .toHaveProp('header', 'Account');
    expect(root.find('.UserProfileEdit-email--help')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-aside')).toHaveText(oneLine`Tell users a
      bit more information about yourself. These fields are optional, but
      they'll help other users get to know you better.`
    );
    expect(root.find({ htmlFor: 'biography' }))
      .toHaveText('Introduce yourself to the community if you like');
  });

  it('dispatches fetchUserAccount action if username is not found', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const username = 'i-am-not-tofumatt';
    const root = renderUserProfileEdit({ params: { username }, store });

    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username,
    }));
  });

  it('does not dispatch fetchUserAccount action if there is no username', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    // This happens when loading the user edit profile page of the current
    // logged-in user (e.g., page refresh).
    renderUserProfileEdit({ params: {}, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('dispatches fetchUserAccount action if username changes', () => {
    const username = 'black-panther';
    const params = { username };

    const { store } = signInUserWithUsername(username);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfileEdit({ params, store });

    dispatchSpy.reset();

    // We set `user` to `null` because that's what `mapStateToProps()` would do
    // because the user is not loaded yet.
    root.setProps({ username: 'killmonger', user: null });

    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username: 'killmonger',
    }));

    expect(root.find('.UserProfileEdit-location')).toHaveProp('value', '');
  });

  it('does not fetchUserAccount action if user data are available', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, store });
    const user = getCurrentUser(store.getState().users);

    dispatchSpy.reset();

    // We pass the `user` to simulate the case where the user data are already
    // present in the store.
    root.setProps({ username: 'killmonger', user });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not dispatch fetchUserAccount if username does not change', () => {
    const username = 'black-panther';
    const params = { username };

    const { store } = signInUserWithUsername(username);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfileEdit({ params, store });

    dispatchSpy.reset();

    root.setProps({ params });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders a username input field', () => {
    const username = 'some username';
    const root = renderUserProfileEdit({
      params: { username },
      userProps: {
        ...defaultUserProps,
        username,
      },
    });

    expect(root.find('.UserProfileEdit-username')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-username'))
      .toHaveProp('value', username);
  });

  it('renders disabled input fields when user to edit is not loaded', () => {
    const { store } = signInUserWithUsername('current-logged-in-user');
    const username = 'user-not-in-users-state';

    const root = renderUserProfileEdit({ store, params: { username } });

    expect(root.find('.UserProfileEdit-username'))
      .toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-displayName'))
      .toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-homepage'))
      .toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-location'))
      .toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-occupation'))
      .toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-biography'))
      .toHaveProp('disabled', true);
  });

  it('always renders a disabled "email" input field', () => {
    const root = renderUserProfileEdit();

    expect(root.find('.UserProfileEdit-email')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-email')).toHaveProp('disabled', true);
  });

  it('renders help sections for some fields', () => {
    const root = renderUserProfileEdit();

    // Enzyme does not extract "text" from `dangerouslySetInnerHTML` prop,
    // which is needed to escape the link in this help section.That is why we
    // need the `toHaveHTML()` matcher below.
    expect(root.find('.UserProfileEdit-email--help')).toHaveHTML(
      oneLine`<p class="UserProfileEdit-email--help">You can change your email
      address on Firefox Accounts.
      <a href="https://support.mozilla.org/kb/change-primary-email-address-firefox-accounts">Need help?</a></p>`
    );

    expect(root.find('.UserProfileEdit-homepage--help')).toHaveText(
      `This URL will only be visible for users who are developers.`
    );

    expect(root.find('.UserProfileEdit-biography--help')).toHaveText(
      oneLine`Some HTML supported: <abbr title> <acronym title> <b>
      <blockquote> <code> <em> <i> <li> <ol> <strong> <ul>. Links are
      forbidden.`
    );
  });

  it('renders a displayName input field', () => {
    const displayName = 'the display name';
    const root = renderUserProfileEdit({
      userProps: {
        ...defaultUserProps,
        display_name: displayName,
      },
    });

    expect(root.find('.UserProfileEdit-displayName')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-displayName'))
      .toHaveProp('value', displayName);
  });

  it('renders a homepage input field', () => {
    const homepage = 'https://example.org';
    const root = renderUserProfileEdit({
      userProps: {
        ...defaultUserProps,
        homepage,
      },
    });

    expect(root.find('.UserProfileEdit-homepage')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-homepage'))
      .toHaveProp('value', homepage);
  });

  it('renders a location input field', () => {
    const location = 'Freiburg, Germany';
    const root = renderUserProfileEdit({
      userProps: {
        ...defaultUserProps,
        location,
      },
    });

    expect(root.find('.UserProfileEdit-location')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-location'))
      .toHaveProp('value', location);
  });

  it('renders a occupation input field', () => {
    const occupation = 'Bilboquet.';
    const root = renderUserProfileEdit({
      userProps: {
        ...defaultUserProps,
        occupation,
      },
    });

    expect(root.find('.UserProfileEdit-occupation')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-occupation'))
      .toHaveProp('value', occupation);
  });

  it('renders a biography input field', () => {
    const biography = 'This is a biography.';
    const root = renderUserProfileEdit({
      userProps: {
        ...defaultUserProps,
        biography,
      },
    });

    expect(root.find('.UserProfileEdit-biography')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-biography'))
      .toHaveProp('value', biography);
  });

  it('captures input field changes ', () => {
    const fields = [
      'biography',
      'displayName',
      'homepage',
      'location',
      'occupation',
      'username',
    ];

    const root = renderUserProfileEdit();

    expect.assertions(fields.length);
    fields.forEach((field) => {
      const newValue = `new-value-for-${field}`;

      root.find(`.UserProfileEdit-${field}`).simulate(
        'change',
        createFakeEventChange({
          name: field,
          value: newValue,
        })
      );
      expect(root.find(`.UserProfileEdit-${field}`))
        .toHaveProp('value', newValue);
    });
  });

  it('dispatches editUserAccount action with all fields on submit', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, store });
    const user = getCurrentUser(store.getState().users);

    root.find('.UserProfileEdit-form').simulate('submit', createFakeEvent());

    sinon.assert.calledWith(dispatchSpy, editUserAccount({
      errorHandlerId: errorHandler.id,
      userFields: {
        biography: user.biography,
        display_name: user.displayName,
        homepage: user.homepage,
        location: user.location,
        occupation: user.occupation,
        username: user.username,
      },
      userId: user.id,
    }));
  });

  it('renders a submit button', () => {
    const root = renderUserProfileEdit();
    const button = root.find('.UserProfileEdit-submit-button');

    expect(button).toHaveLength(1);
    expect(button.dive()).toHaveText('Update my profile');
    expect(button).toHaveProp('disabled', false);
  });

  it('renders a submit button with a different text when user is not the logged-in user', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const params = { username: 'another-user' };

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-submit-button').dive())
      .toHaveText(`Update user's profile`);
  });

  it('renders a submit button with a different text when editing', () => {
    const { store } = signInUserWithUsername('tofumatt');

    _editUserAccount({ store });

    const root = renderUserProfileEdit({ store });

    expect(root.find('.UserProfileEdit-submit-button').dive())
      .toHaveText('Updating your profile…');
  });

  it('renders a submit button with a different text when user is not the logged-in user and editing', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const params = { username: 'another-user' };

    _editUserAccount({ store });

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-submit-button').dive())
      .toHaveText(`Updating user's profile…`);
  });

  it('disables the submit button when username is empty', () => {
    const root = renderUserProfileEdit();

    root.find(`.UserProfileEdit-username`).simulate(
      'change',
      createFakeEventChange({
        name: 'username',
        value: '',
      })
    );

    expect(root.find('.UserProfileEdit-submit-button'))
      .toHaveProp('disabled', true);
  });

  it('dispatches editUserAccount action with new field values on submit', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, store });
    const user = getCurrentUser(store.getState().users);

    // We want to make sure dispatched action uses the values updated by the
    // user.
    const location = 'new location';
    root.find(`.UserProfileEdit-location`).simulate(
      'change',
      createFakeEventChange({
        name: 'location',
        value: location,
      })
    );
    root.find('.UserProfileEdit-form').simulate('submit', createFakeEvent());

    sinon.assert.calledWith(dispatchSpy, editUserAccount({
      errorHandlerId: errorHandler.id,
      userFields: {
        biography: user.biography,
        display_name: user.displayName,
        homepage: user.homepage,
        location,
        occupation: user.occupation,
        username: user.username,
      },
      userId: user.id,
    }));
  });

  it('renders a success message when user profile has been updated', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const user = getCurrentUser(store.getState().users);

    const occupation = 'new occupation';

    _editUserAccount({
      store,
      userFields: {
        occupation,
      },
      userId: user.id,
    });

    const root = renderUserProfileEdit({ store });

    expect(root.find(Notice)).toHaveLength(0);
    expect(root.find('.UserProfileEdit-submit-button'))
      .toHaveProp('disabled', true);

    // The user profile has been updated.
    store.dispatch(finishEditUserAccount());

    const { isEditing } = store.getState().users;
    root.setProps({ isEditing });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice)).toHaveProp('type', 'success');
    expect(root.find(Notice))
      .toHaveProp('children', 'Profile successfully updated');

    expect(root.find('.UserProfileEdit-submit-button'))
      .toHaveProp('disabled', false);
  });

  it('does not render a success message when an error occured', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const user = getCurrentUser(store.getState().users);

    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });

    const username = '';

    _editUserAccount({
      errorHandlerId: errorHandler.id,
      store,
      userFields: {
        username,
      },
      userId: user.id,
    });

    const root = renderUserProfileEdit({ errorHandler, store });

    expect(root.find(Notice)).toHaveLength(0);
    expect(root.find('.UserProfileEdit-submit-button'))
      .toHaveProp('disabled', true);

    // An error occured while updating the user profile.
    errorHandler.handle(new Error('unexpected error'));
    store.dispatch(finishEditUserAccount());

    const { isEditing } = store.getState().users;
    root.setProps({ isEditing });

    expect(root.find(Notice)).toHaveLength(0);

    expect(root.find('.UserProfileEdit-submit-button'))
      .toHaveProp('disabled', false);
  });

  it('renders a Not Found page when logged-in user cannot edit another user', () => {
    const username = 'current-logged-in-user';
    const { store } = dispatchSignInActions({
      userProps: {
        ...defaultUserProps,
        username,
        permissions: [],
      },
    });

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    // Try to edit this user with another username.
    const params = { username: user.username };
    const root = renderUserProfileEdit({ params, store });

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('allows to edit another user if logged-in user has USERS_EDIT permission', () => {
    const username = 'current-logged-in-user';
    const { store } = dispatchSignInActions({
      userProps: {
        ...defaultUserProps,
        username,
        permissions: [USERS_EDIT],
      },
    });

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    // Try to edit this user with another username.
    const params = { username: user.username };
    const root = renderUserProfileEdit({ params, store });

    expect(root.find(NotFound)).toHaveLength(0);
    expect(root.find('.UserProfileEdit-username'))
      .toHaveProp('value', user.username);

    const linkItems = root.find('.UserProfileEdit-user-links li');
    expect(linkItems.at(0).find(Link))
      .toHaveProp('children', "View user's profile");
    expect(linkItems.at(1).children()).toHaveText("Edit user's profile");

    expect(root.find('.UserProfileEdit--Card').first())
      .toHaveProp('header', 'Account for willdurand');

    expect(root.find('.UserProfileEdit--help-email')).toHaveLength(0);

    expect(root.find('.UserProfileEdit-aside')).toHaveText(oneLine`Tell users a
      bit more information about this user. These fields are optional, but
      they'll help other users get to know willdurand better.`
    );

    expect(root.find({ htmlFor: 'biography' }))
      .toHaveText('Introduce willdurand to the community');
  });

  it('renders errors', () => {
    const { store } = dispatchSignInActions();
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('unexpected error'));

    const root = renderUserProfileEdit({ errorHandler, store });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('returns a 404 if current user is not logged-in', () => {
    const { store } = dispatchClientMetadata();

    const root = renderUserProfileEdit({ store });

    expect(root.find(NotFound)).toHaveLength(1);
  });
});
