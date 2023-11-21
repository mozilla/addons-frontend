/* @flow */
import makeClassName from 'classnames';
import { withRouter } from 'react-router-dom';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import translate from 'amo/i18n/translate';
import { sanitizeHTML } from 'amo/utils';
import {
  correctedLocationForPlatform,
  getMobileHomepageLink,
  isFirefoxForAndroid,
  isFirefoxForIOS,
} from 'amo/utils/compatibility';
import Notice, { warningInfoType } from 'amo/components/Notice';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  addon?: AddonType | null,
  className?: string,
  isHomePage?: boolean,
|};

type PropsFromState = {|
  clientApp: string,
  lang: string,
  userAgentInfo: UserAgentInfoType,
|};

type DefaultProps = {|
  _correctedLocationForPlatform: typeof correctedLocationForPlatform,
  _isFirefoxForAndroid: typeof isFirefoxForAndroid,
  _isFirefoxForIOS: typeof isFirefoxForIOS,
  isHomePage?: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export class WrongPlatformWarningBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _correctedLocationForPlatform: correctedLocationForPlatform,
    _isFirefoxForAndroid: isFirefoxForAndroid,
    _isFirefoxForIOS: isFirefoxForIOS,
    isHomePage: false,
  };

  render(): null | React.Node {
    const {
      _correctedLocationForPlatform,
      _isFirefoxForAndroid,
      _isFirefoxForIOS,
      addon,
      className,
      clientApp,
      i18n,
      isHomePage,
      lang,
      location,
      userAgentInfo,
    } = this.props;

    let message;

    const newLocation = _correctedLocationForPlatform({
      clientApp,
      isHomePage,
      lang,
      location,
      userAgentInfo,
    });

    if (_isFirefoxForIOS(userAgentInfo)) {
      // Firefox for iOS.
      message = i18n.gettext(
        `Add-ons are not compatible with Firefox for iOS. Try installing them on Firefox for desktop.`,
      );
    } else if (
      _isFirefoxForAndroid(userAgentInfo) &&
      addon?.isAndroidCompatible
    ) {
      // Compatible with Fenix add-on detail page. No notice required.
      message = null;
    } else if (newLocation === getMobileHomepageLink(lang)) {
      // Redirecting to mobile home page.
      message = i18n.sprintf(
        i18n.gettext(
          `To find add-ons compatible with Firefox for Android,
               <a href="%(newLocation)s">click here</a>.`,
        ),
        { newLocation },
      );
    } else if (addon && newLocation) {
      // User with desktop browser looking at detail page on mobile site.
      message = i18n.sprintf(
        `This listing is not intended for this platform.
        <a href="%(newLocation)s">Browse add-ons for Firefox on desktop</a>.`,
        { newLocation },
      );
    } else if (newLocation) {
      // Redirecting to new page on the desktop site.
      message = i18n.sprintf(
        `To find add-ons compatible with Firefox on desktop,
               <a href="%(newLocation)s">visit our desktop site</a>.`,
        { newLocation },
      );
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

function mapStateToProps(state: AppState): PropsFromState {
  return {
    clientApp: state.api.clientApp,
    lang: state.api.lang,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const WrongPlatformWarning: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(WrongPlatformWarningBase);

export default WrongPlatformWarning;
