/* @flow */
import * as React from 'react';
import Helmet from 'react-helmet';
import { compose } from 'redux';
import base64url from 'base64url';

import Link from 'amo/components/Link';
import { getNotificationDescription } from 'amo/utils/notifications';
import Card from 'ui/components/Card';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {|
      hash: string,
      token: string,
      notificationName: string,
    |},
  |},
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class UsersUnsubscribeBase extends React.Component<InternalProps> {
  render() {
    const { i18n, match } = this.props;
    const { token, notificationName } = match.params;

    const linkEditProfileParts = getLocalizedTextWithLinkParts({
      i18n,
      text: i18n.gettext(
        'You can edit your notification settings by %(linkStart)sediting your profile%(linkEnd)s.',
      ),
    });

    return (
      <div className="UsersUnsubscribe">
        <Helmet>
          <title>{i18n.gettext('Unsubscribe')}</title>
        </Helmet>

        <Card header={i18n.gettext('You are successfully unsubscribed!')}>
          <p
            className="UsersUnsubscribe-content-explanation"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeHTML(
              i18n.sprintf(
                // translators: a list of notifications will be displayed under this prompt.
                i18n.gettext(
                  `The email address %(strongStart)s%(email)s%(strongEnd)s will
                  no longer get messages when:`,
                ),
                {
                  strongStart: '<strong>',
                  strongEnd: '</strong>',
                  email: base64url.decode(token),
                },
              ),
              ['strong'],
            )}
          />
          <blockquote className="UsersUnsubscribe-content-notification">
            {getNotificationDescription(i18n, notificationName)}
          </blockquote>

          <p className="UsersUnsubscribe-content-edit-profile">
            {linkEditProfileParts.beforeLinkText}
            <Link to="/users/edit">{linkEditProfileParts.innerLinkText}</Link>
            {linkEditProfileParts.afterLinkText}
          </p>
        </Card>
      </div>
    );
  }
}

const UsersUnsubscribe: React.ComponentType<Props> = compose(translate())(
  UsersUnsubscribeBase,
);

export default UsersUnsubscribe;
