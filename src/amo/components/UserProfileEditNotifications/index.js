/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';
import invariant from 'invariant';

import translate from 'core/i18n/translate';
import LoadingText from 'ui/components/LoadingText';
import type { UserType } from 'amo/reducers/users';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


// We disable the eslint rule below because Flow complains about unreachable
// code if we add a `return` statement in the `default` case.
// eslint-disable-next-line consistent-return
export const getLabelText = (i18n: I18nType, name: string): string => {
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
      invariant(false, `No corresponding label for notification "${name}"`);
  }
};

type CreateNotificationParams = {|
  enabled: boolean,
  label: React.Element<typeof LoadingText> | string,
  mandatory: boolean,
  name: string,
|};

const createNotification = ({
  enabled,
  label,
  mandatory,
  name,
}: CreateNotificationParams) => (
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
        type="checkbox"
      />
      <span className="UserProfileEditNotification-checkbox" />
      {label}
    </label>
  </p>
);

type Props = {|
  i18n: I18nType,
  user: UserType | null,
|};

export const UserProfileEditNotificationsBase = ({
  i18n,
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
