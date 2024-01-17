/* @flow */
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { compose } from 'redux';
import { decode } from 'universal-base64url';
import { connect } from 'react-redux';

import Link from 'amo/components/Link';
import Page from 'amo/components/Page';
import { getNotificationDescription } from 'amo/utils/notifications';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { sanitizeHTML } from 'amo/utils';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import {
  getUnsubscribeKey,
  isUnsubscribedFor,
  unsubscribeNotification,
} from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'amo/types/router';
import type { I18nType } from 'amo/types/i18n';
import type { ErrorHandlerType } from 'amo/types/errorHandler';

import './styles.scss';

type Props = {|
  // The `location` prop is used in `extractId()`.
  // eslint-disable-next-line react/no-unused-prop-types
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

type PropsFromState = {|
  isUnsubscribed: boolean | null | void,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
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

  render(): React.Node {
    const { errorHandler, i18n, isUnsubscribed, match } = this.props;
    const { token, notificationName } = match.params;

    const editProfileLink = replaceStringsWithJSX({
      text: i18n.gettext(
        'You can edit your notification settings by %(linkStart)sediting your profile%(linkEnd)s.',
      ),
      replacements: [
        [
          'linkStart',
          'linkEnd',
          (text) => (
            <Link key="edit-profile" to="/users/edit">
              {text}
            </Link>
          ),
        ],
      ],
    });

    return (
      <Page>
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
                      // L10n: a list of notifications will be displayed under this prompt.
                      i18n.gettext(
                        'The email address %(strongStart)s%(email)s%(strongEnd)s will no longer get messages when:',
                      ),
                      {
                        strongStart: '<strong>',
                        strongEnd: '</strong>',
                        email: decode(token),
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
                  <LoadingText minWidth={40} />
                )}
              </blockquote>

              <p className="UsersUnsubscribe-content-edit-profile">
                {isUnsubscribed ? editProfileLink : <LoadingText />}
              </p>
            </Card>
          )}
        </div>
      </Page>
    );
  }
}

export const extractId = (ownProps: Props): string => {
  const { match } = ownProps;
  const { hash, notificationName, token } = match.params;

  return getUnsubscribeKey({ hash, notification: notificationName, token });
};

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
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
