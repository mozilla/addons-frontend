import { oneLine } from 'common-tags';
import * as React from 'react';

import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import UserProfileEdit, {
  extractId,
  UserProfileEditBase,
} from 'amo/pages/UserProfileEdit';
import UserProfileEditNotifications from 'amo/components/UserProfileEditNotifications';
import UserProfileEditPicture from 'amo/components/UserProfileEditPicture';
import {
  deleteUserAccount,
  deleteUserPicture,
  updateUserAccount,
  fetchUserAccount,
  fetchUserNotifications,
  finishUpdateUserAccount,
  getCurrentUser,
  loadUserAccount,
  loadUserNotifications,
  logOutUser,
} from 'amo/reducers/users';
import { createApiError } from 'core/api';
import { CLIENT_APP_FIREFOX, USERS_EDIT } from 'core/constants';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { ErrorHandler } from 'core/errorHandler';
import ErrorList from 'ui/components/ErrorList';
import Notice from 'ui/components/Notice';
import {
  createFakeEvent,
  createFakeHistory,
  createStubErrorHandler,
  createUserAccountResponse,
  createUserNotificationsResponse,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultUserProps = (props = {}) => {
    return {
      biography: 'Saved the world, too many times.',
      display_name: 'Matt MacTofu',
      homepage: 'https://example.org',
      location: 'Earth',
      num_addons_listed: 0,
      occupation: 'Superman',
      userId: 500,
      username: 'tofumatt',
      ...props,
    };
  };

  function createFakeEventChange({ name, value }) {
    return createFakeEvent({
      currentTarget: {
        name,
        value,
      },
    });
  }

  function signInUserWithProps({ userId = 123, ...props }) {
    return {
      params: { userId },
      store: dispatchSignInActions({
        userId,
        userProps: defaultUserProps({ userId, ...props }),
      }).store,
    };
  }

  function signInUserWithUserId(userId) {
    return signInUserWithProps({ userId });
  }

  function renderUserProfileEdit({
    history = createFakeHistory(),
    i18n = fakeI18n(),
    params = { userId: 100 },
    store = null,
    userProps,
    ...props
  } = {}) {
    if (!store) {
      // eslint-disable-next-line no-param-reassign
      store = dispatchSignInActions({
        userId: params.userId,
        userProps: defaultUserProps(userProps),
      }).store;
    }

    return shallowUntilTarget(
      <UserProfileEdit
        _window={{}}
        history={history}
        i18n={i18n}
        match={{ params }}
        store={store}
        {...props}
      />,
      UserProfileEditBase,
    );
  }

  function _updateUserAccount({
    store,
    notifications = {},
    picture = null,
    userFields = {},
    userId = 'user-id',
    errorHandlerId = createStubErrorHandler().id,
  }) {
    store.dispatch(
      updateUserAccount({
        errorHandlerId,
        notifications,
        picture,
        userFields,
        userId,
      }),
    );
  }

  it('renders user profile page for current logged-in user', () => {
    const root = renderUserProfileEdit();

    expect(root.find('.UserProfileEdit')).toHaveLength(1);
    expect(root.find(Notice)).toHaveLength(0);

    expect(root.find('.UserProfileEdit--Card').first()).toHaveProp(
      'header',
      'Account',
    );
    expect(root.find('.UserProfileEdit-profile-aside')).toHaveText(oneLine`Tell
      users a bit more information about yourself. These fields are optional,
      but they'll help other users get to know you better.`);
    expect(root.find({ htmlFor: 'biography' })).toHaveText(
      'Introduce yourself to the community if you like',
    );
    expect(root.find(UserProfileEditPicture)).toHaveLength(1);

    expect(root.find('.UserProfileEdit-manage-account-link')).toHaveLength(1);

    expect(root.find('.UserProfileEdit-notifications-aside'))
      .toHaveText(oneLine`From time to time, Mozilla may send you email about
        upcoming releases and add-on events. Please select the topics you are
        interested in.`);
    expect(root.find(UserProfileEditNotifications)).toHaveLength(1);

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(0);
  });

  it('dispatches fetchUserAccount and fetchUserNotifications actions if userId is not found', () => {
    const { store } = signInUserWithUserId(123);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const userId = 456;
    const root = renderUserProfileEdit({ params: { userId }, store });

    sinon.assert.callCount(dispatchSpy, 2);
    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserAccount({
        errorHandlerId: root.instance().props.errorHandler.id,
        userId,
      }),
    );
    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserNotifications({
        errorHandlerId: root.instance().props.errorHandler.id,
        userId,
      }),
    );
  });

  it('dispatches fetchUserNotifications and not fetchUserAccount when the current logged-in user is being edited', () => {
    // We do not have access to the user notifications for the current
    // logged-in user because this user is loaded in Redux when authenticated,
    // and we do not automatically load the notifications.

    const userId = 1234;

    const { store } = signInUserWithUserId(userId);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    // This happens when loading the user edit profile page of the current
    // logged-in user (e.g., page refresh).
    renderUserProfileEdit({ errorHandler, params: {}, store });

    sinon.assert.calledOnce(dispatchSpy);
    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserNotifications({
        errorHandlerId: errorHandler.id,
        userId,
      }),
    );
  });

  it('does not dispatch any actions if the current logged-in user is being edited and the notifications are loaded', () => {
    const userId = 2;

    const { store } = signInUserWithUserId(userId);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    store.dispatch(
      loadUserNotifications({
        userId,
        notifications: createUserNotificationsResponse(),
      }),
    );

    dispatchSpy.resetHistory();

    // This happens when loading the user edit profile page of the current
    // logged-in user (e.g., page refresh).
    renderUserProfileEdit({ params: {}, store });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('dispatches fetchUserAccount and fetchUserNotifications actions if username changes', () => {
    const userId = 45;
    const { params, store } = signInUserWithUserId(userId);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });

    dispatchSpy.resetHistory();

    // We set `user` to `null` because that's what `mapStateToProps()` would do
    // because the user is not loaded yet.
    const newUserId = userId + 9999;
    root.setProps({ userId: newUserId, user: null });

    sinon.assert.callCount(dispatchSpy, 2);
    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserAccount({
        errorHandlerId: errorHandler.id,
        userId: newUserId,
      }),
    );
    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserNotifications({
        errorHandlerId: errorHandler.id,
        userId: newUserId,
      }),
    );

    expect(root.find('.UserProfileEdit-location')).toHaveProp('value', '');
  });

  it('does not fetchUserAccount action if user data are available', () => {
    const userId = 123;
    const { params, store } = signInUserWithUserId(userId);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    // We load user notifications here because the purpose of this test case is
    // not to check that part but to make sure `fetchUserAccount()` is not
    // called.
    store.dispatch(
      loadUserNotifications({
        userId,
        notifications: createUserNotificationsResponse(),
      }),
    );

    const root = renderUserProfileEdit({ errorHandler, params, store });
    const user = getCurrentUser(store.getState().users);

    dispatchSpy.resetHistory();

    // We pass the `user` to simulate the case where the user data are already
    // present in the store.
    root.setProps({ userId: userId + 999, user });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('fetches user notifications when not loaded yet', () => {
    const userId = 34;

    // When loading the current user, their notifications are not loaded yet
    // and we should dispatch `fetchUserNotifications`.
    const { params, store } = signInUserWithUserId(userId);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });
    const user = getCurrentUser(store.getState().users);

    dispatchSpy.resetHistory();

    // We pass the `user` to simulate the case where the user data are already
    // present in the store.
    root.setProps({ userId: userId + 999, user });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchUserNotifications({
        errorHandlerId: errorHandler.id,
        userId,
      }),
    );
  });

  it('does not dispatch fetchUserAccount if username does not change', () => {
    const { params, store } = signInUserWithUserId(123);
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = renderUserProfileEdit({ params, store });

    dispatchSpy.resetHistory();

    root.setProps({ params });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders a username input field', () => {
    const username = 'some username';

    const root = renderUserProfileEdit({
      userProps: defaultUserProps({ username }),
    });

    expect(root.find('.UserProfileEdit-username')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-username')).toHaveProp(
      'value',
      username,
    );
  });

  it('renders disabled input fields when user to edit is not loaded', () => {
    const { store } = signInUserWithUserId(123);
    const userId = 456;

    const root = renderUserProfileEdit({ store, params: { userId } });

    expect(root.find('.UserProfileEdit-username')).toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-displayName')).toHaveProp(
      'disabled',
      true,
    );
    expect(root.find('.UserProfileEdit-homepage')).toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-location')).toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-occupation')).toHaveProp(
      'disabled',
      true,
    );
    expect(root.find('.UserProfileEdit-biography')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('always renders a disabled "email" input field', () => {
    const root = renderUserProfileEdit();

    expect(root.find('.UserProfileEdit-email')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-email')).toHaveProp('disabled', true);
    expect(root.find('.UserProfileEdit-email')).toHaveProp(
      'title',
      'Email address cannot be changed here',
    );
  });

  it('renders help sections for some fields', () => {
    const root = renderUserProfileEdit();

    // Enzyme does not extract "text" from `dangerouslySetInnerHTML` prop,
    // which is needed to escape the link in this help section.That is why we
    // need the `toHaveHTML()` matcher below.
    expect(root.find('.UserProfileEdit-email--help')).toHaveHTML(
      oneLine`<p class="UserProfileEdit-email--help">You can change your email
      address on Firefox Accounts.
      <a href="https://support.mozilla.org/kb/change-primary-email-address-firefox-accounts">Need help?</a></p>`,
    );

    expect(root.find('.UserProfileEdit-homepage--help')).toHaveText(
      `This URL will only be visible for users who are developers.`,
    );

    expect(root.find('.UserProfileEdit-biography--help')).toHaveText(
      oneLine`Some HTML supported: <abbr title> <acronym title> <b>
      <blockquote> <code> <em> <i> <li> <ol> <strong> <ul>. Links are
      forbidden.`,
    );

    expect(root.find('.UserProfileEdit-notifications--help')).toHaveLength(0);
  });

  it('renders a help text about add-on notifications for users who are developers', () => {
    const root = renderUserProfileEdit({
      userProps: defaultUserProps({ is_addon_developer: true }),
    });

    expect(root.find('.UserProfileEdit-notifications--help')).toHaveText(
      oneLine`Mozilla reserves the right to contact you individually about
      specific concerns with your hosted add-ons.`,
    );
  });

  it('renders a help text about add-on notifications for users who are artists', () => {
    const root = renderUserProfileEdit({
      userProps: defaultUserProps({ is_artist: true }),
    });

    expect(root.find('.UserProfileEdit-notifications--help')).toHaveText(
      oneLine`Mozilla reserves the right to contact you individually about
      specific concerns with your hosted add-ons.`,
    );
  });

  it('renders a displayName input field', () => {
    const displayName = 'the display name';
    const root = renderUserProfileEdit({
      userProps: defaultUserProps({
        display_name: displayName,
      }),
    });

    expect(root.find('.UserProfileEdit-displayName')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-displayName')).toHaveProp(
      'value',
      displayName,
    );
  });

  it('renders a homepage input field', () => {
    const homepage = 'https://example.org';
    const root = renderUserProfileEdit({
      userProps: defaultUserProps({
        homepage,
      }),
    });

    expect(root.find('.UserProfileEdit-homepage')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-homepage')).toHaveProp(
      'value',
      homepage,
    );
  });

  it('renders a location input field', () => {
    const location = 'Freiburg, Germany';
    const root = renderUserProfileEdit({
      userProps: defaultUserProps({
        location,
      }),
    });

    expect(root.find('.UserProfileEdit-location')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-location')).toHaveProp(
      'value',
      location,
    );
  });

  it('renders a occupation input field', () => {
    const occupation = 'Bilboquet.';
    const root = renderUserProfileEdit({
      userProps: defaultUserProps({
        occupation,
      }),
    });

    expect(root.find('.UserProfileEdit-occupation')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-occupation')).toHaveProp(
      'value',
      occupation,
    );
  });

  it('renders a biography input field', () => {
    const biography = 'This is a biography.';
    const root = renderUserProfileEdit({
      userProps: defaultUserProps({
        biography,
      }),
    });

    expect(root.find('.UserProfileEdit-biography')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-biography')).toHaveProp(
      'value',
      biography,
    );
  });

  // See: https://github.com/mozilla/addons-frontend/issues/5212
  it('sets the biography value to empty string if user has no biography', () => {
    const biography = null;
    const root = renderUserProfileEdit({
      userProps: defaultUserProps({
        biography,
      }),
    });

    expect(root.find('.UserProfileEdit-biography')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-biography')).toHaveProp('value', '');
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
        }),
      );
      expect(root.find(`.UserProfileEdit-${field}`)).toHaveProp(
        'value',
        newValue,
      );
    });
  });

  it('dispatches updateUserAccount action with all fields on submit', () => {
    const { params, store } = signInUserWithUserId(123);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });
    const user = getCurrentUser(store.getState().users);

    root.find('.UserProfileEdit-form').simulate('submit', createFakeEvent());

    sinon.assert.calledWith(
      dispatchSpy,
      updateUserAccount({
        errorHandlerId: errorHandler.id,
        notifications: {},
        picture: null,
        pictureData: null,
        userFields: {
          biography: user.biography,
          display_name: user.display_name,
          homepage: user.homepage,
          location: user.location,
          occupation: user.occupation,
          username: user.username,
        },
        userId: user.id,
      }),
    );
  });

  it('renders a submit button', () => {
    const root = renderUserProfileEdit();
    const button = root.find('.UserProfileEdit-submit-button');

    expect(button).toHaveLength(1);
    expect(button.dive()).toHaveText('Update My Profile');
    expect(button).toHaveProp('disabled', false);
  });

  it('renders a delete profile button', () => {
    const root = renderUserProfileEdit();
    const button = root.find('.UserProfileEdit-delete-button');

    expect(button).toHaveLength(1);
    expect(button.dive()).toHaveText('Delete My Profile');
    expect(button).toHaveProp('disabled', false);
  });

  it('renders a submit button with a different text when user is not the logged-in user', () => {
    const { store } = signInUserWithUserId(123);
    const params = { userId: 456 };

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-submit-button').dive()).toHaveText(
      'Update Profile',
    );
  });

  it('renders a delete button with a different text when user is not the logged-in user', () => {
    const { store } = signInUserWithUserId(123);
    const params = { userId: 456 };

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-delete-button').dive()).toHaveText(
      'Delete Profile',
    );
  });

  it('renders a submit button with a different text when editing', () => {
    const { params, store } = signInUserWithUserId(123);

    _updateUserAccount({ store });

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-submit-button').dive()).toHaveText(
      'Updating your profile…',
    );
  });

  it('renders a submit button with a different text when user is not the logged-in user and editing', () => {
    const { store } = signInUserWithUserId(123);
    const params = { userId: 456 };

    _updateUserAccount({ store });

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-submit-button').dive()).toHaveText(
      `Updating profile…`,
    );
  });

  it('disables the submit button when username is empty', () => {
    const root = renderUserProfileEdit();

    root.find(`.UserProfileEdit-username`).simulate(
      'change',
      createFakeEventChange({
        name: 'username',
        value: '',
      }),
    );

    expect(root.find('.UserProfileEdit-submit-button')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('dispatches updateUserAccount action with new field values on submit', () => {
    const { params, store } = signInUserWithUserId(123);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });
    const user = getCurrentUser(store.getState().users);

    // We want to make sure dispatched action uses the values updated by the
    // user.
    const location = 'new location';
    root.find(`.UserProfileEdit-location`).simulate(
      'change',
      createFakeEventChange({
        name: 'location',
        value: location,
      }),
    );
    root.find('.UserProfileEdit-form').simulate('submit', createFakeEvent());

    sinon.assert.calledWith(
      dispatchSpy,
      updateUserAccount({
        errorHandlerId: errorHandler.id,
        notifications: {},
        picture: null,
        pictureData: null,
        userFields: {
          biography: user.biography,
          display_name: user.display_name,
          homepage: user.homepage,
          location,
          occupation: user.occupation,
          username: user.username,
        },
        userId: user.id,
      }),
    );
  });

  it('dispatches updateUserAccount action with updated notifications on submit', () => {
    const { params, store } = signInUserWithUserId(123);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });
    const user = getCurrentUser(store.getState().users);

    // The user clicks the `reply` notification to uncheck it.
    const onChange = root.find(UserProfileEditNotifications).prop('onChange');
    const stopPropagationSpy = sinon.spy();

    onChange(
      createFakeEvent({
        currentTarget: {
          name: 'reply',
          checked: false,
        },
        stopPropagation: stopPropagationSpy,
      }),
    );

    // The user clicks the "update" button.
    root.find('.UserProfileEdit-form').simulate('submit', createFakeEvent());

    sinon.assert.calledWith(
      dispatchSpy,
      updateUserAccount({
        errorHandlerId: errorHandler.id,
        notifications: {
          reply: false,
        },
        picture: null,
        pictureData: null,
        userFields: {
          biography: user.biography,
          display_name: user.display_name,
          homepage: user.homepage,
          location: user.location,
          occupation: user.occupation,
          username: user.username,
        },
        userId: user.id,
      }),
    );
  });

  it('redirects to user profile page when user profile has been updated', () => {
    const userId = 123;
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'en-US';
    const { store } = dispatchSignInActions({ clientApp, lang, userId });
    const user = getCurrentUser(store.getState().users);
    const history = createFakeHistory();
    const params = { userId };

    const occupation = 'new occupation';

    _updateUserAccount({
      store,
      userFields: {
        occupation,
      },
      userId: user.id,
    });

    const root = renderUserProfileEdit({ history, params, store });

    expect(root.find(Notice)).toHaveLength(0);
    expect(root.find('.UserProfileEdit-submit-button')).toHaveProp(
      'disabled',
      true,
    );

    // The user profile has been updated.
    store.dispatch(finishUpdateUserAccount());

    const { isUpdating } = store.getState().users;
    root.setProps({ isUpdating });

    expect(root.find('.UserProfileEdit-submit-button')).toHaveProp(
      'disabled',
      false,
    );

    sinon.assert.calledWith(
      history.push,
      `/${lang}/${clientApp}/user/${userId}/`,
    );
  });

  it('does not render a success message when an error occured', () => {
    const { params, store } = signInUserWithUserId(123);
    const user = getCurrentUser(store.getState().users);

    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });

    const username = '';

    _updateUserAccount({
      errorHandlerId: errorHandler.id,
      store,
      userFields: {
        username,
      },
      userId: user.id,
    });

    const root = renderUserProfileEdit({ errorHandler, params, store });

    expect(root.find(Notice)).toHaveLength(0);
    expect(root.find('.UserProfileEdit-submit-button')).toHaveProp(
      'disabled',
      true,
    );

    // An error occured while updating the user profile.
    errorHandler.handle(new Error('unexpected error'));
    store.dispatch(finishUpdateUserAccount());

    const { isUpdating } = store.getState().users;
    root.setProps({ isUpdating });

    expect(root.find(Notice)).toHaveLength(0);

    expect(root.find('.UserProfileEdit-submit-button')).toHaveProp(
      'disabled',
      false,
    );
  });

  it('renders a Not Found page when logged-in user cannot edit another user', () => {
    const userId = 123;
    const { store } = signInUserWithProps({ userId, permissions: [] });

    // Create a user with another ID.
    const user = createUserAccountResponse({ id: userId + 999 });
    store.dispatch(loadUserAccount({ user }));

    // Try to edit this user with another username.
    const params = { userId: user.id };
    const root = renderUserProfileEdit({ params, store });

    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('allows to edit another user if logged-in user has USERS_EDIT permission', () => {
    const userId = 123;
    const { store } = signInUserWithProps({
      userId,
      permissions: [USERS_EDIT],
    });

    // Create a user with another ID.
    const user = createUserAccountResponse({ id: userId + 999 });
    store.dispatch(loadUserAccount({ user }));

    // Try to edit this user with another ID.
    const params = { userId: user.id };
    const root = renderUserProfileEdit({ params, store });

    expect(root.find(NotFound)).toHaveLength(0);
    expect(root.find('.UserProfileEdit-username')).toHaveProp(
      'value',
      user.username,
    );

    const linkItems = root.find('.UserProfileEdit-user-links li');
    expect(linkItems.at(0).find(Link)).toHaveProp(
      'children',
      "View user's profile",
    );
    expect(linkItems.at(1).children()).toHaveText("Edit user's profile");

    expect(root.find('.UserProfileEdit--Card').first()).toHaveProp(
      'header',
      `Account for ${user.username}`,
    );

    // We do not display these help messages when current logged-in user edits
    // another user.
    expect(root.find('.UserProfileEdit-email--help')).toHaveLength(0);
    expect(root.find('.UserProfileEdit-notifications--help')).toHaveLength(0);

    expect(root.find('.UserProfileEdit-profile-aside')).toHaveText(oneLine`Tell
      users a bit more information about this user. These fields are optional,
      but they'll help other users get to know ${user.username} better.`);

    // We do not render this link when user is not the current logged-in user.
    expect(root.find('.UserProfileEdit-manage-account-link')).toHaveLength(0);

    expect(root.find({ htmlFor: 'biography' })).toHaveText(
      `Introduce ${user.username} to the community`,
    );

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

    const _window = {
      scroll: sinon.spy(),
    };
    const root = renderUserProfileEdit({ errorHandler, store, _window });

    expect(root.find(ErrorList)).toHaveLength(1);

    // We do not call `scroll()` here because we mount the component and
    // `componentDidUpdate()` is not called. It is valid because we only mount
    // the component when the server processes the request OR the user
    // navigates to the edit profile page and, in both cases, the scroll will
    // be at the top of the page.
    sinon.assert.notCalled(_window.scroll);
  });

  it('displays an AuthenticateButton if current user is not logged-in', () => {
    const { store } = dispatchClientMetadata();

    const root = renderUserProfileEdit({
      store,
      params: {},
    });

    expect(root.find(AuthenticateButton)).toHaveLength(1);
    expect(root.find(AuthenticateButton)).toHaveProp(
      'logInText',
      'Log in to edit the profile',
    );
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

    dispatchSpy.resetHistory();

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
    const userId = 123;
    const { store } = signInUserWithProps({
      userId,
      permissions: [USERS_EDIT],
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');

    // Create a user with another ID.
    const user = createUserAccountResponse({ id: userId + 999 });
    store.dispatch(loadUserAccount({ user }));

    // The current logged-in user edits the profile of the other `user`.
    const params = { userId: user.id };
    const root = renderUserProfileEdit({ params, store });

    dispatchSpy.resetHistory();

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
    errorHandler.handle(
      createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
    );

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

    fakeDispatch.resetHistory();

    renderUserProfileEdit({ errorHandler, store });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches a deleteUserPicture action when user deletes their profile picture', () => {
    const { params, store } = signInUserWithUserId(123);
    const user = getCurrentUser(store.getState().users);

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });

    dispatchSpy.resetHistory();

    const onDelete = root.find(UserProfileEditPicture).prop('onDelete');

    sinon.assert.notCalled(dispatchSpy);

    onDelete(createFakeEvent());

    sinon.assert.calledWith(
      dispatchSpy,
      deleteUserPicture({
        errorHandlerId: errorHandler.id,
        userId: user.id,
      }),
    );
  });

  it('stores the picture file selected by the user', () => {
    const selectedFile = new File([], 'image.png');

    const { params, store } = signInUserWithUserId(123);
    const root = renderUserProfileEdit({ params, store });

    expect(root).toHaveState('picture', null);

    const onSelect = root.find(UserProfileEditPicture).prop('onSelect');
    const loadPictureSpy = sinon.spy(root.instance(), 'loadPicture');

    sinon.assert.notCalled(loadPictureSpy);

    onSelect(
      createFakeEvent({
        currentTarget: {
          files: [selectedFile],
        },
      }),
    );

    expect(root).toHaveState('picture', selectedFile);
    expect(root).toHaveState('successMessage', null);

    sinon.assert.calledWith(loadPictureSpy, selectedFile);
  });

  it('loads a picture file', () => {
    const { params, store } = signInUserWithUserId(123);
    const root = renderUserProfileEdit({ params, store });

    const result = 'some-data-uri-content';

    root.instance().onPictureLoaded(
      createFakeEvent({
        target: {
          result,
        },
      }),
    );

    expect(root).toHaveState('pictureData', result);
  });

  it('displays a message when user has deleted their profile picture', () => {
    const { params, store } = signInUserWithProps({
      picture_url: 'https://example.org/pp.png',
    });
    const _window = {
      scroll: sinon.spy(),
    };

    const root = renderUserProfileEdit({ params, store, _window });
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
    expect(root.find(Notice)).toHaveProp(
      'children',
      'Picture successfully deleted',
    );

    expect(root).toHaveState('picture', null);
    expect(root).toHaveState('pictureData', null);
    sinon.assert.calledWith(_window.scroll, 0, 0);
  });

  it('displays a modal when user clicks the delete profile button', () => {
    const userId = 123;
    const { params, store } = signInUserWithUserId(userId);
    const preventDefaultSpy = sinon.spy();

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(0);

    root
      .find('.UserProfileEdit-delete-button')
      .simulate(
        'click',
        createFakeEvent({ preventDefault: preventDefaultSpy }),
      );

    sinon.assert.called(preventDefaultSpy);

    const modal = root.find('.UserProfileEdit-deletion-modal');

    expect(modal).toHaveLength(1);
    expect(modal).toHaveProp(
      'header',
      'IMPORTANT: Deleting your Firefox Add-ons profile is irreversible.',
    );
    expect(modal).toHaveProp('visibleOnLoad', true);

    expect(modal.find('p').at(0)).toHaveText(
      oneLine`Your data will be permanently removed, including profile details
      (picture, user name, display name, location, home page, biography,
      occupation) and notification preferences. Your reviews and ratings will
      be anonymised and no longer editable.`,
    );

    expect(
      modal
        .find('p')
        .at(1)
        .text(),
    ).toContain('When you use this email address to log in again to');

    expect(modal.find('p').at(2)).toHaveHTML(
      oneLine`<p><strong>NOTE:</strong> You cannot delete your profile if you
      are the <a href="/user/${userId}/">author of any add-ons</a>. You must
      <a href="https://developer.mozilla.org/Add-ons/Distribution#More_information_about_AMO">transfer ownership</a>
      or delete the add-ons before you can delete your profile.</p>`,
    );

    expect(root.find('.UserProfileEdit-confirm-button')).toHaveLength(1);
    expect(root.find('.UserProfileEdit-confirm-button').children()).toHaveText(
      'Delete My Profile',
    );
    expect(root.find('.UserProfileEdit-confirm-button')).toHaveProp(
      'disabled',
      false,
    );
    expect(root.find('.UserProfileEdit-cancel-button')).toHaveLength(1);
  });

  it('disables the confirm button if user has listed add-ons', () => {
    const { params, store } = signInUserWithProps({
      num_addons_listed: 1,
    });

    const root = renderUserProfileEdit({ params, store });

    // Open the modal.
    root
      .find('.UserProfileEdit-delete-button')
      .simulate('click', createFakeEvent());

    expect(root.find('.UserProfileEdit-confirm-button')).toHaveProp(
      'disabled',
      true,
    );
  });

  it('renders different information in the modal when user to be deleted is not the current logged-in user', () => {
    const { store } = signInUserWithUserId(13);
    const params = { userId: 9999 };

    const root = renderUserProfileEdit({ params, store });

    root
      .find('.UserProfileEdit-delete-button')
      .simulate('click', createFakeEvent());

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveProp(
      'header',
      'IMPORTANT: Deleting this Firefox Add-ons profile is irreversible.',
    );

    expect(
      root
        .find('.UserProfileEdit-deletion-modal')
        .find('p')
        .at(1),
    ).toHaveHTML(oneLine`<p><strong>NOTE:</strong> You cannot delete a user’s
    profile if the user is the <a href="/user/${params.userId}/">author of any
    add-ons</a>.</p>`);

    expect(root.find('.UserProfileEdit-confirm-button').children()).toHaveText(
      'Delete Profile',
    );
  });

  it('closes the modal when user clicks the cancel button', () => {
    const preventDefaultSpy = sinon.spy();

    const { params, store } = signInUserWithUserId(123);
    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(0);

    root
      .find('.UserProfileEdit-delete-button')
      .simulate('click', createFakeEvent());

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(1);

    sinon.assert.notCalled(preventDefaultSpy);

    root
      .find('.UserProfileEdit-cancel-button')
      .simulate(
        'click',
        createFakeEvent({ preventDefault: preventDefaultSpy }),
      );

    expect(root.find('.UserProfileEdit-deletion-modal')).toHaveLength(0);

    sinon.assert.calledOnce(preventDefaultSpy);
  });

  it('dispatches deleteUserAccount and logOutUser when current logged-in user confirms account deletion', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'fr-FR';

    const userId = 456;
    const params = { userId };

    const { store } = dispatchSignInActions({
      clientApp,
      lang,
      userProps: defaultUserProps({ id: userId }),
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const preventDefaultSpy = sinon.spy();
    const errorHandler = createStubErrorHandler();
    const history = createFakeHistory();

    const root = renderUserProfileEdit({
      errorHandler,
      history,
      params,
      store,
    });

    dispatchSpy.resetHistory();

    // User opens the modal.
    root
      .find('.UserProfileEdit-delete-button')
      .simulate('click', createFakeEvent());

    sinon.assert.notCalled(dispatchSpy);
    sinon.assert.notCalled(preventDefaultSpy);

    // User confirms account deletion.
    root
      .find('.UserProfileEdit-confirm-button')
      .simulate(
        'click',
        createFakeEvent({ preventDefault: preventDefaultSpy }),
      );

    sinon.assert.callCount(dispatchSpy, 2);
    sinon.assert.calledWith(
      dispatchSpy,
      deleteUserAccount({
        errorHandlerId: errorHandler.id,
        userId,
      }),
    );
    sinon.assert.calledWith(dispatchSpy, logOutUser());

    sinon.assert.calledWith(history.push, `/${lang}/${clientApp}`);

    sinon.assert.calledOnce(preventDefaultSpy);
  });

  it('does not dispatch logOutUser when current logged-in user confirms deletion of another user account', () => {
    const { store } = signInUserWithProps({
      userId: 123,
      permissions: [USERS_EDIT],
    });

    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    // Create a user with another ID.
    const user = createUserAccountResponse({ id: 999 });
    store.dispatch(loadUserAccount({ user }));

    const root = renderUserProfileEdit({
      errorHandler,
      params: { userId: user.id },
      store,
    });

    dispatchSpy.resetHistory();

    // User opens the modal.
    root
      .find('.UserProfileEdit-delete-button')
      .simulate('click', createFakeEvent());

    sinon.assert.notCalled(dispatchSpy);

    // User confirms account deletion.
    root
      .find('.UserProfileEdit-confirm-button')
      .simulate('click', createFakeEvent());

    sinon.assert.callCount(dispatchSpy, 1);
    sinon.assert.calledWith(
      dispatchSpy,
      deleteUserAccount({
        errorHandlerId: errorHandler.id,
        userId: user.id,
      }),
    );
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const userId = 2;
      const params = { userId };
      const match = { params };

      expect(extractId({ match })).toEqual(userId);
    });
  });

  it('stores updated notifications in state', () => {
    const { store } = signInUserWithUserId(123);
    const root = renderUserProfileEdit({ store });

    expect(root).toHaveState('notifications', {});

    const onChange = root.find(UserProfileEditNotifications).prop('onChange');
    const stopPropagationSpy = sinon.spy();

    onChange(
      createFakeEvent({
        currentTarget: {
          name: 'reply',
          checked: false,
        },
        stopPropagation: stopPropagationSpy,
      }),
    );

    sinon.assert.called(stopPropagationSpy);

    expect(root).toHaveState('notifications', { reply: false });
    expect(root).toHaveState('successMessage', null);

    onChange(
      createFakeEvent({
        currentTarget: {
          name: 'new_features',
          checked: false,
        },
      }),
    );

    expect(root).toHaveState('notifications', {
      new_features: false,
      reply: false,
    });

    onChange(
      createFakeEvent({
        currentTarget: {
          name: 'reply',
          checked: true,
        },
      }),
    );

    expect(root).toHaveState('notifications', {
      new_features: false,
      reply: true,
    });
  });

  it('scrolls to the top of the page when an error is rendered', () => {
    const _window = {
      scroll: sinon.spy(),
    };
    const root = renderUserProfileEdit({ _window });

    sinon.assert.notCalled(_window.scroll);

    root.setProps({
      errorHandler: createStubErrorHandler(new Error('some error')),
    });

    sinon.assert.calledWith(_window.scroll, 0, 0);
  });

  it('does not scroll if we already scrolled because of an error', () => {
    const _window = {
      scroll: sinon.spy(),
    };
    const root = renderUserProfileEdit({ _window });

    root.setProps({
      errorHandler: createStubErrorHandler(new Error('some error')),
    });

    sinon.assert.calledWith(_window.scroll, 0, 0);
    _window.scroll.resetHistory();

    // This update will trigger a re-render.
    root.find(`.UserProfileEdit-biography`).simulate(
      'change',
      createFakeEventChange({
        name: 'biography',
        value: 'a new bio',
      }),
    );

    sinon.assert.notCalled(_window.scroll);
  });

  it('does not scroll if we already scrolled because of a success message', () => {
    const { params, store } = signInUserWithProps({
      picture_url: 'https://example.org/pp.png',
    });

    const _window = {
      scroll: sinon.spy(),
    };

    const root = renderUserProfileEdit({ params, store, _window });
    const user = getCurrentUser(store.getState().users);

    sinon.assert.notCalled(_window.scroll);

    // The user profile picture has been successfully deleted.
    root.setProps({
      user: {
        ...user,
        picture_url: null,
      },
    });

    sinon.assert.calledWith(_window.scroll, 0, 0);
    _window.scroll.resetHistory();

    // This update will trigger a re-render.
    root.find(`.UserProfileEdit-biography`).simulate(
      'change',
      createFakeEventChange({
        name: 'biography',
        value: 'a new bio',
      }),
    );

    sinon.assert.notCalled(_window.scroll);
  });

  it('does not show any message when navigating to a new user profile', () => {
    const { params, store } = signInUserWithProps({
      userId: 123,
      picture_url: 'https://example.org/some-picture.png',
    });

    // Create a user with another ID.
    const userId = 456;
    const user = createUserAccountResponse({
      userId,
      picture_url: null,
    });
    store.dispatch(loadUserAccount({ user }));

    const root = renderUserProfileEdit({ params, store });

    root.setProps({ user, userId });

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('clears the error handler when unmounting', () => {
    const { params, store } = signInUserWithUserId(123);
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = renderUserProfileEdit({ errorHandler, params, store });

    dispatchSpy.resetHistory();

    root.unmount();

    sinon.assert.calledWith(dispatchSpy, errorHandler.createClearingAction());
  });

  it('renders a FxA management link to the current logged-in user', () => {
    const link = 'http://example.org/settings?uid=fxa-id-123';
    const { params, store } = signInUserWithProps({
      fxa_edit_email_url: link,
    });

    const root = renderUserProfileEdit({ params, store });

    expect(root.find('.UserProfileEdit-manage-account-link')).toHaveProp(
      'href',
      link,
    );
  });
});
