/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import { hasAbuseReportPanelEnabled } from 'amo/addonManager';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import translate from 'amo/i18n/translate';
import {
  hideAddonAbuseReportUI,
  initiateAddonAbuseReportViaFirefox,
  sendAddonAbuseReport,
  showAddonAbuseReportUI,
} from 'amo/reducers/abuse';
import { normalizeFileNameId, sanitizeHTML } from 'amo/utils';
import Button from 'amo/components/Button';
import DismissibleTextForm from 'amo/components/DismissibleTextForm';
import type { OnSubmitParams } from 'amo/components/DismissibleTextForm';
import type { AddonAbuseState } from 'amo/reducers/abuse';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { ElementEvent } from 'amo/types/dom';
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

type DefaultProps = {|
  _hasAbuseReportPanelEnabled: typeof hasAbuseReportPanelEnabled,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export class ReportAbuseButtonBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _hasAbuseReportPanelEnabled: hasAbuseReportPanelEnabled,
  };

  dismissReportUI: () => void = () => {
    const { addon, dispatch } = this.props;

    dispatch(hideAddonAbuseReportUI({ addon }));
  };

  sendReport: (OnSubmitParams) => void = ({ text }: OnSubmitParams) => {
    // The button isn't clickable if there is no content, but just in case:
    // we verify there's a message to send.
    invariant(text.trim().length, 'A report cannot be sent with no content.');

    const { addon, dispatch, errorHandler } = this.props;

    dispatch(
      sendAddonAbuseReport({
        addonId: addon.slug,
        errorHandlerId: errorHandler.id,
        message: text,
        auth: true,
      }),
    );
  };

  onReportButtonClick: (event: ElementEvent) => Promise<void> = async (
    event: ElementEvent,
  ) => {
    const { _hasAbuseReportPanelEnabled, addon, dispatch } = this.props;

    event.preventDefault();

    if (
      _hasAbuseReportPanelEnabled() &&
      // The integrated abuse report panel currently supports only extensions
      // and themes (e.g. we do only have abuse categories and related
      // localized descriptions only for these two kind of addons), and so
      // currently it is going to refuse to create an abuse report panel for
      // langpacks, dictionaries and search tools.
      [ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME].includes(addon.type)
    ) {
      dispatch(initiateAddonAbuseReportViaFirefox({ addon }));
      return;
    }

    dispatch(showAddonAbuseReportUI({ addon }));
  };

  render(): null | React.Node {
    const { abuseReport, addon, errorHandler, i18n, loading } = this.props;

    invariant(addon, 'An add-on is required');

    const enableFeatureFeedbackFormLinks = config.get(
      'enableFeatureFeedbackFormLinks',
    );

    if (abuseReport && abuseReport.message !== undefined) {
      return (
        <div className="ReportAbuseButton ReportAbuseButton--report-sent">
          <h3 className="ReportAbuseButton-header">
            {i18n.gettext('You reported this add-on')}
          </h3>

          <p className="ReportAbuseButton-first-paragraph">
            {i18n.gettext(`We have received your report. Thanks for letting us
              know about your concerns with this add-on.`)}
          </p>

          {!enableFeatureFeedbackFormLinks && (
            <p>
              {i18n.gettext(`We can't respond to every abuse report but we'll
                look into this issue.`)}
            </p>
          )}
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

    let reportButtonProps: Object = {
      onClick: this.onReportButtonClick,
    };

    // When this feature flag is active, we link to the feedback form.
    if (enableFeatureFeedbackFormLinks) {
      reportButtonProps = {
        to: `/feedback/addon/${addon.slug}/`,
      };
    }

    /* eslint-disable react/no-danger */
    return (
      <div
        className={makeClassName('ReportAbuseButton', {
          'ReportAbuseButton--is-expanded':
            abuseReport && abuseReport.uiVisible,
        })}
      >
        <div className="ReportAbuseButton--preview">
          <Button
            buttonType="neutral"
            className="ReportAbuseButton-show-more"
            disabled={loading}
            puffy
            {...reportButtonProps}
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
  withErrorHandler({ id: 'ReportAbuseButton' }),
)(ReportAbuseButtonBase);

export default ReportAbuseButton;
