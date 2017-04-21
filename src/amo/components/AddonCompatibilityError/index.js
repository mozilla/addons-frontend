/* eslint-disable react/no-danger */
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import _log from 'core/logger';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';

import './style.scss';


export class AddonCompatibilityErrorBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    log: PropTypes.object,
    minVersion: PropTypes.string.isRequired,
    reason: PropTypes.string.isRequired,
    userAgentInfo: PropTypes.object.isRequired,
  }

  static defaultProps = {
    log: _log,
    userAgentInfo: {},
  }

  render() {
    const {
      i18n,
      lang,
      log,
      minVersion,
      reason,
      userAgentInfo,
    } = this.props;
    const downloadUrl = `https://www.mozilla.org/${lang}/firefox/`;
    let message;

    if (typeof reason === 'undefined') {
      throw new Error('AddonCompatibilityError requires a "reason" prop');
    }
    if (typeof minVersion === 'undefined') {
      throw new Error('minVersion is required; it cannot be undefined');
    }

    if (reason === INCOMPATIBLE_NOT_FIREFOX) {
      message = i18n.sprintf(i18n.gettext(`You need to
        <a href="%(downloadUrl)s">download Firefox</a> to install this add-on.`
      ), { downloadUrl });
    } else if (reason === INCOMPATIBLE_NO_OPENSEARCH) {
      message = i18n.gettext(
        'Your version of Firefox does not support search plugins.');
    } else if (reason === INCOMPATIBLE_FIREFOX_FOR_IOS) {
      message = i18n.gettext(
        'Firefox for iOS does not currently support add-ons.');
    } else if (reason === INCOMPATIBLE_UNDER_MIN_VERSION) {
      message = i18n.sprintf(i18n.gettext(`This add-on requires a
        <a href="%(downloadUrl)s">newer version of Firefox</a> (at least
        version %(minVersion)s). You are using Firefox %(yourVersion)s.`
      ), {
        downloadUrl,
        minVersion,
        yourVersion: userAgentInfo.browser.version,
      });
    } else {
      // This is an unknown reason code and a custom error message should
      // be added.
      log.warn(
        'Unknown reason code supplied to AddonCompatibilityError', reason);

      message = i18n.sprintf(i18n.gettext(`Your browser does not
        support add-ons. You can <a href="%(downloadUrl)s">download Firefox</a>
        to install this add-on.`
      ), { downloadUrl });
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
