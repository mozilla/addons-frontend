/* global window */
import { createMemoryHistory } from 'history';
import userEvent from '@testing-library/user-event';
import { createEvent, fireEvent, waitFor } from '@testing-library/react';

import { clearError } from 'amo/actions/errors';
import { setViewContext } from 'amo/actions/viewContext';
import { createApiError } from 'amo/api/index';
import { extractId } from 'amo/pages/UserProfileEdit';
import {
  CLIENT_APP_FIREFOX,
  USERS_EDIT,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import {
  FETCH_USER_ACCOUNT,
  FETCH_USER_NOTIFICATIONS,
  LOG_OUT_USER,
  deleteUserAccount,
  deleteUserPicture,
  fetchUserAccount,
  fetchUserNotifications,
  finishUpdateUserAccount,
  getCurrentUser,
  getUserById,
  loadUserAccount,
  loadUserNotifications,
  logOutUser,
  updateUserAccount,
} from 'amo/reducers/users';
import { getNotificationDescription } from 'amo/utils/notifications';
import {
  createFailedErrorHandler,
  createFakeLocation,
  createHistory,
  createUserAccountResponse,
  createUserNotificationsResponse,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAuthors,
  fakeI18n,
  getElement,
  onLocationChanged,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultDisplayName = 'Display McDisplayNamey';
  const defaultOtherUserEmail = 'otheruser@mozilla.com';
  const lang = 'en-US';
  const defaultUserId = fakeAuthors[0].id;
  let store;

  const savedLocation = window.location;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
    delete window.location;
    window.location = Object.assign(new URL('https://example.org'), {
      assign: jest.fn(),
    });
    window.scroll = jest.fn();
  });

  afterEach(() => {
    window.location = savedLocation;
  });

  function defaultUserProps(props = {}) {
    return {
      display_name: defaultDisplayName,
      email: 'currentuser@mozilla.com',
      username: 'mcdisplayname',
      ...props,
    };
  }

  function signInUserWithProps({ userId = defaultUserId, ...props } = {}) {
    dispatchSignInActionsWithStore({
      userId,
      userProps: defaultUserProps(props),
      store,
    });
    return userId;
  }

  const getLocation = (userId) => {
    if (userId) {
      return `/${lang}/${clientApp}/user/${userId}/edit/`;
    }
    return `/${lang}/${clientApp}/users/edit`;
  };

  const getErrorHandlerId = (userId) =>
    `src/amo/pages/UserProfileEdit/index.js-${userId}`;

  const render = ({ history, location, userId } = {}) => {
    const renderOptions = {
      history:
        history ||
        createHistory({
          initialEntries: [location || getLocation(userId)],
        }),
      store,
    };

    return defaultRender(renderOptions);
  };

  const renderForCurrentUser = (userProps = {}) => {
    const userId = signInUserWithProps(userProps);
    render({ userId });
    return userId;
  };

  const renderForOtherUser = ({
    canEdit = true,
    loggedIn = true,
    userLoaded = true,
  } = {}) => {
    const userId = loggedIn
      ? signInUserWithProps({
          permissions: canEdit ? [USERS_EDIT] : [],
        })
      : defaultUserId;
    const newUserId = userId + 1;

    if (userLoaded) {
      const user = createUserAccountResponse({
        display_name: 'Display name',
        email: defaultOtherUserEmail,
        id: newUserId,
      });
      store.dispatch(loadUserAccount({ user }));
    }

    render({ userId: newUserId });
    return newUserId;
  };

  it('renders user profile page for current logged-in user', () => {
    renderForCurrentUser();

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Tell users a bit more information about yourself. Most fields are ` +
          `optional, but they'll help other users get to know you better.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Introduce yourself to the community if you like'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Manage Firefox Accounts…' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `From time to time, Mozilla may send you email about upcoming ` +
          `releases and add-on events. Please select the topics you are ` +
          `interested in.`,
      ),
    ).toBeInTheDocument();

    expect(screen.queryByClassName('Notice-success')).not.toBeInTheDocument();
    expect(screen.queryByClassName('Overlay')).not.toBeInTheDocument();
  });

  it('dispatches fetchUserAccount and fetchUserNotifications actions if userId is not found', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = defaultUserId;
    render({ userId });

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: getErrorHandlerId(userId),
        userId: defaultUserId,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      fetchUserNotifications({
        errorHandlerId: getErrorHandlerId(userId),
        userId: defaultUserId,
      }),
    );
  });

  it('dispatches fetchUserNotifications and not fetchUserAccount when the current logged-in user is being edited', () => {
    // We do not have access to the user notifications for the current
    // logged-in user because this user is loaded in Redux when authenticated,
    // and we do not automatically load the notifications.

    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = renderForCurrentUser();

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserNotifications({
        errorHandlerId: getErrorHandlerId(userId),
        userId,
      }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_ACCOUNT }),
    );
  });

  it('does not dispatch user actions if the current logged-in user is being edited and the notifications are loaded', () => {
    const userId = signInUserWithProps();
    store.dispatch(
      loadUserNotifications({
        userId,
        notifications: createUserNotificationsResponse(),
      }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_NOTIFICATIONS }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_ACCOUNT }),
    );
  });

  it('dispatches fetchUserAccount and fetchUserNotifications actions if userId changes', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = renderForCurrentUser();
    const newUserId = userId + 1;

    store.dispatch(
      onLocationChanged({
        pathname: getLocation(newUserId),
      }),
    );

    expect(dispatch).toHaveBeenCalledWith(
      fetchUserAccount({
        errorHandlerId: getErrorHandlerId(newUserId),
        userId: newUserId,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      fetchUserNotifications({
        errorHandlerId: getErrorHandlerId(newUserId),
        userId: newUserId,
      }),
    );
  });

  it('does not fetchUserAccount action if user data are available', () => {
    const userId = signInUserWithProps();
    // We load user notifications here because the purpose of this test case is
    // not to check that part but to make sure `fetchUserAccount()` is not
    // called.
    store.dispatch(
      loadUserNotifications({
        userId,
        notifications: createUserNotificationsResponse(),
      }),
    );

    const dispatch = jest.spyOn(store, 'dispatch');
    render({ userId });

    store.dispatch(
      onLocationChanged({
        pathname: getLocation(userId),
      }),
    );

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_NOTIFICATIONS }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_ACCOUNT }),
    );
  });

  it('renders disabled input fields when user to edit is not loaded', () => {
    renderForOtherUser({ userLoaded: false });

    expect(screen.getByLabelText('Email Address')).toBeDisabled();
    expect(screen.getByLabelText('Display Name *')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Homepage' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Location' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Occupation' })).toBeDisabled();
    expect(screen.getByClassName('UserProfileEdit-biography')).toBeDisabled();
  });

  it('always renders a disabled "email" input field', () => {
    renderForCurrentUser();

    const emailTextBox = screen.getByLabelText('Email Address');
    expect(emailTextBox).toBeDisabled();
    expect(emailTextBox).toHaveAttribute(
      'title',
      'Email address cannot be changed here',
    );
  });

  it('renders help sections for some fields', () => {
    renderForCurrentUser();

    expect(
      screen.getByTextAcrossTags(
        'You can change your email address on Firefox Accounts. Need help?',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Need help?' })).toHaveAttribute(
      'href',
      'https://support.mozilla.org/kb/change-primary-email-address-firefox-accounts',
    );

    expect(
      screen.getByText(
        'This URL will only be visible for users who are developers.',
      ),
    ).toHaveClass('UserProfileEdit-homepage--help');

    expect(
      screen.getByClassName('UserProfileEdit-biography--help'),
    ).toHaveTextContent(
      `Some HTML supported: <abbr title> <acronym title> <b> <blockquote> ` +
        `<code> <em> <i> <li> <ol> <strong> <ul>. Links are forbidden.`,
    );

    expect(
      screen.queryByText(
        `Mozilla reserves the right to contact you individually about ` +
          `specific concerns with your hosted add-ons.`,
      ),
    ).not.toBeInTheDocument();
  });

  it('renders a help text about add-on notifications for users who are developers', () => {
    renderForCurrentUser({ is_addon_developer: true });

    expect(
      screen.getByText(
        `Mozilla reserves the right to contact you individually about ` +
          `specific concerns with your hosted add-ons.`,
      ),
    ).toBeInTheDocument();
  });

  it('renders a help text about add-on notifications for users who are artists', () => {
    renderForCurrentUser({ is_artist: true });

    expect(
      screen.getByText(
        `Mozilla reserves the right to contact you individually about ` +
          `specific concerns with your hosted add-ons.`,
      ),
    ).toBeInTheDocument();
  });

  const userProps = {
    biography: 'This is a biography.',
    display_name: 'the display name',
    homepage: 'https://example.org',
    location: 'Freiburg, Germany',
    occupation: 'Bilboquet.',
  };
  it.each([
    ['biography', () => screen.getByClassName('UserProfileEdit-biography')],
    ['display_name', () => screen.getByLabelText('Display Name *')],
    ['homepage', () => screen.getByRole('textbox', { name: 'Homepage' })],
    ['location', () => screen.getByRole('textbox', { name: 'Location' })],
    ['occupation', () => screen.getByRole('textbox', { name: 'Occupation' })],
  ])('renders expected input field: %s', (field, locator) => {
    renderForCurrentUser(userProps);

    const input = locator();
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue(userProps[field]);
  });

  // See: https://github.com/mozilla/addons-frontend/issues/5212
  it('sets the biography value to empty string if user has no biography', () => {
    renderForCurrentUser({ biography: null });

    expect(screen.getByClassName('UserProfileEdit-biography')).toHaveValue('');
  });

  it.each([
    ['biography', () => screen.getByClassName('UserProfileEdit-biography')],
    ['display_name', () => screen.getByLabelText('Display Name *')],
    ['homepage', () => screen.getByRole('textbox', { name: 'Homepage' })],
    ['location', () => screen.getByRole('textbox', { name: 'Location' })],
    ['occupation', () => screen.getByRole('textbox', { name: 'Occupation' })],
  ])('captures input field changes: %s', (field, locator) => {
    renderForCurrentUser();

    const newValue = `new-value-for-${field}`;
    userEvent.type(locator(), `{selectall}{del}${newValue}`);

    expect(locator()).toHaveValue(newValue);
  });

  it('dispatches updateUserAccount action with all fields on submit', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderForCurrentUser();
    const user = getCurrentUser(store.getState().users);

    userEvent.click(screen.getByRole('button', { name: 'Update My Profile' }));

    expect(dispatch).toHaveBeenCalledWith(
      updateUserAccount({
        errorHandlerId: getErrorHandlerId(user.id),
        notifications: {},
        picture: null,
        pictureData: null,
        userFields: {
          biography: user.biography,
          display_name: user.display_name,
          homepage: user.homepage,
          location: user.location,
          occupation: user.occupation,
        },
        userId: user.id,
      }),
    );
  });

  it('renders a create button', () => {
    renderForCurrentUser({ display_name: '' });

    expect(
      screen.getByRole('button', { name: 'Create My Profile' }),
    ).toBeInTheDocument();
  });

  it('renders a delete profile button', () => {
    renderForCurrentUser();

    const button = screen.getByRole('button', { name: 'Delete My Profile' });

    expect(button).not.toBeDisabled();
    expect(button).toHaveClass('Button--alert');
  });

  it('renders an update button with a different text when user is not the logged-in user', () => {
    renderForOtherUser();

    expect(
      screen.getByRole('button', { name: 'Update Profile' }),
    ).toBeInTheDocument();
  });

  it('renders a delete button with a different text when user is not the logged-in user', () => {
    renderForOtherUser();

    expect(
      screen.getByRole('button', { name: 'Delete Profile' }),
    ).toBeInTheDocument();
  });

  it('renders an update button with a different text when updating', () => {
    renderForCurrentUser();

    userEvent.click(screen.getByRole('button', { name: 'Update My Profile' }));

    expect(
      screen.getByRole('button', { name: 'Updating your profile…' }),
    ).toBeInTheDocument();
  });

  it('renders a create button with a different text when updating', () => {
    renderForCurrentUser({ display_name: '' });

    userEvent.type(
      screen.getByLabelText('Display Name *'),
      'Some display name',
    );
    userEvent.click(screen.getByRole('button', { name: 'Create My Profile' }));

    expect(
      screen.getByRole('button', { name: 'Creating your profile…' }),
    ).toBeInTheDocument();
  });

  it('renders an update button with a different text when user is not the logged-in user and updating', () => {
    renderForOtherUser();

    userEvent.type(
      screen.getByLabelText('Display Name *'),
      'Some display name',
    );
    userEvent.click(screen.getByRole('button', { name: 'Update Profile' }));

    expect(
      screen.getByRole('button', { name: 'Updating profile…' }),
    ).toBeInTheDocument();
  });

  it('disables the submit button when displayName is empty', () => {
    renderForCurrentUser({ display_name: 'Some name' });

    userEvent.type(screen.getByLabelText('Display Name *'), '{selectall}{del}');

    expect(
      screen.getByRole('button', { name: 'Update My Profile' }),
    ).toBeDisabled();
  });

  it('dispatches updateUserAccount action with new field values on submit', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = renderForCurrentUser();

    const user = getCurrentUser(store.getState().users);

    // We want to make sure dispatched action uses the values updated by the
    // user.
    const location = 'new location';
    userEvent.type(
      screen.getByRole('textbox', { name: 'Location' }),
      `{selectall}{del}${location}`,
    );
    userEvent.click(screen.getByRole('button', { name: 'Update My Profile' }));

    expect(dispatch).toHaveBeenCalledWith(
      updateUserAccount({
        errorHandlerId: getErrorHandlerId(userId),
        notifications: {},
        picture: null,
        pictureData: null,
        userFields: {
          biography: user.biography,
          display_name: user.display_name,
          homepage: user.homepage,
          location,
          occupation: user.occupation,
        },
        userId,
      }),
    );
  });

  describe('redirect after profile update', () => {
    const testRedirect = ({ expectedURL, history, to }) => {
      const renderProps = { history };
      if (to) {
        renderProps.location = `${getLocation()}?to=${to}`;
      }
      signInUserWithProps();
      render(renderProps);

      userEvent.click(
        screen.getByRole('button', { name: 'Update My Profile' }),
      );

      expect(
        screen.getByRole('button', { name: 'Updating your profile…' }),
      ).toBeDisabled();

      store.dispatch(finishUpdateUserAccount());

      expect(
        screen.getByRole('button', { name: 'Update My Profile' }),
      ).not.toBeDisabled();

      expect(window.location.assign).toHaveBeenCalledWith(expectedURL);
    };

    // eslint-disable-next-line jest/expect-expect
    it('redirects to the user profile page when there is no `to` param', () => {
      const to = null;
      const expectedURL = `/${lang}/${clientApp}/user/${defaultUserId}/`;

      testRedirect({ expectedURL, to });
    });

    // eslint-disable-next-line jest/expect-expect
    it('redirects to the `to` URL param', () => {
      const to = '/addon/some-slug/';
      testRedirect({ expectedURL: to, to });
    });

    // eslint-disable-next-line jest/expect-expect
    it('converts an absolute `to` URL into a relative one', () => {
      const to = 'https://addons.mozilla.org/addon/some-slug/';
      testRedirect({ expectedURL: `/${to}`, to });
    });

    // eslint-disable-next-line jest/expect-expect
    it('redirects to user profile page when the `to` param is a protocol-less URL', () => {
      const to = '//addon/some-slug/';
      const expectedURL = `/${lang}/${clientApp}/user/${defaultUserId}/`;

      testRedirect({ expectedURL, to });
    });

    // eslint-disable-next-line jest/expect-expect
    it('redirects to user profile page when the `to` param is not a string', () => {
      const to = { url: '/addon/some-slug/' };
      const location = createFakeLocation({
        pathname: getLocation(),
        query: { to },
      });
      const history = createMemoryHistory();
      history.push(location);

      const expectedURL = `/${lang}/${clientApp}/user/${defaultUserId}/`;

      testRedirect({ expectedURL, history });
    });

    // eslint-disable-next-line jest/expect-expect
    it('redirects to user profile page if the `to` URL throws an error', () => {
      const to = '/addon/some-slug/';
      const expectedURL = `/${lang}/${clientApp}/user/${defaultUserId}/`;

      window.location.assign.mockImplementationOnce(() => {
        throw new Error();
      });
      window.location.assign.mockImplementationOnce(() => null);

      testRedirect({ expectedURL, to });

      expect(window.location.assign).toHaveBeenCalledWith(to);
      expect(window.location.assign).toHaveBeenCalledWith(expectedURL);
    });
  });

  it('renders a Not Found page when logged-in user cannot edit another user', () => {
    renderForOtherUser({ canEdit: false });

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('allows to edit another user if logged-in user has USERS_EDIT permission', () => {
    const userId = renderForOtherUser();
    const user = getUserById(store.getState().users, userId);

    expect(screen.getByLabelText('Email Address')).toHaveValue(
      defaultOtherUserEmail,
    );
    expect(
      screen.getByRole('link', { name: `View user's profile` }),
    ).toBeInTheDocument();
    expect(screen.getByText(`Edit user's profile`)).toBeInTheDocument();
    expect(screen.getByText(`Account for ${user.name}`)).toBeInTheDocument();

    // We do not display these help messages when current logged-in user edits
    // another user.
    expect(
      screen.queryByRole('link', { name: 'Need help?' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        `Mozilla reserves the right to contact you individually about ` +
          `specific concerns with your hosted add-ons.`,
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText(
        `Tell users a bit more information about this user. Most fields are ` +
          `optional, but they'll help other users get to know ${user.name} ` +
          `better.`,
      ),
    ).toBeInTheDocument();

    // We do not render this link when user is not the current logged-in user.
    expect(
      screen.queryByRole('link', { name: 'Manage Firefox Accounts…' }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText(`Introduce ${user.name} to the community`),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        `From time to time, Mozilla may send this user email about upcoming ` +
          `releases and add-on events. Please select the topics this user may ` +
          `be interested in.`,
      ),
    ).toBeInTheDocument();
  });

  it('renders errors', () => {
    const message = 'Some error message';
    createFailedErrorHandler({
      id: getErrorHandlerId(defaultUserId),
      message,
      store,
    });

    renderForCurrentUser();

    expect(screen.getByText(message)).toBeInTheDocument();

    // We do not call `scroll()` here because we mount the component and
    // `componentDidUpdate()` is not called. It is valid because we only mount
    // the component when the server processes the request OR the user
    // navigates to the edit profile page and, in both cases, the scroll will
    // be at the top of the page.
    expect(window.scroll).not.toHaveBeenCalled();
  });

  it('displays an AuthenticateButton if current user is not logged-in', () => {
    render();

    expect(
      screen.getByRole('link', { name: 'Log in to edit the profile' }),
    ).toBeInTheDocument();
  });

  it('displays an AuthenticateButton if current user is not logged-in and loads a user edit page', () => {
    renderForOtherUser({ loggedIn: false });

    expect(
      screen.getByRole('link', { name: 'Log in to edit the profile' }),
    ).toBeInTheDocument();
  });

  // See: https://github.com/mozilla/addons-frontend/issues/5034
  it('does not dispatch fetchUserAccount() when user logs out', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderForCurrentUser();

    store.dispatch(logOutUser());

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_ACCOUNT }),
    );

    // We should also see an AuthenticateButton when this use case happens.
    expect(
      screen.getByRole('link', { name: 'Log in to edit the profile' }),
    ).toBeInTheDocument();
  });

  it('does not dispatch fetchUserAccount() when user logs out on a user edit page', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderForOtherUser();

    store.dispatch(logOutUser());

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_ACCOUNT }),
    );

    // We should also see an AuthenticateButton when this use case happens.
    expect(
      screen.getByRole('link', { name: 'Log in to edit the profile' }),
    ).toBeInTheDocument();
  });

  it('renders a not found page if the API request is a 404', () => {
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
      }),
      id: getErrorHandlerId(defaultUserId),
      store,
    });

    renderForCurrentUser();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('does not dispatch user actions when there is an error', () => {
    createFailedErrorHandler({
      id: getErrorHandlerId(defaultUserId + 1),
      store,
    });
    const dispatch = jest.spyOn(store, 'dispatch');

    renderForOtherUser({ userLoaded: false });

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_ACCOUNT }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_USER_NOTIFICATIONS }),
    );
  });

  it('displays a message when user has deleted their profile picture', () => {
    const pictureUrl = 'https://example.org/pp.png';
    renderForCurrentUser({ picture_url: pictureUrl });
    const user = getCurrentUser(store.getState().users);

    expect(
      screen.getByAltText(`Profile picture for ${user.display_name}`),
    ).toHaveAttribute('src', pictureUrl);

    // This triggers the page to recognize that the picture was deleted.
    store.dispatch(loadUserAccount({ user: { ...user, picture_url: null } }));

    expect(
      screen.getByText('Picture successfully deleted'),
    ).toBeInTheDocument();
    expect(screen.getByClassName('Notice-success')).toBeInTheDocument();

    expect(
      screen.queryByAltText(`Profile picture for ${user.display_name}`),
    ).not.toBeInTheDocument();

    expect(window.scroll).toHaveBeenCalledWith(0, 0);
  });

  it('displays a modal when user clicks the delete profile button', () => {
    renderForCurrentUser();

    const button = screen.getByRole('button', { name: 'Delete My Profile' });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultWatcher).toHaveBeenCalled();

    expect(
      screen.getByText(
        'IMPORTANT: Deleting your Firefox Add-ons profile is irreversible.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByClassName('Overlay')).toHaveClass('Overlay--visible');

    expect(
      screen.getByText(
        `Your data will be permanently removed, including ` +
          `profile details (picture, user name, display name, location, home ` +
          `page, biography, occupation), notification preferences, reviews, and ` +
          `collections.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `If you authored any add-ons they will also be deleted, unless you ` +
          `share ownership with other authors. In that case, you will be ` +
          `removed as an author and the remaining authors will maintain ` +
          `ownership of the add-on.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `When you use this email address to log in again to ` +
          `addons.mozilla.org, your profile on Firefox Add-ons will not have ` +
          `access to any of its previous content.`,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole('button', { name: 'Delete My Profile' })[1],
    ).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled();
  });

  it('renders different information in the modal when user to be deleted is not the current logged-in user', () => {
    renderForOtherUser();

    userEvent.click(screen.getByRole('button', { name: 'Delete Profile' }));

    expect(
      screen.getByText(
        'IMPORTANT: Deleting this Firefox Add-ons profile is irreversible.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        `If the user authored any add-ons they will also be deleted, unless ` +
          `ownership is shared with other authors. In that case, the user will ` +
          `be removed as an author and the remaining authors will maintain ` +
          `ownership of the add-on.`,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole('button', { name: 'Delete Profile' })[1],
    ).not.toBeDisabled();
  });

  it('closes the modal when user clicks the cancel button', () => {
    renderForCurrentUser();

    userEvent.click(screen.getByRole('button', { name: 'Delete My Profile' }));

    const button = screen.getByRole('button', { name: 'Cancel' });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(
      screen.queryByText(
        'IMPORTANT: Deleting your Firefox Add-ons profile is irreversible.',
      ),
    ).not.toBeInTheDocument();
  });

  it('dispatches deleteUserAccount and logOutUser when current logged-in user confirms account deletion', () => {
    const userId = signInUserWithProps(userProps);
    const history = createHistory({
      initialEntries: [getLocation(userId)],
    });
    const pushSpy = jest.spyOn(history, 'push');
    const dispatch = jest.spyOn(store, 'dispatch');
    render({ history });

    userEvent.click(screen.getByRole('button', { name: 'Delete My Profile' }));
    userEvent.click(
      screen.getAllByRole('button', { name: 'Delete My Profile' })[1],
    );

    expect(dispatch).toHaveBeenCalledWith(
      deleteUserAccount({
        errorHandlerId: getErrorHandlerId(userId),
        userId,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(logOutUser());
    expect(pushSpy).toHaveBeenCalledWith(`/${lang}/${clientApp}`);
  });

  it('does not dispatch logOutUser when current logged-in user confirms deletion of another user account', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = renderForOtherUser();

    userEvent.click(screen.getByRole('button', { name: 'Delete Profile' }));
    userEvent.click(
      screen.getAllByRole('button', { name: 'Delete Profile' })[1],
    );

    expect(dispatch).toHaveBeenCalledWith(
      deleteUserAccount({
        errorHandlerId: getErrorHandlerId(userId),
        userId,
      }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: LOG_OUT_USER }),
    );
  });

  describe('errorHandler - extractId', () => {
    it('returns a unique ID based on params', () => {
      const userId = 2;

      expect(extractId({ match: { params: { userId } } })).toEqual(userId);
    });
  });

  it('scrolls to the top of the page when an error is rendered', () => {
    const userId = renderForCurrentUser();

    createFailedErrorHandler({ id: getErrorHandlerId(userId), store });

    expect(window.scroll).toHaveBeenCalledWith(0, 0);
  });

  it('does not scroll if we already scrolled because of an error', () => {
    const userId = renderForCurrentUser();

    createFailedErrorHandler({ id: getErrorHandlerId(userId), store });

    expect(window.scroll).toHaveBeenCalledWith(0, 0);
    window.scroll.mockClear();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation(userId),
      }),
    );

    expect(window.scroll).not.toHaveBeenCalled();
  });

  it('does not scroll if we already scrolled because of a success message', () => {
    renderForCurrentUser({ picture_url: 'https://example.org/pp.png' });
    const user = getCurrentUser(store.getState().users);

    // This triggers the page to recognize that the picture was deleted,
    // which displays a success message.
    store.dispatch(loadUserAccount({ user: { ...user, picture_url: null } }));

    expect(window.scroll).toHaveBeenCalledWith(0, 0);
    window.scroll.mockClear();

    store.dispatch(
      onLocationChanged({
        pathname: getLocation(user.id),
      }),
    );

    expect(window.scroll).not.toHaveBeenCalled();
  });

  it('does not show any message when navigating to a new user profile', () => {
    const userId = renderForCurrentUser({
      picture_url: 'https://example.org/pp.png',
    });

    // Create a user with another ID.
    const newUserId = userId + 1;
    const user = createUserAccountResponse({
      userId: newUserId,
      picture_url: null,
    });
    store.dispatch(loadUserAccount({ user }));

    store.dispatch(
      onLocationChanged({
        pathname: getLocation(newUserId),
      }),
    );

    expect(screen.queryByClassName('Notice-success')).not.toBeInTheDocument();
  });

  it('clears the error handler when unmounting', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    const userId = defaultUserId;
    createFailedErrorHandler({
      id: getErrorHandlerId(userId),
      store,
    });
    const { unmount } = render({ userId });

    unmount();

    expect(dispatch).toHaveBeenCalledWith(
      clearError(getErrorHandlerId(userId)),
    );
  });

  it('renders a FxA management link to the current logged-in user', () => {
    const link = 'http://example.org/settings?uid=fxa-id-123';
    renderForCurrentUser({ fxa_edit_email_url: link });

    expect(
      screen.getByRole('link', { name: 'Manage Firefox Accounts…' }),
    ).toHaveAttribute('href', link);
  });

  it('renders without a user loaded when current logged-in user is an admin', () => {
    renderForOtherUser({ userLoaded: false });

    expect(screen.getByText('Account')).toBeInTheDocument();

    expect(
      within(
        screen.getByClassName('UserProfileEdit-profile-aside'),
      ).getAllByRole('alert'),
    ).toHaveLength(2);
    expect(
      within(getElement('.UserProfileEdit--label[for="biography"]')).getByRole(
        'alert',
      ),
    ).toBeInTheDocument();
  });

  it('dispatches setViewContext when component mounts', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    renderForCurrentUser();

    expect(dispatch).toHaveBeenCalledWith(setViewContext(VIEW_CONTEXT_HOME));
  });

  it('dispatches updateUserAccount action with updated notifications on submit', () => {
    const userId = signInUserWithProps();
    const userNotifications = createUserNotificationsResponse();
    store.dispatch(
      loadUserNotifications({ userId, notifications: userNotifications }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    const user = getCurrentUser(store.getState().users);

    render();

    // Click the `reply` notification to uncheck it.
    const checkbox = screen.getByRole('checkbox', {
      name: 'an add-on developer replies to my review',
    });
    const clickEvent = createEvent.click(checkbox);
    const stopPropagationWatcher = jest.spyOn(clickEvent, 'stopPropagation');

    fireEvent(checkbox, clickEvent);

    expect(stopPropagationWatcher).toHaveBeenCalled();

    // Click the "update" button.
    userEvent.click(screen.getByRole('button', { name: 'Update My Profile' }));

    expect(dispatch).toHaveBeenCalledWith(
      updateUserAccount({
        errorHandlerId: getErrorHandlerId(),
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
        },
        userId: user.id,
      }),
    );
  });

  describe('Tests for UserProfileEditNotifications', () => {
    it('renders loading notifications without a user', () => {
      // Loading the edit profile page for a user who is not the current user,
      // and is not loaded, will result in UserProfileEditNotifications
      // rendering without a user.
      renderForOtherUser({ userLoaded: false });

      const notifications = screen.getAllByClassName(
        'UserProfileEditNotification',
      );
      expect(notifications).toHaveLength(2);

      notifications.forEach((notification, index) => {
        expect(notification).toHaveClass(
          'UserProfileEditNotification--disabled',
        );
        const checkbox = within(notification).getByRole('checkbox');
        expect(checkbox).toBeDisabled();
        expect(checkbox).toHaveAttribute(
          'name',
          `loading-notification-${index}`,
        );
        expect(within(notification).getByRole('alert')).toBeInTheDocument();
      });
    });

    it(`renders loading notifications when user's notifications are not loaded`, () => {
      renderForCurrentUser();

      const notifications = screen.getAllByClassName(
        'UserProfileEditNotification',
      );
      expect(notifications).toHaveLength(2);

      notifications.forEach((notification) => {
        expect(within(notification).getByRole('checkbox')).toBeInTheDocument();
        expect(within(notification).getByRole('alert')).toBeInTheDocument();
      });
    });

    it(`renders notifications when the user's notifications are loaded`, () => {
      const userId = signInUserWithProps();
      const userNotifications = createUserNotificationsResponse();
      store.dispatch(
        loadUserNotifications({ userId, notifications: userNotifications }),
      );

      render();

      const notifications = screen.getAllByClassName(
        'UserProfileEditNotification',
      );
      expect(notifications).toHaveLength(userNotifications.length);

      const i18n = fakeI18n();
      userNotifications.forEach((notification, index) => {
        const notificationElement = notifications[index];

        expect(
          within(notificationElement).queryByRole('alert'),
        ).not.toBeInTheDocument();

        const checkbox = within(notificationElement).getByRole('checkbox', {
          name: getNotificationDescription(i18n, notification.name),
        });

        /* eslint-disable jest/no-conditional-expect */
        if (notification.mandatory) {
          expect(notificationElement).toHaveClass(
            'UserProfileEditNotification--disabled',
          );
          expect(checkbox).toBeDisabled();
        } else {
          expect(notificationElement).not.toHaveClass(
            'UserProfileEditNotification--disabled',
          );
          expect(checkbox).not.toBeDisabled();
        }

        if (notification.enabled) {
          expect(checkbox).toHaveAttribute('checked');
        } else {
          expect(checkbox).not.toHaveAttribute('checked');
        }

        /* eslint-enable jest/no-conditional-expect */
        expect(checkbox).toHaveAttribute('name', notification.name);
      });
    });

    it('does not render a notification if there is no corresponding label', () => {
      const userId = signInUserWithProps();
      const userNotifications = [
        { name: 'invalid-notification-name', enabled: true, mandatory: false },
      ];
      store.dispatch(
        loadUserNotifications({ userId, notifications: userNotifications }),
      );

      render();

      expect(
        screen.queryByClassName('UserProfileEditNotification'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tests for UserProfileEditPicture', () => {
    it('renders without a user', () => {
      renderForOtherUser({ userLoaded: false });

      expect(screen.getByText('Profile photo')).toBeInTheDocument();
      const fileInput = screen.getByClassName(
        'UserProfileEditPicture-file-input',
      );
      expect(fileInput).toBeDisabled();
      expect(fileInput).toHaveAttribute('accept', 'image/png, image/jpeg');
      expect(screen.getByText('Choose Photo…')).toHaveClass('Button--disabled');
      expect(
        screen.queryByRole('button', { name: 'Delete This Picture' }),
      ).not.toBeInTheDocument();
    });

    it('renders a UserAvatar component without a user', () => {
      renderForOtherUser({ userLoaded: false });

      expect(screen.getByClassName('Icon-anonymous-user')).toBeInTheDocument();
    });

    it('specifies the alt text of the UserAvatar component when a user is passed', () => {
      const pictureUrl = '/some/url/';
      renderForCurrentUser({ picture_url: pictureUrl });

      expect(
        screen.getByAltText(`Profile picture for ${defaultDisplayName}`),
      ).toHaveAttribute('src', pictureUrl);
    });

    it('enables the input file and select button when a user is supplied', () => {
      renderForCurrentUser();

      expect(
        screen.getByClassName('UserProfileEditPicture-file-input'),
      ).not.toBeDisabled();
      expect(screen.getByText('Choose Photo…')).not.toHaveClass(
        'Button--disabled',
      );
    });

    it('calls the onSelect() prop when a user selects a picture file', async () => {
      renderForCurrentUser();

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      const fileInput = screen.getByClassName(
        'UserProfileEditPicture-file-input',
      );

      userEvent.upload(fileInput, file);

      await waitFor(() => expect(fileInput.files['0']).toEqual(file));
    });

    it('renders a "delete" ConfirmButton when user has a picture URL', () => {
      renderForCurrentUser({ picture_url: 'https://example.org/pp.png' });

      const button = screen.getByRole('button', {
        name: 'Delete This Picture',
      });

      // By default, a `ConfirmButton` (or even a `Button`) has type "submit" but
      // we don't want that for this button as the `UserProfileEditPicture`
      // component is meant to be rendered within the `UserProfileEdit` form.
      // The first button with type "submit" in the form is triggered when we
      // submit the form by pressing `enter`, and if this component had a button
      // with type "submit", it would be the first one in the form, which is not
      // what we want!
      // See: https://github.com/mozilla/addons-frontend/issues/9493
      expect(button).toHaveAttribute('type', 'button');
      userEvent.click(button);

      expect(
        screen.getByText('Do you really want to delete this picture?'),
      ).toBeInTheDocument();
    });

    it('does not render a "delete" ConfirmButton when user has no picture URL', () => {
      renderForCurrentUser({ picture_url: null });

      expect(
        screen.queryByRole('button', {
          name: 'Delete This Picture',
        }),
      ).not.toBeInTheDocument();
    });

    it('calls the onDelete() prop when a user deletes the picture', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const userId = renderForCurrentUser({
        picture_url: 'https://example.org/pp.png',
      });

      userEvent.click(
        screen.getByRole('button', { name: 'Delete This Picture' }),
      );

      const button = screen.getByRole('button', { name: 'Confirm' });
      const clickEvent = createEvent.click(button);
      const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

      fireEvent(button, clickEvent);

      expect(preventDefaultWatcher).toHaveBeenCalled();

      expect(dispatch).toHaveBeenCalledWith(
        deleteUserPicture({
          errorHandlerId: getErrorHandlerId(userId),
          userId,
        }),
      );
    });

    it('adds and removes a CSS class when file input has/looses focus', () => {
      renderForCurrentUser();

      expect(
        screen.getByClassName('UserProfileEditPicture-file'),
      ).not.toHaveClass('UserProfileEditPicture-file--has-focus');

      userEvent.click(
        screen.getByClassName('UserProfileEditPicture-file-input'),
      );

      expect(screen.getByClassName('UserProfileEditPicture-file')).toHaveClass(
        'UserProfileEditPicture-file--has-focus',
      );

      userEvent.tab();

      expect(
        screen.getByClassName('UserProfileEditPicture-file'),
      ).not.toHaveClass('UserProfileEditPicture-file--has-focus');
    });
  });
});
