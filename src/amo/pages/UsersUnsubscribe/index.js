/* @flow */
import * as React from 'react';
import Helmet from 'react-helmet';
import { compose } from 'redux';
import base64url from 'base64url';
import { connect } from 'react-redux';

import Link from 'amo/components/Link';
import { getNotificationDescription } from 'amo/utils/notifications';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
import {
  getUnsubscribeKey,
  isUnsubscribedFor,
  unsubscribeNotification,
} from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { I18nType } from 'core/types/i18n';
import type { ErrorHandlerType } from 'core/errorHandler';

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
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  isUnsubscribed: boolean,
|};

export class UsersUnsubscribeBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { dispatch, errorHandler, match, isUnsubscribed } = props;
    const { hash, notificationName, token } = match.params;

    if (isUnsubscribed === undefined) {
      dispatch(
        unsubscribeNotification({
          errorHandlerId: errorHandler.id,
          hash,
          notification: notificationName,
          token,
        }),
      );
    }
  }

  render() {
    const { errorHandler, i18n, isUnsubscribed, match } = this.props;
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

        {errorHandler.hasError() ? (
          errorHandler.renderError()
        ) : (
          <Card
            header={
              isUnsubscribed ? (
                i18n.gettext('You are successfully unsubscribed!')
              ) : (
                <LoadingText />
              )
            }
          >
            {isUnsubscribed ? (
              <p
                className="UsersUnsubscribe-content-explanation"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={sanitizeHTML(
                  i18n.sprintf(
                    // translators: a list of notifications will be displayed under this prompt.
                    i18n.gettext(
                      `The email address %(strongStart)s%(email)s%(strongEnd)s
                      will no longer get messages when:`,
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
            ) : (
              <p className="UsersUnsubscribe-content-explanation">
                <LoadingText minWidth={40} />
              </p>
            )}

            <blockquote className="UsersUnsubscribe-content-notification">
              {isUnsubscribed ? (
                getNotificationDescription(i18n, notificationName)
              ) : (
                <LoadingText range={30} />
              )}
            </blockquote>

            {isUnsubscribed ? (
              <p className="UsersUnsubscribe-content-edit-profile">
                {linkEditProfileParts.beforeLinkText}
                <Link to="/users/edit">
                  {linkEditProfileParts.innerLinkText}
                </Link>
                {linkEditProfileParts.afterLinkText}
              </p>
            ) : (
              <p className="UsersUnsubscribe-content-edit-profile">
                <LoadingText />
              </p>
            )}
          </Card>
        )}
      </div>
    );
  }
}

export const extractId = (ownProps: Props) => {
  const { match } = ownProps;
  const { hash, notificationName, token } = match.params;

  return getUnsubscribeKey({ hash, notification: notificationName, token });
};

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { hash, notificationName, token } = ownProps.match.params;

  return {
    isUnsubscribed: isUnsubscribedFor(
      state.users,
      hash,
      notificationName,
      token,
    ),
  };
};

const UsersUnsubscribe: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UsersUnsubscribeBase);

export default UsersUnsubscribe;
