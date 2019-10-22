/* @flow */
import makeClassName from 'classnames';
import { withRouter } from 'react-router-dom';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { CLIENT_APP_ANDROID } from 'core/constants';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import { correctedLocationForPlatform } from 'core/utils/compatibility';
import Notice, { warningInfoType } from 'ui/components/Notice';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  className?: string,
  forAddonDetailPage?: boolean,
|};

type InternalProps = {|
  ...Props,
  _correctedLocationForPlatform: typeof correctedLocationForPlatform,
  clientApp: string,
  i18n: I18nType,
  location: ReactRouterLocationType,
  userAgentInfo: UserAgentInfoType,
|};

export class WrongPlatformWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _correctedLocationForPlatform: correctedLocationForPlatform,
    forAddonDetailPage: false,
  };

  render() {
    const {
      _correctedLocationForPlatform,
      className,
      clientApp,
      forAddonDetailPage,
      i18n,
      location,
      userAgentInfo,
    } = this.props;

    const newLocation = _correctedLocationForPlatform({
      clientApp,
      location,
      userAgentInfo,
    });

    if (!newLocation) {
      return null;
    }

    let message;

    if (forAddonDetailPage) {
      message =
        clientApp === CLIENT_APP_ANDROID
          ? i18n.sprintf(
              i18n.gettext(
                `This add-on is not compatible with this platform.
               <a href="%(newLocation)s">Browse add-ons for Firefox on desktop</a>.`,
              ),
              { newLocation },
            )
          : i18n.sprintf(
              i18n.gettext(
                `This add-on is not compatible with this platform.
               <a href="%(newLocation)s">Browse add-ons for Firefox on Android</a>.`,
              ),
              { newLocation },
            );
    } else {
      message =
        clientApp === CLIENT_APP_ANDROID
          ? i18n.sprintf(
              i18n.gettext(
                `To find add-ons compatible with Firefox on desktop,
               <a href="%(newLocation)s">visit our desktop site</a>.`,
              ),
              { newLocation },
            )
          : i18n.sprintf(
              i18n.gettext(
                `To find add-ons compatible with Firefox on Android,
               <a href="%(newLocation)s">visit our mobile site</a>.`,
              ),
              { newLocation },
            );
    }

    return (
      <div className={makeClassName('WrongPlatformWarning', className)}>
        <Notice
          dismissible
          id="WrongPlatformWarning-Notice"
          type={warningInfoType}
        >
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
