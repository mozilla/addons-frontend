/* @flow */
import config from 'config';
import * as React from 'react';
import cookie from 'react-cookie';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Notice from 'ui/components/Notice';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'amo/store';

type Props = {||};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  _cookie: typeof cookie,
  i18n: I18nType,
  wasDismissed: boolean,
|};

export const SurveyNoticeBase = ({
  _config = config,
  _cookie = cookie,
  ...props
}: InternalProps) => {
  const { i18n, wasDismissed } = props;

  if (wasDismissed) {
    return null;
  }

  const onDismiss = () => {
    // Even though a dismissal action is dispatched here, also save a
    // cookie to manually synchronize state. The server code will load
    // the cookie and synchronize state as part of the request.
    // TODO: make this synchronization more automatic.
    // See https://github.com/mozilla/addons-frontend/issues/5617
    _cookie.save(_config.get('dismissedExperienceSurveyCookieName'), '', {
      path: '/',
    });
  };

  return (
    <Notice
      actionHref="https://qsurvey.mozilla.com/s3/addons-mozilla-org-survey"
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
  return { wasDismissed: state.survey.wasDismissed };
};

// TODO:
// - dispatch a hideSurvey event on the server if cookie
// - REVERT: hide survey when cookie says it was dismissed
// - hide survey for certain locales
// - hide/show survey from config
const SurveyNotice: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(SurveyNoticeBase);

export default SurveyNotice;
