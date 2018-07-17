/* @flow */
import querystring from 'querystring';

import config from 'config';
import * as React from 'react';
import cookie from 'react-cookie';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { dismissSurvey } from 'core/reducers/survey';
import Notice from 'ui/components/Notice';
import type { ReactRouterLocation } from 'core/types/router';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { AppState } from 'amo/store';

import './styles.scss';

type Props = {|
  location: ReactRouterLocation,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _cookie: typeof cookie,
  _supportedLangs: Array<string>,
  dispatch: DispatchFunc,
  i18n: I18nType,
  siteLang: string,
  wasDismissed: boolean,
|};

export const SurveyNoticeBase = ({
  _config = config,
  _cookie = cookie,
  _supportedLangs = [
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
  ...props
}: InternalProps) => {
  const { dispatch, i18n, location, siteLang, wasDismissed } = props;

  if (
    wasDismissed ||
    !_supportedLangs.includes(siteLang) ||
    !_config.get('enableExperienceSurvey')
  ) {
    return null;
  }

  const onDismiss = () => {
    dispatch(dismissSurvey());
    // Even though a dismissal action is dispatched here, also save a
    // cookie to manually synchronize state. The server code will load
    // the cookie and synchronize state as part of the request.
    // TODO: make this synchronization more automatic.
    // See https://github.com/mozilla/addons-frontend/issues/5617
    _cookie.save(_config.get('dismissedExperienceSurveyCookieName'), '', {
      // Expire 180 days from now. This value is in seconds.
      maxAge: 24 * 60 * 60 * 180,
      path: '/',
    });
  };

  // Pass along a source derived from the current URL path but with
  // the preceding language path removed.
  const source = querystring.stringify({
    source: location.pathname
      .split('/')
      .slice(2)
      .join('/'),
  });
  const surveyUrl = `https://qsurvey.mozilla.com/s3/addons-mozilla-org-survey?${source}`;

  return (
    <Notice
      actionHref={surveyUrl}
      actionOnClick={onDismiss}
      actionTarget="_blank"
      actionText={i18n.gettext('Take short survey')}
      className="SurveyNotice"
      dismissible
      id="amo-experience-survey"
      onDismiss={onDismiss}
      type="generic"
    >
      {i18n.gettext(
        'Thanks for visiting this site! Please take a minute or two to tell Firefox about your experience.',
      )}
    </Notice>
  );
};

const mapStateToProps = (state: AppState) => {
  return { siteLang: state.api.lang, wasDismissed: state.survey.wasDismissed };
};

const SurveyNotice: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(SurveyNoticeBase);

export default SurveyNotice;
