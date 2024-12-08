/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import type { AppState } from 'amo/store';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import {
  ADDON_TYPE_EXTENSION,
  EXCLUDE_WARNING_CATEGORIES,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { getPromotedCategories } from 'amo/utils/addons';
import {
  correctedLocationForPlatform,
  isFirefox,
} from 'amo/utils/compatibility';
import Notice, { genericWarningType } from 'amo/components/Notice';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type PropsFromState = {|
  clientApp: string,
  lang: string,
  userAgentInfo: UserAgentInfoType,
|};

type DefaultProps = {|
  _correctedLocationForPlatform: typeof correctedLocationForPlatform,
  _getPromotedCategories: typeof getPromotedCategories,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  ...DefaultProps,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export const VARIANT_INCLUDE_WARNING_PROPOSED = 'includeWarning-proposed';
const WARNING_LINK_DESTINATION = getPromotedBadgesLinkUrl({
  utm_content: 'install-warning',
});

export class InstallWarningBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _correctedLocationForPlatform: correctedLocationForPlatform,
    _getPromotedCategories: getPromotedCategories,
  };

  couldShowWarning: () => boolean = () => {
    const {
      _correctedLocationForPlatform,
      _getPromotedCategories,
      addon,
      clientApp,
      lang,
      location,
      userAgentInfo,
    } = this.props;

    // Do not show this warning if we are also going to show a WrongPlatformWarning.
    const correctedLocation = _correctedLocationForPlatform({
      clientApp,
      lang,
      location,
      userAgentInfo,
    });

    const promotedCategories = _getPromotedCategories({
      addon,
      clientApp,
    });

    return (
      !correctedLocation &&
      isFirefox({ userAgentInfo }) &&
      addon.type === ADDON_TYPE_EXTENSION &&
      promotedCategories.every(
        (promoted) => !EXCLUDE_WARNING_CATEGORIES.includes(promoted),
      )
    );
  };

  render(): null | React.Node {
    const { i18n } = this.props;

    if (this.couldShowWarning()) {
      return (
        <Notice
          actionHref={WARNING_LINK_DESTINATION}
          actionTarget="_blank"
          actionText={i18n.gettext('Learn more')}
          className="InstallWarning"
          type={genericWarningType}
        >
          {i18n.gettext(
            'This add-on is not actively monitored for security by Mozilla. Make sure you trust it before installing.',
          )}
        </Notice>
      );
    }
    return null;
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    clientApp: state.api.clientApp,
    lang: state.api.lang,
    userAgentInfo: state.api.userAgentInfo,
  };
};

const InstallWarning: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(InstallWarningBase);

export default InstallWarning;
