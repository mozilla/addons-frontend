/* eslint-disable react/no-danger */
import { oneLine } from 'common-tags';
import mozCompare from 'mozilla-version-comparator';
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import translate from 'core/i18n/translate';
import _log from 'core/logger';
import { isCompatibleWithUserAgent, sanitizeHTML } from 'core/utils';

import './style.scss';


export class AddonCompatibilityErrorBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    log: PropTypes.object,
    maxVersion: PropTypes.string.isRequired,
    minVersion: PropTypes.string.isRequired,
    userAgentInfo: PropTypes.object.isRequired,
  }

  static defaultProps = {
    log: _log,
  }

  render() {
    const {
      i18n, lang, log, maxVersion, minVersion, userAgentInfo,
    } = this.props;
    const { reason } = isCompatibleWithUserAgent({
      maxVersion, minVersion, userAgentInfo });
    const downloadUrl = `https://www.mozilla.org/${lang}/firefox/`;
    let message;

    if (reason === INCOMPATIBLE_NOT_FIREFOX) {
      message = i18n.sprintf(i18n.gettext(oneLine`You need to
        <a href="%(downloadUrl)s">download Firefox</a> to install this add-on.`
      ), { downloadUrl });
    } else if (reason === INCOMPATIBLE_OVER_MAX_VERSION) {
      // The browser can be Firefox but the version may be incompatible or the
      // client is running on an unsupported OS (e.g. iOS).
      message = i18n.sprintf(i18n.gettext(oneLine`This add-on is only compatible
        with older versions of Firefox (up to version %(maxVersion)s). You are
        using Firefox %(yourVersion)s.`
      ), {
        maxVersion,
        yourVersion: userAgentInfo.browser.version,
      });
    } else if (reason === INCOMPATIBLE_UNDER_MIN_VERSION) {
      message = i18n.sprintf(i18n.gettext(oneLine`This add-on requires a
        <a href="%(downloadUrl)s">newer version of Firefox</a> (at least
        version %(minVersion)s). You are using Firefox %(yourVersion)s.`
      ), {
        downloadUrl,
        minVersion,
        yourVersion: userAgentInfo.browser.version,
      });
    } else if (reason === INCOMPATIBLE_FIREFOX_FOR_IOS) {
      message = i18n.gettext(
        'Firefox for iOS does not currently support add-ons.');
    } else {
      log.warn(oneLine`Component AddonCompatibilityError was used but there
        was no reason to mark the add-on as incompatible with this userAgent`,
        userAgentInfo);
    }

    return (
      <div className="AddonCompatibilityError"
        dangerouslySetInnerHTML={sanitizeHTML(message, ['a'])} />
    );
  }
}

export function mapStateToProps(state) {
  return { lang: state.api.lang, userAgentInfo: state.api.userAgentInfo };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonCompatibilityErrorBase);
