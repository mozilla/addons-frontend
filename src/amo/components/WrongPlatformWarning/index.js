/* @flow */
import makeClassName from 'classnames';
import { withRouter } from 'react-router-dom';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { CLIENT_APP_ANDROID } from 'core/constants';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import {
  correctedLocationForPlatform,
  isFenix,
} from 'core/utils/compatibility';
import Notice, { warningInfoType } from 'ui/components/Notice';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

// TODO: Update this to the correct SUMO article.
export const FENIX_LINK_DESTINATION = 'https://support.mozilla.org/kb/';

type Props = {|
  className?: string,
  fixAndroidLinkMessage?: string,
  fixFirefoxLinkMessage?: string,
  fixFenixLinkMessage?: string,
|};

type InternalProps = {|
  ...Props,
  _correctedLocationForPlatform: typeof correctedLocationForPlatform,
  _isFenix: typeof isFenix,
  clientApp: string,
  i18n: I18nType,
  location: ReactRouterLocationType,
  userAgentInfo: UserAgentInfoType,
|};

export class WrongPlatformWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _correctedLocationForPlatform: correctedLocationForPlatform,
    _isFenix: isFenix,
  };

  render() {
    const {
      _correctedLocationForPlatform,
      _isFenix,
      className,
      clientApp,
      i18n,
      location,
      userAgentInfo,
    } = this.props;

    let message;

    if (_isFenix(userAgentInfo)) {
      message = i18n.sprintf(
        this.props.fixFenixLinkMessage ||
          i18n.gettext(
            `To find add-ons compatible with Firefox on Android,
               <a href="%(newLocation)s">click here</a>.`,
          ),
        { newLocation: FENIX_LINK_DESTINATION },
      );
    } else {
      const newLocation = _correctedLocationForPlatform({
        clientApp,
        location,
        userAgentInfo,
      });

      if (!newLocation) {
        return null;
      }

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

    return (
      <div className={makeClassName('WrongPlatformWarning', className)}>
        <Notice id="WrongPlatformWarning-Notice" type={warningInfoType}>
          <span
            className="WrongPlatformWarning-message"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeHTML(message, ['a'])}
          />
        </Notice>
      </div>
    );
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
