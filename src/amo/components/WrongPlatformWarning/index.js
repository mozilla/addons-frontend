/* @flow */
import makeClassName from 'classnames';
import { withRouter } from 'react-router-dom';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import {
  CLIENT_APP_ANDROID,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import {
  correctedLocationForPlatform,
  getClientCompatibility,
  isFenix,
} from 'core/utils/compatibility';
import Notice, { warningInfoType } from 'ui/components/Notice';
import type { AppState } from 'amo/store';
import type { AddonType } from 'core/types/addons';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { AddonVersionType } from 'core/reducers/versions';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

export const FENIX_LINK_DESTINATION =
  'https://support.mozilla.org/kb/add-compatibility-firefox-preview/';

type Props = {|
  addon?: AddonType | null,
  className?: string,
  currentVersion?: AddonVersionType | null,
  fixAndroidLinkMessage?: string,
  fixFirefoxLinkMessage?: string,
  fixFenixLinkMessage?: string,
|};

type InternalProps = {|
  ...Props,
  _correctedLocationForPlatform: typeof correctedLocationForPlatform,
  _getClientCompatibility: typeof getClientCompatibility,
  _isFenix: typeof isFenix,
  clientApp: string,
  i18n: I18nType,
  location: ReactRouterLocationType,
  userAgentInfo: UserAgentInfoType,
|};

export class WrongPlatformWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _correctedLocationForPlatform: correctedLocationForPlatform,
    _getClientCompatibility: getClientCompatibility,
    _isFenix: isFenix,
  };

  render() {
    const {
      _correctedLocationForPlatform,
      _getClientCompatibility,
      _isFenix,
      addon,
      className,
      clientApp,
      currentVersion,
      i18n,
      location,
      userAgentInfo,
    } = this.props;

    let message;

    const newLocation = _correctedLocationForPlatform({
      clientApp,
      location,
      userAgentInfo,
    });

    if (_isFenix(userAgentInfo)) {
      message = i18n.sprintf(
        this.props.fixFenixLinkMessage ||
          i18n.gettext(
            `To learn about add-ons compatible with Firefox for Android,
               <a href="%(newLocation)s">click here</a>.`,
          ),
        { newLocation: FENIX_LINK_DESTINATION },
      );
    } else if (newLocation) {
      const fixAndroidLinkMessage =
        this.props.fixAndroidLinkMessage ||
        i18n.gettext(
          `To find add-ons compatible with Firefox on Android,
               <a href="%(newLocation)s">visit our mobile site</a>.`,
        );

      const fixFirefoxLinkMessage =
        this.props.fixFirefoxLinkMessage ||
        i18n.gettext(
          `To find add-ons compatible with Firefox on desktop,
               <a href="%(newLocation)s">visit our desktop site</a>.`,
        );

      message =
        clientApp === CLIENT_APP_ANDROID
          ? i18n.sprintf(fixFirefoxLinkMessage, { newLocation })
          : i18n.sprintf(fixAndroidLinkMessage, { newLocation });
    }

    // Check for an add-on that is incompatible on Android.
    if (addon && currentVersion) {
      const compatibility = _getClientCompatibility({
        addon,
        clientApp,
        currentVersion,
        userAgentInfo,
      });
      if (compatibility.reason === INCOMPATIBLE_ANDROID_UNSUPPORTED) {
        message = i18n.sprintf(
          i18n.gettext(
            `Not available on Firefox for Android. You can use this add-on with Firefox for Desktop, 
              or look for similar <a href="%(newLocation)s">Android add-ons</a>.`,
          ),
          { newLocation: '/android/' },
        );
      }
    }

    return message ? (
      <div className={makeClassName('WrongPlatformWarning', className)}>
        <Notice id="WrongPlatformWarning-Notice" type={warningInfoType}>
          <span
            className="WrongPlatformWarning-message"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeHTML(message, ['a'])}
          />
        </Notice>
      </div>
    ) : null;
  }
}

export function mapStateToProps(state: AppState) {
  return {
    clientApp: state.api.clientApp,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const WrongPlatformWarning: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(WrongPlatformWarningBase);

export default WrongPlatformWarning;
