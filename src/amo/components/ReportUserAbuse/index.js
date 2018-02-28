/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  hideUserAbuseReportUI,
  sendUserAbuseReport,
  showUserAbuseReportUI,
} from 'amo/reducers/userAbuseReports';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import DismissibleTextForm from 'ui/components/DismissibleTextForm';
import type { UserAbuseReportsState } from 'amo/reducers/userAbuseReports';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { UserType } from 'amo/reducers/users';
import type { OnSubmitParams } from 'ui/components/DismissibleTextForm';

import './styles.scss';


type Props = {|
  abuseReports: UserAbuseReportsState,
  className?: string,
  dispatch: Function,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  user?: UserType,
|};

export class ReportUserAbuseBase extends React.Component<Props> {
  props: Props;

  hideReportUI = () => {
    const { dispatch, user } = this.props;

    if (user) {
      dispatch(hideUserAbuseReportUI({ user }));
    }
  }

  sendReport = (reportData: OnSubmitParams) => {
    const { dispatch, errorHandler, user } = this.props;

    if (user) {
      dispatch(sendUserAbuseReport({
        errorHandlerId: errorHandler.id,
        message: reportData.text,
        user,
      }));
    }
  }

  showReportUI = () => {
    const { dispatch, user } = this.props;

    if (user) {
      dispatch(showUserAbuseReportUI({ user }));
    }
  }

  render() {
    const { abuseReports, className, errorHandler, i18n, user } = this.props;
    const abuseReport = user ? abuseReports.byUserId[user.id] : null;

    if (!user) {
      return null;
    }

    return (
      <div
        className={makeClassName('ReportUserAbuse', className, {
          'ReportUserAbuse--is-expanded': abuseReport && abuseReport.uiVisible,
        })}
      >
        {errorHandler.renderErrorIfPresent()}

        {
          (!abuseReport || !abuseReport.uiVisible) &&
          (!abuseReport || !abuseReport.hasSubmitted) && (
          <Button
            buttonType="neutral"
            className="ReportUserAbuse-show-more"
            disabled={!user}
            onClick={this.showReportUI}
            puffy
          >
            {i18n.gettext('Report this user for abuse')}
          </Button>
        )}

        {(abuseReport && !abuseReport.hasSubmitted) && (
          <div className="ReportUserAbuse-form">
            <h2 className="ReportUserAbuse-header">
              {i18n.gettext('Report this user for abuse')}
            </h2>

            <p
              /* eslint-disable react/no-danger */
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(i18n.gettext(
                  `If you think this user is violating
                  %(linkTagStart)sMozilla's Add-on Policies%(linkTagEnd)s,
                  please report this user to Mozilla.`
                ), {
                  linkTagStart: '<a href="https://developer.mozilla.org/en-US/Add-ons/AMO/Policy">',
                  linkTagEnd: '</a>',
                })
              )}
              /* eslint-enable react/no-danger */
            />
            <p>
              {i18n.gettext(
                `Please don't use this form to report bugs or contact this
                user; your report will only be sent to Mozilla and not
                to the add-on developer.`)}
            </p>

            <DismissibleTextForm
              isSubmitting={
                abuseReport.isSubmitting && !errorHandler.hasError()
              }
              onDismiss={this.hideReportUI}
              onSubmit={this.sendReport}
              placeholder={i18n.gettext(
                'Explain how this user is violating our policies.'
              )}
              submitButtonText={i18n.gettext('Send abuse report')}
              submitButtonInProgressText={i18n.gettext('Sending abuse report')}
            />
          </div>
        )}

        {abuseReport && abuseReport.hasSubmitted && (
          <div className="ReportUserAbuse--report-sent">
            <h3 className="ReportUserAbuse-header">
              {i18n.gettext('You reported this user for abuse')}
            </h3>

            <p className="ReportUserAbuse-first-paragraph">
              {i18n.gettext(
                `We have received your report. Thanks for letting us know about
                your concerns with this user.`
              )}
            </p>

            <p>
              {i18n.gettext(
                `We can't respond to every abuse report but we'll look into
                this issue.`
              )}
            </p>
          </div>
        )}
      </div>
    );
  }
}

export const mapStateToProps = (
  state: {| userAbuseReports: UserAbuseReportsState |}
) => {
  return {
    abuseReports: state.userAbuseReports,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'ReportUserAbuse' }),
)(ReportUserAbuseBase);
