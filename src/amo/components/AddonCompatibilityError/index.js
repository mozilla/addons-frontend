/* @flow */
/* eslint-disable react/no-danger */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { makeQueryStringWithUTM } from 'amo/utils';
import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NON_RESTARTLESS_ADDON,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'core/constants';
import _log from 'core/logger';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Notice from 'ui/components/Notice';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'amo/store';

import './style.scss';

type Props = {|
  downloadUrl?: string,
  log: typeof _log,
  minVersion: string | null,
  reason: string | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  userAgentInfo: UserAgentInfoType,
|};

export class AddonCompatibilityErrorBase extends React.Component<InternalProps> {
  static defaultProps = {
    downloadUrl: 'https://www.mozilla.org/firefox/new/',
    log: _log,
  };

  render() {
    const {
      i18n,
      log,
      minVersion,
      reason,
      userAgentInfo,
      downloadUrl,
    } = this.props;

    invariant(downloadUrl, 'downloadUrl is required');

    const _downloadUrl = `${downloadUrl}${makeQueryStringWithUTM({
      utm_content: 'install-addon-button',
    })}`;

    if (typeof reason === 'undefined') {
      throw new Error('AddonCompatibilityError requires a "reason" prop');
    }
    if (typeof minVersion === 'undefined') {
      throw new Error('minVersion is required; it cannot be undefined');
    }

    let message;
    if (reason === INCOMPATIBLE_NOT_FIREFOX) {
      message = i18n.sprintf(
        i18n.gettext(`You need to
        <a href="%(_downloadUrl)s">download Firefox</a> to install this
        add-on.`),
        { _downloadUrl },
      );
    } else if (reason === INCOMPATIBLE_OVER_MAX_VERSION) {
      message = i18n.gettext(`This add-on is not compatible with your
        version of Firefox.`);
    } else if (reason === INCOMPATIBLE_NO_OPENSEARCH) {
      message = i18n.gettext(
        'Your version of Firefox does not support search plugins.',
      );
    } else if (reason === INCOMPATIBLE_NON_RESTARTLESS_ADDON) {
      message = i18n.gettext(`Your version of Firefox does not support this
          add-on because it requires a restart.`);
    } else if (reason === INCOMPATIBLE_FIREFOX_FOR_IOS) {
      message = i18n.gettext(
        'Firefox for iOS does not currently support add-ons.',
      );
    } else if (reason === INCOMPATIBLE_UNSUPPORTED_PLATFORM) {
      message = i18n.gettext('This add-on is not available on your platform.');
    } else if (reason === INCOMPATIBLE_UNDER_MIN_VERSION) {
      message = i18n.sprintf(
        i18n.gettext(`This add-on requires a
        <a href="%(_downloadUrl)s">newer version of Firefox</a> (at least
        version %(minVersion)s). You are using Firefox %(yourVersion)s.`),
        {
          _downloadUrl,
          minVersion,
          yourVersion: userAgentInfo.browser.version,
        },
      );
    } else {
      // This is an unknown reason code and a custom error message should be
      // added.
      log.warn(
        `Unknown reason code supplied to AddonCompatibilityError: ${reason}`,
      );

      message = i18n.sprintf(
        i18n.gettext(`Your browser does not
        support add-ons. You can <a href="%(_downloadUrl)s">download Firefox</a>
        to install this add-on.`),
        { _downloadUrl },
      );
    }

    // Make the "you should download firefox" error message less scary than
    // the rest of them: https://github.com/mozilla/addons-frontend/issues/4547
    const noticeType =
      reason === INCOMPATIBLE_NOT_FIREFOX ? 'firefox' : 'error';

    return (
      <Notice type={noticeType} className="AddonCompatibilityError">
        <span dangerouslySetInnerHTML={sanitizeHTML(message, ['a'])} />
      </Notice>
    );
  }
}

export function mapStateToProps(state: AppState) {
  return { userAgentInfo: state.api.userAgentInfo };
}

const AddonCompatibilityError: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonCompatibilityErrorBase);

export default AddonCompatibilityError;
