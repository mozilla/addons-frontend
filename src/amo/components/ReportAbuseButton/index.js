/* @flow */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import { connect } from 'react-redux';
import Textarea from 'react-textarea-autosize';
import { compose } from 'redux';

import { withErrorHandler } from 'core/errorHandler';
import type { ErrorHandlerType } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import {
  disableAbuseButtonUI,
  enableAbuseButtonUI,
  hideAddonAbuseReportUI,
  sendAddonAbuseReport,
  showAddonAbuseReportUI,
} from 'core/reducers/abuse';
import { sanitizeHTML } from 'core/utils';
import Button from 'ui/components/Button';
import type { AddonAbuseState, AbuseState } from 'core/reducers/abuse';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  abuseReport: AddonAbuseState,
  addon: AddonType,
  dispatch: Function,
  errorHandler: ErrorHandlerType,
  loading: bool,
  i18n: I18nType,
|};

export class ReportAbuseButtonBase extends React.Component<Props> {
  textarea: React.ElementRef<typeof Textarea>;

  dismissReportUI = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    const { addon, dispatch, loading } = this.props;

    if (loading) {
      log.debug(
        "Ignoring dismiss click because we're submitting the abuse report");
      return;
    }

    dispatch(hideAddonAbuseReportUI({ addon }));
  }

  sendReport = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    // The button isn't clickable if there is no content, but just in case:
    // we verify there's a message to send.
    if (!this.textarea.value.length) {
      log.debug(oneLine`User managed to click submit button while textarea
        was empty. Ignoring this onClick/sendReport event.`);
      return;
    }

    const { addon, dispatch, errorHandler } = this.props;

    dispatch(sendAddonAbuseReport({
      addonSlug: addon.slug,
      errorHandlerId: errorHandler.id,
      message: this.textarea.value,
    }));
  }

  showReportUI = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    const { addon, dispatch } = this.props;

    dispatch(showAddonAbuseReportUI({ addon }));
    this.textarea.focus();
  }

  textareaChange = () => {
    const { abuseReport, addon, dispatch } = this.props;

    // Don't dispatch the UI update if the button is already visible.
    // We also test for `value.trim()` so the user can't submit an
    // empty report full of spaces.
    if (this.textarea.value.trim().length && !abuseReport.buttonEnabled) {
      dispatch(enableAbuseButtonUI({ addon }));
    } else if (!this.textarea.value.trim().length) {
      dispatch(disableAbuseButtonUI({ addon }));
    }
  }

  render() {
    const { abuseReport, addon, errorHandler, i18n, loading } = this.props;

    if (!addon) {
      return null;
    }

    if (abuseReport && abuseReport.message) {
      return (
        <div className="ReportAbuseButton ReportAbuseButton--report-sent">
          <h3 className="ReportAbuseButton-header">
            {i18n.gettext('You reported this add-on for abuse')}
          </h3>

          <p className="ReportAbuseButton-first-paragraph">
            {i18n.gettext(
              `We have received your report. Thanks for letting us know about
              your concerns with this add-on.`
            )}
          </p>

          <p>
            {i18n.gettext(
              `We can't respond to every abuse report but we'll look into
              this issue.`
            )}
          </p>
        </div>
      );
    }

    const sendButtonIsDisabled = loading || !abuseReport.buttonEnabled;

    const prefaceText = i18n.sprintf(i18n.gettext(
      `If you think this add-on violates
      %(linkTagStart)sMozilla's add-on policies%(linkTagEnd)s or has
      security or privacy issues, please report these issues to Mozilla using
      this form.`
    ), {
      linkTagStart: '<a href="https://developer.mozilla.org/en-US/Add-ons/AMO/Policy">',
      linkTagEnd: '</a>',
    });

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
            className="ReportAbuseButton-show-more Button--report Button--fullwidth"
            onClick={this.showReportUI}
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
              add-on developer.`)}
          </p>

          {errorHandler.renderErrorIfPresent()}

          <Textarea
            className="ReportAbuseButton-textarea"
            disabled={loading}
            inputRef={(ref) => { this.textarea = ref; }}
            onChange={this.textareaChange}
            placeholder={i18n.gettext(
              'Explain how this add-on is violating our policies.'
            )}
          />

          <div className="ReportAbuseButton-buttons">
            <a
              className={makeClassName('ReportAbuseButton-dismiss-report', {
                'ReportAbuseButton-dismiss-report--disabled': loading,
              })}
              href="#cancel"
              onClick={this.dismissReportUI}
            >
              {i18n.gettext('Dismiss')}
            </a>
            <Button
              className="ReportAbuseButton-send-report Button--report Button--small"
              disabled={sendButtonIsDisabled}
              onClick={this.sendReport}
            >
              {loading ?
                i18n.gettext('Sending abuse report') :
                i18n.gettext('Send abuse report')}
            </Button>
          </div>
        </div>
      </div>
    );
    /* eslint-enable react/no-danger */
  }
}

export const mapStateToProps = (
  state: {| abuse: AbuseState |}, ownProps: Props
) => {
  const { addon } = ownProps;

  return {
    abuseReport: addon && state.abuse.bySlug[addon.slug] ?
      state.abuse.bySlug[addon.slug] : {},
    loading: state.abuse.loading,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'ReportAbuseButton' }),
)(ReportAbuseButtonBase);
