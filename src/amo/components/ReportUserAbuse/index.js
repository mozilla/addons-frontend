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

type InternalProps = {|
  ...Props,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  hasSubmitted: boolean,
  i18n: I18nType,
  isSubmitting: boolean,
  uiVisible: boolean,
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

  render(): React.Element<'div'> {
    const {
      className,
      errorHandler,
      hasSubmitted,
      i18n,
      isSubmitting,
      uiVisible,
      user,
    } = this.props;

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
            onClick={this.showReportUI}
            puffy
          >
            {i18n.gettext('Report this user for abuse')}
          </Button>
        )}

        {!hasSubmitted && (
          <div className="ReportUserAbuse-form">
            <h2 className="ReportUserAbuse-header">
              {i18n.gettext('Report this user for abuse')}
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
              id={normalizeFileNameId(__filename)}
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
              {i18n.gettext('You reported this user for abuse')}
            </h3>

            <p>
              {i18n.gettext(
                `We have received your report. Thanks for letting us know about
                your concerns with this user.`,
              )}
            </p>

            <p>
              {i18n.gettext(
                `We can't respond to every abuse report but we'll look into
                this issue.`,
              )}
            </p>
          </div>
        )}
      </div>
    );
  }
}

export const mapStateToProps = (
  state: AppState,
  ownProps: Props,
): {| hasSubmitted: boolean, isSubmitting: boolean, uiVisible: boolean |} => {
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
  withErrorHandler({ name: 'ReportUserAbuse' }),
)(ReportUserAbuseBase);

export default ReportUserAbuse;
