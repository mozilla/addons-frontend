/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';
import type { I18nType } from 'amo/types/i18n';
import type { UserType } from 'amo/reducers/users';

import './styles.scss';

type Props = {|
  className?: string,
  user?: UserType | null,
|};

type PropsFromState = {|
  hasSubmitted: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  jed: I18nType,
|};

export class ReportUserAbuseBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { className, hasSubmitted, jed, user } = this.props;

    let reportButtonProps: Object = {};
    if (user) {
      reportButtonProps = {
        to: `/feedback/user/${user.id}/`,
      };
    }

    return (
      <div className={makeClassName('ReportUserAbuse', className)}>
        {hasSubmitted ? (
          <div className="ReportUserAbuse--report-sent">
            <h3 className="ReportUserAbuse-header">
              {jed.gettext('You reported this user')}
            </h3>

            <p>
              {jed.gettext(`We have received your report. Thanks for letting
                us know about your concerns with this user.`)}
            </p>
          </div>
        ) : (
          <Button
            buttonType="neutral"
            className="ReportUserAbuse-show-more"
            disabled={!user}
            puffy
            {...reportButtonProps}
          >
            {jed.gettext('Report this user')}
          </Button>
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
  };
};

const ReportUserAbuse: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(ReportUserAbuseBase);

export default ReportUserAbuse;
