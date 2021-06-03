/* @flow */
/* eslint-disable react/no-danger */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import {
  DOWNLOAD_FIREFOX_BASE_URL,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NON_RESTARTLESS_ADDON,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'amo/constants';
import { makeQueryStringWithUTM, sanitizeHTML } from 'amo/utils';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import { getVersionById } from 'amo/reducers/versions';
import { getClientCompatibility } from 'amo/utils/compatibility';
import Notice from 'amo/components/Notice';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './style.scss';

type Props = {|
  addon: AddonType | null,
  version: AddonVersionType | null,
|};

type DeafultProps = {|
  _getClientCompatibility: typeof getClientCompatibility,
  _log: typeof log,
|};

type PropsFromState = {|
  clientApp: string,
  currentVersion: AddonVersionType | null,
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...DeafultProps,
  ...PropsFromState,
  i18n: I18nType,
|};

export class AddonCompatibilityErrorBase extends React.Component<InternalProps> {
  static defaultProps: DeafultProps = {
    _log: log,
    _getClientCompatibility: getClientCompatibility,
  };

  render(): null | React.Node {
    const {
      _getClientCompatibility,
      _log,
      addon,
      clientApp,
      currentVersion,
      i18n,
      userAgentInfo,
    } = this.props;

    if (!addon) {
      return null;
    }

    const compatibility = _getClientCompatibility({
      addon,
      clientApp,
      currentVersion,
      userAgentInfo,
    });

    if (compatibility.compatible) {
      return null;
    }

    const { reason, minVersion } = compatibility;
    invariant(reason, 'reason is required');

    if (reason === INCOMPATIBLE_NOT_FIREFOX) {
      // Do not display a message for non-Firefox browsers.
      return null;
    }

    // Each of these reasons will display a warning using the
    // WrongPlatformWarning, so we do not want to display this compatibility
    // error.
    if (
      [INCOMPATIBLE_FIREFOX_FOR_IOS, INCOMPATIBLE_ANDROID_UNSUPPORTED].includes(
        reason,
      )
    ) {
      _log.info(
        'Not rendering incompatibility error along with "wrong platform" warning',
      );
      return null;
    }

    const downloadUrl = `${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM({
      utm_content: 'install-addon-button',
    })}`;

    let message;
    if (reason === INCOMPATIBLE_OVER_MAX_VERSION) {
      message = i18n.gettext(`This add-on is not compatible with your
        version of Firefox.`);
    } else if (reason === INCOMPATIBLE_NON_RESTARTLESS_ADDON) {
      message = i18n.gettext(`Your version of Firefox does not support this
          add-on because it requires a restart.`);
    } else if (reason === INCOMPATIBLE_UNSUPPORTED_PLATFORM) {
      message = i18n.gettext('This add-on is not available on your platform.');
    } else if (reason === INCOMPATIBLE_UNDER_MIN_VERSION) {
      invariant(minVersion, 'minVersion is required');
      message = i18n.sprintf(
        i18n.gettext(`This add-on requires a
        <a href="%(downloadUrl)s">newer version of Firefox</a> (at least
        version %(minVersion)s). You are using Firefox %(yourVersion)s.`),
        {
          downloadUrl,
          minVersion,
          yourVersion: userAgentInfo.browser.version,
        },
      );
    } else {
      // This is an unknown reason code and a custom error message should be
      // added.
      _log.warn(
        `Unknown reason code supplied to AddonCompatibilityError: ${reason}`,
      );

      message = i18n.sprintf(
        i18n.gettext(`Your browser does not
        support add-ons. You can <a href="%(downloadUrl)s">download Firefox</a>
        to install this add-on.`),
        { downloadUrl },
      );
    }

    return (
      <Notice type="error" className="AddonCompatibilityError">
        <span
          className="AddonCompatibilityError-message"
          dangerouslySetInnerHTML={sanitizeHTML(message, ['a'])}
        />
      </Notice>
    );
  }
}

function mapStateToProps(state: AppState, ownProps: Props): PropsFromState {
  const { addon, version } = ownProps;

  let currentVersion = version;

  if (addon && addon.currentVersionId && !currentVersion) {
    currentVersion = getVersionById({
      id: addon.currentVersionId,
      state: state.versions,
    });
  }

  return {
    clientApp: state.api.clientApp,
    currentVersion,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const AddonCompatibilityError: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonCompatibilityErrorBase);

export default AddonCompatibilityError;
