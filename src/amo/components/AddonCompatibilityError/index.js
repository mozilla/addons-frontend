/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { makeQueryStringWithUTM } from 'amo/utils';
import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'core/constants';
import _log from 'core/logger';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Notice from 'ui/components/Notice';

import './style.scss';


export class AddonCompatibilityErrorBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    log: PropTypes.object,
    minVersion: PropTypes.string.isRequired,
    reason: PropTypes.string.isRequired,
    userAgentInfo: PropTypes.object,
  }

  static defaultProps = {
    log: _log,
    userAgentInfo: {},
  }

  render() {
    const {
      i18n,
      log,
      minVersion,
      reason,
      userAgentInfo,
    } = this.props;

    const queryString = makeQueryStringWithUTM({
      utm_content: 'install-addon-button',
    });
    const downloadUrl = `https://www.mozilla.org/firefox/new/${queryString}`;

    if (typeof reason === 'undefined') {
      throw new Error('AddonCompatibilityError requires a "reason" prop');
    }
    if (typeof minVersion === 'undefined') {
      throw new Error('minVersion is required; it cannot be undefined');
    }

    let message;
    if (reason === INCOMPATIBLE_NOT_FIREFOX) {
      message = i18n.sprintf(i18n.gettext(`You need to
        <a href="%(downloadUrl)s">download Firefox</a> to install this
        add-on.`
      ), { downloadUrl });
    } else if (reason === INCOMPATIBLE_OVER_MAX_VERSION) {
      message = i18n.gettext(`This add-on is not compatible with your
        version of Firefox.`);
    } else if (reason === INCOMPATIBLE_NO_OPENSEARCH) {
      message = i18n.gettext(
        'Your version of Firefox does not support search plugins.');
    } else if (reason === INCOMPATIBLE_FIREFOX_FOR_IOS) {
      message = i18n.gettext(
        'Firefox for iOS does not currently support add-ons.');
    } else if (reason === INCOMPATIBLE_UNSUPPORTED_PLATFORM) {
      message = i18n.gettext(
        'This add-on is not available on your platform.');
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
      <Notice type="error" className="AddonCompatibilityError">
        <span dangerouslySetInnerHTML={sanitizeHTML(message, ['a'])} />
      </Notice>
    );
  }
}

export function mapStateToProps(state) {
  return { userAgentInfo: state.api.userAgentInfo };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonCompatibilityErrorBase);
