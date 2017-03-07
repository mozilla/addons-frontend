/* eslint-disable react/no-danger */
import { oneLine } from 'common-tags';
import mozCompare from 'mozilla-version-comparator';
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import UAParser from 'ua-parser-js';

import translate from 'core/i18n/translate';
import {
  isCompatibleWithUserAgent as _isCompatibleWithUserAgent,
  sanitizeHTML,
} from 'core/utils';

import './AddonCompatibility.scss';


export class AddonCompatibilityBase extends React.Component {
  static propTypes = {
    isCompatibleWithUserAgent: PropTypes.func,
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    maxVersion: PropTypes.string.isRequired,
    minVersion: PropTypes.string.isRequired,
    userAgent: PropTypes.string.isRequired,
  }

  static defaultProps = {
    isCompatibleWithUserAgent: _isCompatibleWithUserAgent,
  }

  render() {
    const {
      i18n,
      isCompatibleWithUserAgent,
      lang,
      maxVersion,
      minVersion,
      userAgent,
    } = this.props;

    const downloadUrl = `https://www.mozilla.org/${lang}/firefox/`;
    const isCompatible = isCompatibleWithUserAgent({
      maxVersion, minVersion, userAgent });

    // If this add-on is compatible with the user agent, there is no
    // info to explain.
    if (isCompatible) {
      return null;
    }

    const { browser, os } = UAParser(userAgent);
    let reason = i18n.gettext('Add-ons are not compatible with your browser.');

    if (browser.name !== 'Firefox') {
      reason = i18n.sprintf(i18n.gettext(oneLine`You need to
        <a href="%(downloadUrl)s">download Firefox</a> to install this add-on.`
      ), { downloadUrl });
    } else if (maxVersion && mozCompare(browser.version, maxVersion) === 1) {
      // The browser can be Firefox but the version may be incompatible or the
      // client is running on an unsupported OS (e.g. iOS).
      reason = i18n.sprintf(i18n.gettext(oneLine`This add-on is only compatible
        with older versions of Firefox (up to version %(maxVersion)s). You are
        using Firefox %(yourVersion)s.`
      ), {
        maxVersion,
        yourVersion: browser.version,
      });
    } else if (minVersion && mozCompare(browser.version, minVersion) === -1) {
      reason = i18n.sprintf(i18n.gettext(oneLine`This add-on requires a
        <a href="%(downloadUrl)s">newer version of Firefox</a> (at least
        version %(minVersion)s). You are using Firefox %(yourVersion)s.`
      ), {
        downloadUrl,
        minVersion,
        yourVersion: browser.version,
      });
    }

    if (os.name === 'iOS') {
      reason = i18n.gettext(
        'Firefox for iOS does not currently support add-ons.');
    }

    return (
      <div className="AddonCompatibility"
        dangerouslySetInnerHTML={sanitizeHTML(reason, ['a'])} />
    );
  }
}

export function mapStateToProps(state) {
  return { lang: state.api.lang };
}

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonCompatibilityBase);
