import * as React from 'react';

import UserProfileEditNotifications, {
  getLabelText,
  UserProfileEditNotificationsBase,
} from 'amo/components/UserProfileEditNotifications';
import {
  getCurrentUser,
  loadUserNotifications,
} from 'amo/reducers/users';
import LoadingText from 'ui/components/LoadingText';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import {
  createUserNotificationsResponse,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';


describe(__filename, () => {
  const render = ({ i18n = fakeI18n(), ...props } = {}) => {
    return shallowUntilTarget(
      <UserProfileEditNotifications
        i18n={i18n}
        onChange={null}
        user={null}
        {...props}
      />,
      UserProfileEditNotificationsBase,
    );
  };

  it('renders loading notifications without a user', () => {
    const root = render({ user: null });

    expect(root.find('.UserProfileEditNotifications')).toHaveLength(1);

    expect(root.find('.UserProfileEditNotification')).toHaveLength(2);
    expect(root.find('.UserProfileEditNotification--disabled')).toHaveLength(2);

    expect(root.find(LoadingText)).toHaveLength(2);
    expect(root.find('.UserProfileEditNotification-input')).toHaveLength(2);
    expect(root.find('.UserProfileEditNotification-checkbox')).toHaveLength(2);

    root.find('.UserProfileEditNotification-input').forEach((input, index) => {
      expect(input).toHaveProp('defaultChecked', false);
      expect(input).toHaveProp('disabled', true);
      expect(input).toHaveProp('name', `loading-notification-${index}`);
      expect(input).toHaveProp('onChange', undefined);
    });
  });

  it(`renders loading notifications when user's notifications are not loaded`, () => {
    const username = 'johnedoe';
    const { store } = dispatchSignInActions({ userProps: { username } });
    const { users } = store.getState();

    const user = getCurrentUser(users);
    const root = render({ user });

    expect(root.find('.UserProfileEditNotification')).toHaveLength(2);
    expect(root.find(LoadingText)).toHaveLength(2);
  });

  it(`renders notifications when the user's notifications are loaded`, () => {
    const username = 'johnedoe';
    const notifications = createUserNotificationsResponse();

    const { store } = dispatchSignInActions({ userProps: { username } });
    store.dispatch(loadUserNotifications({ username, notifications }));

    const { users } = store.getState();
    const user = getCurrentUser(users);

    const onChange = sinon.stub();

    const root = render({ onChange, user });

    expect(root.find('.UserProfileEditNotification'))
      .toHaveLength(notifications.length);
    expect(root.find(LoadingText)).toHaveLength(0);

    const i18n = fakeI18n();
    notifications.forEach((notification) => {
      // Find element by ID.
      const input = root.find({ id: notification.name });

      expect(input).toHaveProp('defaultChecked', notification.enabled);
      expect(input).toHaveProp('disabled', notification.mandatory);
      expect(input).toHaveProp('name', notification.name);
      expect(input).toHaveProp('onChange', onChange);

      const label = input.parent();
      expect(label.shallow()).toHaveText(
        getLabelText(i18n, notification.name)
      );

      const p = input.closest('p');
      expect(p).toHaveClassName('UserProfileEditNotification');
      expect(p.hasClass('UserProfileEditNotification--disabled'))
        .toEqual(notification.mandatory);
    });
  });

  it('does not render a notification if there is no corresponding label', () => {
    const username = 'johnedoe';
    const notifications = [
      { name: 'invalid-notification-name', enabled: true, mandatory: false },
    ];

    const { store } = dispatchSignInActions({ userProps: { username } });
    store.dispatch(loadUserNotifications({ username, notifications }));

    const { users } = store.getState();
    const user = getCurrentUser(users);

    const root = render({ user });

    expect(root.find('.UserProfileEditNotification')).toHaveLength(0);
  });
});
