import userEvent from '@testing-library/user-event';
import { createEvent, fireEvent } from '@testing-library/react';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
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
  const lang = 'en-US';
  const defaultUserId = fakeAuthors[0].id;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  function defaultUserProps(props = {}) {
    return {
      display_name: 'Display McDisplayNamey',
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
});
