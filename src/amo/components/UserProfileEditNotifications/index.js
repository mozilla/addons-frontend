/* @flow */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import { compose } from 'redux';

import { getNotificationDescription } from 'amo/utils/notifications';
import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import LoadingText from 'amo/components/LoadingText';
import type { UserType } from 'amo/reducers/users';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type CreateNotificationParams = {|
  enabled: boolean,
  label: React.Node | string | null,
  mandatory: boolean,
  name: string,
  onChange?: Function,
|};

const createNotification = ({
  enabled,
  label,
  mandatory,
  name,
  onChange,
}: CreateNotificationParams): React.Node | null => {
  if (!label) {
    log.warn(oneLine`Not rendering notification "${name}" because there is no
      corresponding label.`);
    return null;
  }

  return (
    <p
      className={makeClassName('UserProfileEditNotification', {
        'UserProfileEditNotification--disabled': mandatory,
      })}
      key={name}
    >
      <label htmlFor={name}>
        <input
          className="UserProfileEditNotification-input"
          defaultChecked={enabled}
          disabled={mandatory}
          id={name}
          name={name}
          onChange={onChange}
          type="checkbox"
        />

        <span className="UserProfileEditNotification-checkbox" />
        {label}
      </label>
    </p>
  );
};

type Props = {|
  onChange: Function,
  user: UserType | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const UserProfileEditNotificationsBase = ({
  i18n,
  onChange,
  user,
}: InternalProps): React.Node => {
  let notifications = [];
  if (!user || !user.notifications) {
    for (let i = 0; i < 2; i++) {
      const name = `loading-notification-${i}`;

      notifications.push(
        createNotification({
          name,
          mandatory: true,
          enabled: false,
          label: <LoadingText />,
        }),
      );
    }
  } else {
    notifications = user.notifications.map((notification) =>
      createNotification({
        ...notification,
        label: getNotificationDescription(i18n, notification.name),
        onChange,
      }),
    );
  }

  return <div className="UserProfileEditNotifications">{notifications}</div>;
};

const UserProfileEditNotifications: React.ComponentType<Props> = compose(
  translate(),
)(UserProfileEditNotificationsBase);

export default UserProfileEditNotifications;
