/* @flow */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import { compose } from 'redux';

import log from 'core/logger';
import translate from 'core/i18n/translate';
import LoadingText from 'ui/components/LoadingText';
import type { UserType } from 'amo/reducers/users';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


export const getLabelText = (i18n: I18nType, name: string): string | null => {
  switch (name) {
    case 'announcements':
      return i18n.gettext(`stay up-to-date with news and events relevant to
        add-on developers (including the about:addons newsletter)`);
    case 'individual_contact':
      return i18n.gettext(`Mozilla needs to contact me about my individual
        add-on`);
    case 'new_features':
      return i18n.gettext('new add-ons or Firefox features are available');
    case 'new_review':
      return i18n.gettext('someone writes a review of my add-on');
    case 'reply':
      return i18n.gettext('an add-on developer replies to my review');
    case 'reviewer_reviewed':
      return i18n.gettext('my add-on is reviewed by a reviewer');
    case 'sdk_upgrade_fail':
      return i18n.gettext('my sdk-based add-on cannot be upgraded');
    case 'sdk_upgrade_success':
      return i18n.gettext('my sdk-based add-on is upgraded successfully');
    case 'upgrade_fail':
      return i18n.gettext(`my add-on's compatibility cannot be upgraded`);
    case 'upgrade_success':
      return i18n.gettext(`my add-on's compatibility is upgraded successfully`);
    default:
  }

  return null;
};

type CreateNotificationParams = {|
  enabled: boolean,
  label: React.Element<typeof LoadingText> | string | null,
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
}: CreateNotificationParams): React.Element<any> | null => {
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
  i18n: I18nType,
  onChange: Function,
  user: UserType | null,
|};

export const UserProfileEditNotificationsBase = ({
  i18n,
  onChange,
  user,
}: Props) => {
  let notifications = [];
  if (!user || !user.notifications) {
    for (let i = 0; i < 2; i++) {
      const name = `loading-notification-${i}`;

      notifications.push(createNotification({
        name,
        mandatory: true,
        enabled: false,
        label: <LoadingText />,
      }));
    }
  } else {
    notifications = user.notifications.map(
      (notification) => createNotification({
        ...notification,
        label: getLabelText(i18n, notification.name),
        onChange,
      })
    );
  }

  return (
    <div className="UserProfileEditNotifications">
      {notifications}
    </div>
  );
};

export default compose(
  translate(),
)(UserProfileEditNotificationsBase);
