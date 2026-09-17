/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import translate from 'amo/i18n/translate';
import { isFirefoxForIOS } from 'amo/utils/compatibility';
import Notice, { warningInfoType } from 'amo/components/Notice';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  addon?: AddonType | null,
  className?: string,
  isHomePage?: boolean,
|};

type PropsFromState = {|
  userAgentInfo: UserAgentInfoType,
|};

type DefaultProps = {|
  _isFirefoxForIOS: typeof isFirefoxForIOS,
  isHomePage?: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  i18n: I18nType,
|};

export class WrongPlatformWarningBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _isFirefoxForIOS: isFirefoxForIOS,
    isHomePage: false,
  };

  render(): null | React.Node {
    const { _isFirefoxForIOS, className, i18n, userAgentInfo } = this.props;

    let message;

    if (_isFirefoxForIOS(userAgentInfo)) {
      // Firefox for iOS.
      message = i18n.gettext(`Add-ons are not compatible with Firefox for iOS.
        Try installing them on Firefox for desktop.`);
    }

    return message ? (
      <div className={makeClassName('WrongPlatformWarning', className)}>
        <Notice id="WrongPlatformWarning-Notice" type={warningInfoType}>
          <span className="WrongPlatformWarning-message">{message}</span>
        </Notice>
      </div>
    ) : null;
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
}

const WrongPlatformWarning: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(WrongPlatformWarningBase);

export default WrongPlatformWarning;
