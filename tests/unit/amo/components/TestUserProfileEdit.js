import { oneLine } from 'common-tags';
import * as React from 'react';

import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import UserProfileEdit, {
  extractId,
  UserProfileEditBase,
} from 'amo/components/UserProfileEdit';
import UserProfileEditNotifications from 'amo/components/UserProfileEditNotifications';
import UserProfileEditPicture from 'amo/components/UserProfileEditPicture';
import {
  deleteUserAccount,
  deleteUserPicture,
  editUserAccount,
  fetchUserAccount,
  fetchUserNotifications,
  finishEditUserAccount,
  getCurrentUser,
  loadUserAccount,
  loadUserNotifications,
  logOutUser,
} from 'amo/reducers/users';
import { createApiError } from 'core/api';
import {
  CLIENT_APP_FIREFOX,
  USERS_EDIT,
} from 'core/constants';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import Notice from 'ui/components/Notice';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  createFakeRouter,
  createStubErrorHandler,
  createUserAccountResponse,
  createUserNotificationsResponse,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let fakeRouter;

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

    fakeRouter = createFakeRouter({ params });

    return shallowUntilTarget(
      <UserProfileEdit
        i18n={i18n}
        router={fakeRouter}
        store={store}
        {...props}
      />,
      UserProfileEditBase
    );
  }

  function _editUserAccount({
    store,
    picture = null,
    userFields = {},
    userId = 'user-id',
    errorHandlerId = createStubErrorHandler().id,
  }) {
    store.dispatch(editUserAccount({
      errorHandlerId,
      picture,
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
    expect(root.find('.UserProfileEdit-profile-aside')).toHaveText(oneLine`Tell
      users a bit more information about yourself. These fields are optional,
      but they'll help other users get to know you better.`
    );
    expect(root.find({ htmlFor: 'biography' }))
      .toHaveText('Introduce yourself to the community if you like');
    expect(root.find(UserProfileEditPicture)).toHaveLength(1);

    expect(root.find('.UserProfileEdit-notifications-aside'))
      .toHaveText(oneLine`From time to time, Mozilla may send you email about
        upcoming releases and add-on events. Please select the topics you are
        interested in.`);
    expect(root.find(UserProfileEditNotifications)).toHaveLength(1);

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(0);
  });

  it('dispatches fetchUserAccount and fetchUserNotifications actions if username is not found', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const username = 'i-am-not-tofumatt';
    const root = renderUserProfileEdit({ params: { username }, store });

    sinon.assert.callCount(dispatchSpy, 2);
    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: root.instance().props.errorHandler.id,
      username,
    }));
    sinon.assert.calledWith(dispatchSpy, fetchUserNotifications({
      errorHandlerId: root.instance().props.errorHandler.id,
      username,
    }));
  });

  it('dispatches fetchUserNotifications and not fetchUserAccount when the current logged-in user is being edited', () => {
    // We do not have access to the user notifications for the current
    // logged-in user because this user is loaded in Redux when authenticated,
    // and we do not automatically load the notifications.

    const username = 'tofumatt';

    const { store } = signInUserWithUsername(username);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    // This happens when loading the user edit profile page of the current
    // logged-in user (e.g., page refresh).
    renderUserProfileEdit({ errorHandler, params: {}, store });

    sinon.assert.calledOnce(dispatchSpy);
    sinon.assert.calledWith(dispatchSpy, fetchUserNotifications({
      errorHandlerId: errorHandler.id,
      username,
    }));
  });

  it('does not dispatch any actions if the current logged-in user is being edited and the notifications are loaded', () => {
    const username = 'tofumatt';

    const { store } = signInUserWithUsername(username);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    store.dispatch(loadUserNotifications({
      username,
      notifications: createUserNotificationsResponse(),
    }));

    dispatchSpy.reset();

    // This happens when loading the user edit profile page of the current
    // logged-in user (e.g., page refresh).
    renderUserProfileEdit({ params: {}, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('dispatches fetchUserAccount and fetchUserNotifications actions if username changes', () => {
    const username = 'black-panther';
    const params = { username };

    const { store } = signInUserWithUsername(username);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });

    dispatchSpy.reset();

    // We set `user` to `null` because that's what `mapStateToProps()` would do
    // because the user is not loaded yet.
    root.setProps({ username: 'killmonger', user: null });

    sinon.assert.callCount(dispatchSpy, 2);
    sinon.assert.calledWith(dispatchSpy, fetchUserAccount({
      errorHandlerId: errorHandler.id,
      username: 'killmonger',
    }));
    sinon.assert.calledWith(dispatchSpy, fetchUserNotifications({
      errorHandlerId: errorHandler.id,
      username: 'killmonger',
    }));

    expect(root.find('.UserProfileEdit-location')).toHaveProp('value', '');
  });

  it('does not fetchUserAccount action if user data are available', () => {
    const username = 'tofumatt';

    const { store } = signInUserWithUsername(username);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    // We load user notifications here because the purpose of this test case is
    // not to check that part but to make sure `fetchUserAccount()` is not
    // called.
    store.dispatch(loadUserNotifications({
      username,
      notifications: createUserNotificationsResponse(),
    }));

    const root = renderUserProfileEdit({ errorHandler, store });
    const user = getCurrentUser(store.getState().users);

    dispatchSpy.reset();

    // We pass the `user` to simulate the case where the user data are already
    // present in the store.
    root.setProps({ username: 'killmonger', user });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('fetches user notifications when not loaded yet', () => {
    const username = 'tofumatt';

    // When loading the current user, their notifications are not loaded yet
    // and we should dispatch `fetchUserNotifications`.
    const { store } = signInUserWithUsername(username);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, store });
    const user = getCurrentUser(store.getState().users);

    dispatchSpy.reset();

    // We pass the `user` to simulate the case where the user data are already
    // present in the store.
    root.setProps({ username: 'killmonger', user });

    sinon.assert.calledWith(dispatchSpy, fetchUserNotifications({
      errorHandlerId: errorHandler.id,
      username,
    }));
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

    expect(root.find('.UserProfileEdit-notifications--help')).toHaveText(
      oneLine`Mozilla reserves the right to contact you individually about
      specific concerns with your hosted add-ons.`
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
      picture: null,
      userFields: {
        biography: user.biography,
        display_name: user.display_name,
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

  it('renders a delete profile button', () => {
    const root = renderUserProfileEdit();
    const button = root.find('.UserProfileEdit-delete-button');

    expect(button).toHaveLength(1);
    expect(button.dive()).toHaveText('Delete my profile');
    expect(button).toHaveProp('disabled', false);
  });

  it('renders a submit button with a different text when user is not the logged-in user', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const params = { username: 'another-user' };

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-submit-button').dive())
      .toHaveText(`Update user's profile`);
  });

  it('renders a delete button with a different text when user is not the logged-in user', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const params = { username: 'another-user' };

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-delete-button').dive())
      .toHaveText(`Delete user's profile`);
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
      picture: null,
      userFields: {
        biography: user.biography,
        display_name: user.display_name,
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

    const { isUpdating } = store.getState().users;
    root.setProps({ isUpdating });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice)).toHaveProp('type', 'success');
    expect(root.find(Notice))
      .toHaveProp('children', 'Profile successfully updated');

    expect(root.find('.UserProfileEdit-submit-button'))
      .toHaveProp('disabled', false);
  });

  it('does not change the URL when username has not changed', () => {
    const oldUsername = 'tofumatt';
    const newUsername = oldUsername;

    const { store } = signInUserWithUsername(oldUsername);

    const root = renderUserProfileEdit({
      params: { username: oldUsername },
      store,
    });

    root.setProps({
      params: { username: newUsername },
      username: newUsername,
    });

    sinon.assert.notCalled(fakeRouter.push);
  });

  it('changes the URL when username has changed', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'fr-FR';

    const oldUsername = 'tofumatt';
    const newUsername = 'tofumatt-123';

    const { store } = dispatchSignInActions({
      clientApp,
      lang,
      userProps: {
        ...defaultUserProps,
        username: oldUsername,
      },
    });

    const root = renderUserProfileEdit({
      params: { username: oldUsername },
      store,
    });

    root.setProps({
      params: { username: newUsername },
      username: newUsername,
    });

    sinon.assert.calledWith(
      fakeRouter.push,
      `/${lang}/${clientApp}/user/${newUsername}/edit/`
    );
  });

  it('does not change the URL when username has changed but no username param found in URL', () => {
    // This is the case when the current logged-in user changes their username
    // on `/en-US/firefox/users/edit` (the URL of the edit page for a logged-in
    // user).
    const oldUsername = 'tofumatt';
    const newUsername = 'tofumatt-123';

    const { store } = signInUserWithUsername(oldUsername);
    const root = renderUserProfileEdit({ store, params: {} });

    root.setProps({ username: newUsername, params: {} });

    sinon.assert.notCalled(fakeRouter.push);
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

    const { isUpdating } = store.getState().users;
    root.setProps({ isUpdating });

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

    // We do not display these help messages when current logged-in user edits
    // another user.
    expect(root.find('.UserProfileEdit-email--help')).toHaveLength(0);
    expect(root.find('.UserProfileEdit-notifications--help')).toHaveLength(0);

    expect(root.find('.UserProfileEdit-profile-aside')).toHaveText(oneLine`Tell
      users a bit more information about this user. These fields are optional,
      but they'll help other users get to know willdurand better.`
    );

    expect(root.find({ htmlFor: 'biography' }))
      .toHaveText('Introduce willdurand to the community');

    expect(root.find('.UserProfileEdit-notifications-aside'))
      .toHaveText(oneLine`From time to time, Mozilla may send this user email
        about upcoming releases and add-on events. Please select the topics
        this user may be interested in.`);
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

  it('displays an AuthenticateButton if current user is not logged-in', () => {
    const { store } = dispatchClientMetadata();

    const root = renderUserProfileEdit({
      store,
      params: {},
    });

    expect(root.find(AuthenticateButton)).toHaveLength(1);
    expect(root.find(AuthenticateButton))
      .toHaveProp('logInText', 'Log in to edit the profile');
  });

  it('displays an AuthenticateButton if current user is not logged-in and loads a user edit page', () => {
    const { store } = dispatchClientMetadata();

    const root = renderUserProfileEdit({
      store,
      params: { username: 'someone-else' },
    });

    expect(root.find(AuthenticateButton)).toHaveLength(1);
  });

  // See: https://github.com/mozilla/addons-frontend/issues/5034
  it('does not dispatch fetchUserAccount() when user logs out', () => {
    const { store } = dispatchSignInActions();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    // The user edits their profile.
    const root = renderUserProfileEdit({ params: {}, store });

    dispatchSpy.reset();

    // The user logs out.
    root.setProps({
      currentUser: null,
      // When the user browses their profile, `user` is the `currentUser` and
      // there is no `username` that is why we reset these values here.
      user: null,
      username: null,
    });

    sinon.assert.notCalled(dispatchSpy);
    // We should also see an AuthenticateButton when this use case happens.
    expect(root.find(AuthenticateButton)).toHaveLength(1);
  });

  it('does not dispatch fetchUserAccount() when user logs out on a user edit page', () => {
    const username = 'logged-in-user';
    const { store } = dispatchSignInActions({
      userProps: {
        ...defaultUserProps,
        username,
        permissions: [USERS_EDIT],
      },
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    // The current logged-in user edits the profile of the other `user`.
    const params = { username: user.username };
    const root = renderUserProfileEdit({ params, store });

    dispatchSpy.reset();

    // The user logs out.
    root.setProps({ currentUser: null, params });

    sinon.assert.notCalled(dispatchSpy);
    // We should also see an AuthenticateButton when this use case happens.
    expect(root.find(AuthenticateButton)).toHaveLength(1);
  });

  it('renders a not found page if the API request is a 404', () => {
    const { store } = dispatchSignInActions();
    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(createApiError({
      response: { status: 404 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'not found' },
    }));

    const root = renderUserProfileEdit({ errorHandler, store });

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('does not dispatch any action when there is an error', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: fakeDispatch,
    });
    errorHandler.handle(new Error('unexpected error'));

    fakeDispatch.reset();

    renderUserProfileEdit({ errorHandler, store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches a deleteUserPicture action when user deletes their profile picture', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const user = getCurrentUser(store.getState().users);

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, store });

    dispatchSpy.reset();

    const onDelete = root.find(UserProfileEditPicture).prop('onDelete');

    sinon.assert.notCalled(dispatchSpy);

    onDelete(createFakeEvent());

    sinon.assert.calledWith(dispatchSpy, deleteUserPicture({
      errorHandlerId: errorHandler.id,
      userId: user.id,
    }));
  });

  it('stores the picture file selected by the user', () => {
    const selectedFile = new File([], 'image.png');

    const { store } = signInUserWithUsername('tofumatt');
    const root = renderUserProfileEdit({ store });

    expect(root).toHaveState('picture', null);

    const onSelect = root.find(UserProfileEditPicture).prop('onSelect');
    const loadPictureSpy = sinon.spy(root.instance(), 'loadPicture');

    sinon.assert.notCalled(loadPictureSpy);

    onSelect(createFakeEvent({
      currentTarget: {
        files: [selectedFile],
      },
    }));

    expect(root).toHaveState('picture', selectedFile);
    expect(root).toHaveState('successMessage', null);

    sinon.assert.calledWith(loadPictureSpy, selectedFile);
  });

  it('loads a picture file', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const root = renderUserProfileEdit({ store });

    const result = 'some-data-uri-content';

    root.instance().onPictureLoaded(createFakeEvent({
      target: {
        result,
      },
    }));

    expect(root).toHaveState('pictureData', result);
  });

  it('displays a message when user has deleted their profile picture', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        ...defaultUserProps,
        picture_url: 'https://example.org/pp.png',
      },
    });

    const root = renderUserProfileEdit({ store });
    const user = getCurrentUser(store.getState().users);

    expect(root.find(Notice)).toHaveLength(0);

    // The user profile picture has been successfully deleted.
    root.setProps({
      user: {
        ...user,
        picture_url: null,
      },
    });

    expect(root.find(Notice)).toHaveLength(1);
    expect(root.find(Notice)).toHaveProp('type', 'success');
    expect(root.find(Notice))
      .toHaveProp('children', 'Picture successfully deleted');

    expect(root).toHaveState('pictureData', null);
  });

  it('displays a modal when user clicks the delete profile button', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const preventDefaultSpy = sinon.spy();

    const root = renderUserProfileEdit({ store });

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(0);

    root.find('.UserProfileEdit-delete-button').simulate(
      'click',
      createFakeEvent({ preventDefault: preventDefaultSpy })
    );

    sinon.assert.called(preventDefaultSpy);

    const modal = root.find('.UserProfileEdit-deletion-modal');

    expect(modal).toHaveLength(1);
    expect(modal).toHaveProp(
      'header',
      'Attention: you are about to delete your profile. Are you sure?'
    );
    expect(modal).toHaveProp('visibleOnLoad', true);

    expect(modal.find('p').at(0)).toHaveProp('dangerouslySetInnerHTML', {
      __html: oneLine`If you confirm this <strong>irreversible action</strong>,
        the following data will be removed: profile picture, profile details
        (including username, email, display name, location, home page,
        biography, occupation) and notification preferences. Other data such as
        ratings and reviews will be anonymized.`,
    });

    expect(modal.find('p').at(1)).toHaveText(oneLine`Important: if you own
      add-ons, you have to transfer them to other users or to delete them
      before you can delete your profile.`);

    expect(root.find('.UserProfileEdit-confirm-button')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-confirm-button').children())
      .toHaveText('Yes, delete my profile');
    expect(root.find('.UserProfileEdit-cancel-button')).toHaveLength(1);
  });

  it('renders different information in the modal when user to be deleted is not the current logged-in user', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const params = { username: 'another-user' };

    const root = renderUserProfileEdit({ params, store });

    root.find('.UserProfileEdit-delete-button')
      .simulate('click', createFakeEvent());

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveProp(
      'header',
      'Attention: you are about to delete a profile. Are you sure?'
    );

    expect(root.find('.UserProfileEdit-deletion-modal').find('p'))
      .toHaveLength(1);

    expect(root.find('.UserProfileEdit-confirm-button').children())
      .toHaveText('Yes, delete this profile');
  });

  it('closes the modal when user clicks the cancel button', () => {
    const { store } = signInUserWithUsername('tofumatt');
    const root = renderUserProfileEdit({ store });

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(0);

    root.find('.UserProfileEdit-delete-button').simulate(
      'click',
      createFakeEvent()
    );

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(1);

    root.find('.UserProfileEdit-cancel-button').simulate(
      'click',
      createFakeEvent()
    );

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(0);
  });

  it('dispatches deleteUserAccount and logOutUser when current logged-in user confirms account deletion', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'fr-FR';

    const userId = 456;
    const username = 'tofumatt';
    const params = { username };

    const { store } = dispatchSignInActions({
      clientApp,
      lang,
      userProps: {
        ...defaultUserProps,
        id: userId,
        username,
      },
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });

    dispatchSpy.reset();

    // User opens the modal.
    root.find('.UserProfileEdit-delete-button').simulate(
      'click',
      createFakeEvent()
    );

    sinon.assert.notCalled(dispatchSpy);

    // User confirms account deletion.
    root.find('.UserProfileEdit-confirm-button').simulate(
      'click',
      createFakeEvent()
    );

    sinon.assert.callCount(dispatchSpy, 2);
    sinon.assert.calledWith(dispatchSpy, deleteUserAccount({
      errorHandlerId: errorHandler.id,
      userId,
    }));
    sinon.assert.calledWith(dispatchSpy, logOutUser());

    sinon.assert.calledWith(fakeRouter.push, `/${lang}/${clientApp}`);
  });

  it('does not dispatch logOutUser when current logged-in user confirms deletion of another user account', () => {
    const { store } = dispatchSignInActions({
      userProps: {
        ...defaultUserProps,
        username: 'an-admin-user',
        permissions: [USERS_EDIT],
      },
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    // Create a user with another username.
    const user = createUserAccountResponse({ username: 'willdurand' });
    store.dispatch(loadUserAccount({ user }));

    const root = renderUserProfileEdit({
      errorHandler,
      params: { username: user.username },
      store,
    });

    dispatchSpy.reset();

    // User opens the modal.
    root.find('.UserProfileEdit-delete-button').simulate(
      'click',
      createFakeEvent()
    );

    sinon.assert.notCalled(dispatchSpy);

    // User confirms account deletion.
    root.find('.UserProfileEdit-confirm-button').simulate(
      'click',
      createFakeEvent()
    );

    sinon.assert.callCount(dispatchSpy, 1);
    sinon.assert.calledWith(dispatchSpy, deleteUserAccount({
      errorHandlerId: errorHandler.id,
      userId: user.id,
    }));
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const username = 'foo';
      const params = { username };

      expect(extractId({ params })).toEqual(username);
    });
  });
});
