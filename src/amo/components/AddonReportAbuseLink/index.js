/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import Link from 'amo/components/Link';
import type { AddonAbuseState } from 'amo/reducers/abuse';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type PropsFromState = {|
  abuseReport: AddonAbuseState | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
|};

export class AddonReportAbuseLinkBase extends React.Component<InternalProps> {
  render(): null | React.Node {
    const { abuseReport, addon, i18n } = this.props;

    invariant(addon, 'An add-on is required');

    if (abuseReport && abuseReport.message !== undefined) {
      return (
        <div className="AddonReportAbuseLink AddonReportAbuseLink--report-sent">
          <h3 className="AddonReportAbuseLink-header">
            {i18n.gettext('You reported this add-on')}
          </h3>

          <p className="AddonReportAbuseLink-first-paragraph">
            {i18n.gettext(`We have received your report. Thanks for letting us
              know about your concerns with this add-on.`)}
          </p>
        </div>
      );
    }

    /* eslint-disable react/no-danger */
    return (
      <div className="AddonReportAbuseLink">
        <div className="AddonReportAbuseLink--preview">
          <Link to={`/feedback/addon/${addon.slug}/`} rel="nofollow">
            {i18n.gettext('Report this add-on')}
          </Link>
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
  };
};

const AddonReportAbuseLink: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonReportAbuseLinkBase);

export default AddonReportAbuseLink;
