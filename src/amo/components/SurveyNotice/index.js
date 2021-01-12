/* @flow */
import config from 'config';
import * as React from 'react';
import { withCookies, Cookies } from 'react-cookie';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import { dismissSurvey } from 'amo/reducers/survey';
import {
  SURVEY_ACTION_DISMISSED,
  SURVEY_ACTION_SHOWN,
  SURVEY_ACTION_VISITED,
  SURVEY_CATEGORY,
} from 'amo/constants';
import tracking from 'amo/tracking';
import { addQueryParams } from 'amo/utils/url';
import Notice from 'ui/components/Notice';
import type { ReactRouterLocationType } from 'amo/types/router';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { AppState } from 'amo/store';

import './styles.scss';

type Props = {|
  location: ReactRouterLocationType,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _supportedLangs: Array<string>,
  _tracking: typeof tracking,
  cookies: typeof Cookies,
  dispatch: DispatchFunc,
  i18n: I18nType,
  siteLang: string,
  wasDismissed: boolean,
|};

export class SurveyNoticeBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
    _supportedLangs: [
      'de',
      'en-US',
      'es',
      'fr',
      'ja',
      'pl',
      'pt-BR',
      'ru',
      'zh-CN',
      'zh-TW',
    ],
    _tracking: tracking,
  };

  track(action: string) {
    this.props._tracking.sendEvent({
      action,
      category: SURVEY_CATEGORY,
    });
  }

  componentDidMount() {
    if (this.shouldShowNotice()) {
      this.track(SURVEY_ACTION_SHOWN);
    }
  }

  shouldShowNotice() {
    const { _config, _supportedLangs, siteLang, wasDismissed } = this.props;
    return (
      _config.get('enableFeatureExperienceSurvey') &&
      !wasDismissed &&
      _supportedLangs.includes(siteLang)
    );
  }

  dismissNotice = () => {
    const { _config, cookies, dispatch } = this.props;
    dispatch(dismissSurvey());
    // Even though a dismissal action is dispatched here, also save a
    // cookie to manually synchronize state. The server code will load
    // the cookie and synchronize state as part of the request.
    // TODO: make this synchronization more automatic.
    // See https://github.com/mozilla/addons-frontend/issues/5617
    cookies.set(_config.get('dismissedExperienceSurveyCookieName'), '', {
      // Expire 180 days from now. This value is in seconds.
      maxAge: 24 * 60 * 60 * 180,
      path: '/',
    });
  };

  onDismiss = () => {
    this.dismissNotice();
    this.track(SURVEY_ACTION_DISMISSED);
  };

  onClickSurveyLink = () => {
    this.dismissNotice();
    this.track(SURVEY_ACTION_VISITED);
  };

  render() {
    const { i18n, location } = this.props;

    if (!this.shouldShowNotice()) {
      return null;
    }

    // Pass along a source derived from the current URL path but with
    // the preceding language path removed.
    const surveyUrl = addQueryParams(
      'https://qsurvey.mozilla.com/s3/addons-mozilla-org-survey',
      {
        source: location.pathname.split('/').slice(2).join('/'),
      },
    );

    return (
      <Notice
        actionHref={surveyUrl}
        actionOnClick={this.onClickSurveyLink}
        actionTarget="_blank"
        actionText={i18n.gettext('Take short survey')}
        againstGrey20
        className="SurveyNotice"
        dismissible
        id="amo-experience-survey"
        onDismiss={this.onDismiss}
        type="generic"
      >
        {i18n.gettext(
          'Thanks for visiting this site! Please take a minute or two to tell Firefox about your experience.',
        )}
      </Notice>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return { siteLang: state.api.lang, wasDismissed: state.survey.wasDismissed };
};

const SurveyNotice: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withCookies,
)(SurveyNoticeBase);

export default SurveyNotice;
