/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import type { AddonAbuseState } from 'amo/reducers/abuse';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type PropsFromState = {|
  abuseReport: AddonAbuseState | null,
  loading: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  jed: I18nType,
|};

export class ReportAbuseButtonBase extends React.Component<InternalProps> {
  render(): null | React.Node {
    const { abuseReport, addon, jed, loading } = this.props;

    invariant(addon, 'An add-on is required');

    if (abuseReport && abuseReport.message !== undefined) {
      return (
        <div className="ReportAbuseButton ReportAbuseButton--report-sent">
          <h3 className="ReportAbuseButton-header">
            {jed.gettext('You reported this add-on')}
          </h3>

          <p className="ReportAbuseButton-first-paragraph">
            {jed.gettext(`We have received your report. Thanks for letting us
              know about your concerns with this add-on.`)}
          </p>
        </div>
      );
    }

    const reportButtonProps: Object = {
      to: `/feedback/addon/${addon.slug}/`,
    };

    /* eslint-disable react/no-danger */
    return (
      <div className={makeClassName('ReportAbuseButton')}>
        <div className="ReportAbuseButton--preview">
          <Button
            buttonType="neutral"
            className="ReportAbuseButton-show-more"
            disabled={loading}
            puffy
            {...reportButtonProps}
          >
            {jed.gettext('Report this add-on')}
          </Button>
        </div>
      </div>
    );
    /* eslint-enable react/no-danger */
  }
}

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
  const { addon } = ownProps;

  return {
    abuseReport:
      addon && state.abuse.byGUID[addon.guid]
        ? state.abuse.byGUID[addon.guid]
        : null,
    loading: state.abuse.loading,
  };
};

const ReportAbuseButton: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(ReportAbuseButtonBase);

export default ReportAbuseButton;
