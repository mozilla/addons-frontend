/* @flow */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION } from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import type { ErrorHandlerType } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import {
  hideAddonAbuseReportUI,
  initiateAddonAbuseReportViaFirefox,
  sendAddonAbuseReport,
  showAddonAbuseReportUI,
} from 'core/reducers/abuse';
import { normalizeFileNameId, sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import DismissibleTextForm from 'ui/components/DismissibleTextForm';
import type { OnSubmitParams } from 'ui/components/DismissibleTextForm';
import type { AppState } from 'amo/store';
import type { AddonAbuseState } from 'core/reducers/abuse';
import type { DispatchFunc } from 'core/types/redux';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import { hasAbuseReportPanelEnabled } from 'core/addonManager';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  _hasAbuseReportPanelEnabled: typeof hasAbuseReportPanelEnabled,
  abuseReport: AddonAbuseState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  loading: boolean,
|};

export class ReportAbuseButtonBase extends React.Component<InternalProps> {
  static defaultProps = {
    _hasAbuseReportPanelEnabled: hasAbuseReportPanelEnabled,
  };

  dismissReportUI = () => {
    const { addon, dispatch, loading } = this.props;

    if (loading) {
      log.debug(
        "Ignoring dismiss click because we're submitting the abuse report",
      );
      return;
    }

    dispatch(hideAddonAbuseReportUI({ addon }));
  };

  sendReport = ({ text }: OnSubmitParams) => {
    // The button isn't clickable if there is no content, but just in case:
    // we verify there's a message to send.
    if (!text.trim().length) {
      log.debug(oneLine`User managed to click submit button while textarea
        was empty. Ignoring this onClick/sendReport event.`);
      return;
    }

    const { addon, dispatch, errorHandler } = this.props;

    dispatch(
      sendAddonAbuseReport({
        addonSlug: addon.slug,
        errorHandlerId: errorHandler.id,
        message: text,
      }),
    );
  };

  onReportButtonClick = async (event: SyntheticEvent<any>) => {
    const { _hasAbuseReportPanelEnabled, addon, dispatch } = this.props;

    event.preventDefault();

    if (
      _hasAbuseReportPanelEnabled() &&
      // The integrated abuse report panel currently supports only extensions
      // and themes (e.g. we do only have abuse categories and related
      // localized descriptions only for these two kind of addons), and so
      // currently it is going to refuse to create an abuse report panel for
      // langpacks, dictionaries and search tools.
      //
      // Static themes should be supported but there is a bug in FF, see:
      // https://github.com/mozilla/addons-frontend/issues/8762#issuecomment-553430081
      [ADDON_TYPE_EXTENSION].includes(addon.type)
    ) {
      dispatch(initiateAddonAbuseReportViaFirefox({ addon }));
      return;
    }

    dispatch(showAddonAbuseReportUI({ addon }));
  };

  render() {
    const { abuseReport, addon, errorHandler, i18n, loading } = this.props;

    if (!addon) {
      return null;
    }

    if (abuseReport && abuseReport.message !== undefined) {
      return (
        <div className="ReportAbuseButton ReportAbuseButton--report-sent">
          <h3 className="ReportAbuseButton-header">
            {i18n.gettext('You reported this add-on for abuse')}
          </h3>

          <p className="ReportAbuseButton-first-paragraph">
            {i18n.gettext(
              `We have received your report. Thanks for letting us know about
              your concerns with this add-on.`,
            )}
          </p>

          <p>
            {i18n.gettext(
              `We can't respond to every abuse report but we'll look into
              this issue.`,
            )}
          </p>
        </div>
      );
    }

    const prefaceText = i18n.sprintf(
      i18n.gettext(
        `If you think this add-on violates
      %(linkTagStart)sMozilla's add-on policies%(linkTagEnd)s or has
      security or privacy issues, please report these issues to Mozilla using
      this form.`,
      ),
      {
        linkTagStart:
          '<a href="https://developer.mozilla.org/en-US/Add-ons/AMO/Policy/Reviews">',
        linkTagEnd: '</a>',
      },
    );

    // The button prompt mentions abuse to make it clear that you can't
    // use it to report general issues (like bugs) about the add-on.
    // See https://github.com/mozilla/addons-frontend/issues/4025#issuecomment-349103373
    const prompt = i18n.gettext('Report this add-on for abuse');

    /* eslint-disable react/no-danger */
    return (
      <div
        className={makeClassName('ReportAbuseButton', {
          'ReportAbuseButton--is-expanded': abuseReport.uiVisible,
        })}
      >
        <div className="ReportAbuseButton--preview">
          <Button
            buttonType="neutral"
            className="ReportAbuseButton-show-more"
            disabled={loading}
            onClick={this.onReportButtonClick}
            puffy
          >
            {prompt}
          </Button>
        </div>

        <div className="ReportAbuseButton--expanded">
          <h3 className="ReportAbuseButton-header">{prompt}</h3>

          <p
            className="ReportAbuseButton-first-paragraph"
            dangerouslySetInnerHTML={sanitizeHTML(prefaceText, ['a'])}
          />

          <p>
            {i18n.gettext(
              `Please don't use this form to report bugs or request add-on
              features; this report will be sent to Mozilla and not to the
              add-on developer.`,
            )}
          </p>

          {errorHandler.renderErrorIfPresent()}

          <DismissibleTextForm
            id={normalizeFileNameId(__filename)}
            isSubmitting={loading}
            onSubmit={this.sendReport}
            submitButtonText={i18n.gettext('Send abuse report')}
            submitButtonInProgressText={i18n.gettext('Sending abuse report')}
            onDismiss={this.dismissReportUI}
            dismissButtonText={i18n.gettext('Dismiss')}
            placeholder={i18n.gettext(
              'Explain how this add-on is violating our policies.',
            )}
          />
        </div>
      </div>
    );
    /* eslint-enable react/no-danger */
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { addon } = ownProps;

  return {
    abuseReport:
      addon && state.abuse.bySlug[addon.slug]
        ? state.abuse.bySlug[addon.slug]
        : {},
    loading: state.abuse.loading,
  };
};

const ReportAbuseButton: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'ReportAbuseButton' }),
)(ReportAbuseButtonBase);

export default ReportAbuseButton;
