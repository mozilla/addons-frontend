/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import type { AppState } from 'amo/store';
import { ADDON_TYPE_EXTENSION, CLIENT_APP_FIREFOX } from 'core/constants';
import translate from 'core/i18n/translate';
import {
  correctedLocationForPlatform,
  isFirefox,
} from 'core/utils/compatibility';
import Notice, { genericWarningType } from 'ui/components/Notice';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  _correctedLocationForPlatform: typeof correctedLocationForPlatform,
  _couldShowWarning?: () => boolean,
  clientApp: string,
  className?: string,
  i18n: I18nType,
  location: ReactRouterLocationType,
  userAgentInfo: UserAgentInfoType,
|};

export const VARIANT_INCLUDE_WARNING_PROPOSED = 'includeWarning-proposed';
const WARNING_LINK_DESTINATION =
  'https://support.mozilla.org/kb/recommended-extensions-program#w_what-are-the-risks-of-installing-non-recommended-extensions';

export class InstallWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _correctedLocationForPlatform: correctedLocationForPlatform,
  };

  couldShowWarning = () => {
    const {
      _correctedLocationForPlatform,
      _couldShowWarning,
      addon,
      clientApp,
      location,
      userAgentInfo,
    } = this.props;

    // Do not show this warning if we are also going to show a WrongPlatformWarning.
    const correctedLocation = _correctedLocationForPlatform({
      clientApp,
      location,
      userAgentInfo,
    });

    return _couldShowWarning
      ? _couldShowWarning()
      : !correctedLocation &&
          isFirefox({ userAgentInfo }) &&
          clientApp === CLIENT_APP_FIREFOX &&
          addon.type === ADDON_TYPE_EXTENSION &&
          !addon.isRecommended;
  };

  render() {
    const { className, i18n } = this.props;

    if (this.couldShowWarning()) {
      return (
        <Notice
          actionHref={WARNING_LINK_DESTINATION}
          actionTarget="_blank"
          actionText={i18n.gettext('Learn more')}
          className={makeClassName('InstallWarning', className)}
          type={genericWarningType}
        >
          {i18n.gettext(
            `This is not monitored for security through Mozilla's Recommended Extensions program. Make sure you trust it before installing.`,
          )}
        </Notice>
      );
    }
    return null;
  }
}

export const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
    userAgentInfo: state.api.userAgentInfo,
  };
};

const InstallWarning: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(InstallWarningBase);

export default InstallWarning;
