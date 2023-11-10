/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';
import invariant from 'invariant';

import { sendUserAbuseReport } from 'amo/reducers/userAbuseReports';
import FeedbackForm, {
  CATEGORY_FEEDBACK_SPAM,
  CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
  CATEGORY_ILLEGAL,
  CATEGORY_OTHER,
} from 'amo/components/FeedbackForm';
import LoadingText from 'amo/components/LoadingText';
import UserAvatar from 'amo/components/UserAvatar';
import Card from 'amo/components/Card';
import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import { withFixedErrorHandler } from 'amo/errorHandler';
import { fetchUserAccount, getUserById } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterMatchType } from 'amo/types/router';
import type { I18nType } from 'amo/types/i18n';
import type { UserId, UserType } from 'amo/reducers/users';
import type { FeedbackFormValues } from 'amo/components/FeedbackForm';

import './styles.scss';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    // This means we do not accept usernames in the URL, only numeric IDs.
    params: {| userId: UserId |},
  |},
|};

type PropsFromState = {|
  user: UserType | null,
  hasSubmitted: boolean,
  isSubmitting: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
|};

export class UserFeedbackBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { dispatch, errorHandler, match, user } = props;
    const { params } = match;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!user) {
      dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          userId: params.userId,
        }),
      );
    }
  }

  onFormSubmitted: (values: FeedbackFormValues) => void = (values) => {
    const { dispatch, errorHandler, user } = this.props;
    const { anonymous, email, name, text, category } = values;

    invariant(user, 'user is required');

    dispatch(
      sendUserAbuseReport({
        errorHandlerId: errorHandler.id,
        reporterEmail: anonymous ? '' : email,
        reporterName: anonymous ? '' : name,
        message: text,
        reason: category,
        userId: user.id,
        // Only authenticate the API call when the report isn't submitted
        // anonymously.
        auth: anonymous === false,
      }),
    );
  };

  render(): React.Node {
    const { errorHandler, user, i18n, isSubmitting, hasSubmitted } = this.props;

    if (
      errorHandler.hasError() &&
      errorHandler.capturedError.responseStatusCode === 404
    ) {
      return <NotFoundPage />;
    }

    return (
      <Page>
        <div className="UserFeedback-page">
          <Helmet>
            <title>
              {i18n.gettext('Submit feedback or report a user to Mozilla')}
            </title>
            <meta name="robots" content="noindex, follow" />
          </Helmet>

          <FeedbackForm
            errorHandler={errorHandler}
            contentHeader={
              <Card className="UserFeedback-header">
                <UserAvatar
                  className="UserFeedback-header-avatar"
                  user={user}
                />

                <h1 className="UserFeedback-header-username">
                  {user ? user.name : <LoadingText />}
                </h1>

                <div className="UserFeedback-header-metadata">
                  <span>{i18n.gettext('User since')}</span>
                  {user ? (
                    i18n.moment(user.created).format('ll')
                  ) : (
                    <LoadingText />
                  )}
                </div>
              </Card>
            }
            abuseIsLoading={isSubmitting}
            abuseSubmitted={hasSubmitted}
            categoryHeader={i18n.gettext('Report this user to Mozilla')}
            feedbackTitle={i18n.gettext('Send some feedback about the user')}
            reportTitle={i18n.gettext(
              'Report the user because they are illegal or incompliant',
            )}
            categories={[
              CATEGORY_FEEDBACK_SPAM,
              CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
              CATEGORY_ILLEGAL,
              CATEGORY_OTHER,
            ]}
            showLocation={false}
            onSubmit={this.onFormSubmitted}
          />
        </div>
      </Page>
    );
  }
}

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { params } = ownProps.match;
  const userId: UserId = Number(params.userId);
  const user = getUserById(state.users, userId) || null;
  const abuseReport = state.userAbuseReports.byUserId[userId] || {};

  return {
    user,
    hasSubmitted: abuseReport.hasSubmitted || false,
    isSubmitting: abuseReport.isSubmitting || false,
  };
}

export const extractId = (ownProps: InternalProps): string => {
  return String(ownProps.match.params.userId);
};

const UserFeedback: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(UserFeedbackBase);

export default UserFeedback;
