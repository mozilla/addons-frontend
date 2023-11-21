/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import {
  hideUserAbuseReportUI,
  sendUserAbuseReport,
  showUserAbuseReportUI,
} from 'amo/reducers/userAbuseReports';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { normalizeFileNameId, sanitizeHTML } from 'amo/utils';
import Button from 'amo/components/Button';
import DismissibleTextForm from 'amo/components/DismissibleTextForm';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { DispatchFunc } from 'amo/types/redux';
import type { I18nType } from 'amo/types/i18n';
import type { UserType } from 'amo/reducers/users';
import type { OnSubmitParams } from 'amo/components/DismissibleTextForm';

import './styles.scss';

type Props = {|
  className?: string,
  user?: UserType | null,
|};

type PropsFromState = {|
  hasSubmitted: boolean,
  isSubmitting: boolean,
  uiVisible: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export class ReportUserAbuseBase extends React.Component<InternalProps> {
  hideReportUI: () => void = () => {
    const { dispatch, user } = this.props;

    if (user) {
      dispatch(hideUserAbuseReportUI({ userId: user.id }));
    }
  };

  sendReport: (reportData: OnSubmitParams) => void = (
    reportData: OnSubmitParams,
  ) => {
    const { dispatch, errorHandler, user } = this.props;

    if (user) {
      dispatch(
        sendUserAbuseReport({
          errorHandlerId: errorHandler.id,
          message: reportData.text,
          userId: user.id,
          auth: true,
        }),
      );
    }
  };

  showReportUI: () => void = () => {
    const { dispatch, user } = this.props;

    if (user) {
      dispatch(showUserAbuseReportUI({ userId: user.id }));
    }
  };

  render(): React.Node {
    const {
      className,
      errorHandler,
      hasSubmitted,
      i18n,
      isSubmitting,
      uiVisible,
      user,
    } = this.props;

    let reportButtonProps: Object = {
      onClick: this.showReportUI,
    };

    const enableFeatureFeedbackFormLinks = config.get(
      'enableFeatureFeedbackFormLinks',
    );

    // When this feature flag is active, we link to the feedback form.
    if (user && enableFeatureFeedbackFormLinks) {
      reportButtonProps = {
        to: `/feedback/user/${user.id}/`,
      };
    }

    return (
      <div
        className={makeClassName('ReportUserAbuse', className, {
          'ReportUserAbuse--is-expanded': uiVisible,
        })}
      >
        {errorHandler.renderErrorIfPresent()}

        {!uiVisible && !hasSubmitted && (
          <Button
            buttonType="neutral"
            className="ReportUserAbuse-show-more"
            disabled={!user}
            puffy
            {...reportButtonProps}
          >
            {i18n.gettext('Report this user')}
          </Button>
        )}

        {!hasSubmitted && (
          <div className="ReportUserAbuse-form">
            <h2 className="ReportUserAbuse-header">
              {i18n.gettext('Report this user')}
            </h2>

            <p
              /* eslint-disable react/no-danger */
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(
                    `If you think this user is violating
                  %(linkTagStart)sMozilla's Add-on Policies%(linkTagEnd)s,
                  please report this user to Mozilla.`,
                  ),
                  {
                    linkTagStart:
                      '<a href="https://developer.mozilla.org/en-US/Add-ons/AMO/Policy/Reviews">',
                    linkTagEnd: '</a>',
                  },
                ),
                ['a'],
              )}
              /* eslint-enable react/no-danger */
            />
            <p>
              {i18n.gettext(
                `Please don't use this form to report bugs or contact this
                user; your report will only be sent to Mozilla and not
                to this user.`,
              )}
            </p>

            <DismissibleTextForm
              id={`${normalizeFileNameId(__filename)}-${String(
                user && user.id,
              )}`}
              isSubmitting={isSubmitting}
              onDismiss={this.hideReportUI}
              onSubmit={this.sendReport}
              placeholder={i18n.gettext(
                'Explain how this user is violating our policies.',
              )}
              submitButtonText={i18n.gettext('Send abuse report')}
              submitButtonInProgressText={i18n.gettext('Sending abuse report')}
            />
          </div>
        )}

        {hasSubmitted && (
          <div className="ReportUserAbuse--report-sent">
            <h3 className="ReportUserAbuse-header">
              {i18n.gettext('You reported this user')}
            </h3>

            <p>
              {i18n.gettext(`We have received your report. Thanks for letting
                us know about your concerns with this user.`)}
            </p>

            {!enableFeatureFeedbackFormLinks && (
              <p>
                {i18n.gettext(`We can't respond to every abuse report but we'll
                  look into this issue.`)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
  const abuseReport =
    ownProps.user && state.userAbuseReports.byUserId[ownProps.user.id]
      ? state.userAbuseReports.byUserId[ownProps.user.id]
      : {};

  return {
    hasSubmitted: abuseReport.hasSubmitted || false,
    isSubmitting: abuseReport.isSubmitting || false,
    uiVisible: abuseReport.uiVisible || false,
  };
};

const ReportUserAbuse: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ id: 'ReportUserAbuse' }),
)(ReportUserAbuseBase);

export default ReportUserAbuse;
