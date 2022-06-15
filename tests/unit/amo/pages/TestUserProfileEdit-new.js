import userEvent from '@testing-library/user-event';
import { createEvent, fireEvent, waitFor } from '@testing-library/react';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  deleteUserPicture,
  getCurrentUser,
  loadUserNotifications,
  updateUserAccount,
} from 'amo/reducers/users';
import { getNotificationDescription } from 'amo/utils/notifications';
import {
  createUserNotificationsResponse,
  dispatchClientMetadata,
  dispatchSignInActionsWithStore,
  fakeAuthors,
  fakeI18n,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultDisplayName = 'Display McDisplayNamey';
  const lang = 'en-US';
  const defaultUserId = fakeAuthors[0].id;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  function defaultUserProps(props = {}) {
    return {
      display_name: defaultDisplayName,
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

  const render = ({ location, userId } = {}) => {
    const renderOptions = {
      initialEntries: [location || getLocation(userId)],
      store,
    };

    return defaultRender(renderOptions);
  };

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
      const userId = signInUserWithProps();
      render({ userId: userId + 1 });

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
      signInUserWithProps();
      render();

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
      const userId = signInUserWithProps();
      render({ userId: userId + 1 });

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
      const userId = signInUserWithProps();
      render({ userId: userId + 1 });

      expect(screen.getByClassName('Icon-anonymous-user')).toBeInTheDocument();
    });

    it('specifies the alt text of the UserAvatar component when a user is passed', () => {
      const pictureUrl = '/some/url/';
      signInUserWithProps({ picture_url: pictureUrl });
      render();

      expect(
        screen.getByAltText(`Profile picture for ${defaultDisplayName}`),
      ).toHaveAttribute('src', pictureUrl);
    });

    it('enables the input file and select button when a user is supplied', () => {
      signInUserWithProps();
      render();

      expect(
        screen.getByClassName('UserProfileEditPicture-file-input'),
      ).not.toBeDisabled();
      expect(screen.getByText('Choose Photo…')).not.toHaveClass(
        'Button--disabled',
      );
    });

    it('calls the onSelect() prop when a user selects a picture file', async () => {
      signInUserWithProps();
      render();

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      const fileInput = screen.getByClassName(
        'UserProfileEditPicture-file-input',
      );

      userEvent.upload(fileInput, file);

      await waitFor(() => expect(fileInput.files['0']).toEqual(file));

      // We need this to avoid ending the test before an async function completes.
      await waitFor(() =>
        expect(
          screen.getByAltText(`Profile picture for ${defaultDisplayName}`),
        ).toHaveAttribute('src', expect.stringContaining('data:')),
      );
    });

    it('renders a "delete" ConfirmButton when user has a picture URL', () => {
      signInUserWithProps({ picture_url: 'https://example.org/pp.png' });
      render();

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
      signInUserWithProps({ picture_url: null });
      render();

      expect(
        screen.queryByRole('button', {
          name: 'Delete This Picture',
        }),
      ).not.toBeInTheDocument();
    });

    it('calls the onDelete() prop when a user deletes the picture', () => {
      const userId = signInUserWithProps({
        picture_url: 'https://example.org/pp.png',
      });
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

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
          errorHandlerId: getErrorHandlerId(),
          userId,
        }),
      );
    });

    it('adds and removes a CSS class when file input has/looses focus', () => {
      signInUserWithProps();
      render();

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
