/* @flow */
import type {CollectionAddonType} from "../../types/addons";
import type {SuggestionType} from "../../reducers/autocomplete";
import type {PromotedCategoryType} from "../../constants";import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import type { AppState } from 'amo/store';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_FIREFOX,
  EXCLUDE_WARNING_CATEGORIES,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { getPromotedCategory } from 'amo/utils/addons';
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

type InternalProps = {|
  ...Props,
  _correctedLocationForPlatform: typeof correctedLocationForPlatform,
  _couldShowWarning?: () => boolean,
  _getPromotedCategory: typeof getPromotedCategory,
  clientApp: string,
  className?: string,
  i18n: I18nType,
  lang: string,
  location: ReactRouterLocationType,
  userAgentInfo: UserAgentInfoType,
|};

export const VARIANT_INCLUDE_WARNING_PROPOSED = 'includeWarning-proposed';
const WARNING_LINK_DESTINATION = getPromotedBadgesLinkUrl({
  utm_content: 'install-warning',
});

export class InstallWarningBase extends React.Component<InternalProps> {
  static defaultProps: {|
  _correctedLocationForPlatform: (
    {|
      clientApp: string,
      isHomePage?: boolean,
      lang: string,
      location: ReactRouterLocationType,
      userAgentInfo: UserAgentInfoType,
    |}
  ) => string | null,
  _getPromotedCategory: (
    {|
      addon: ?(AddonType | CollectionAddonType | SuggestionType),
      clientApp: string,
      forBadging?: boolean,
    |}
  ) => PromotedCategoryType | null,
|} = {
    _correctedLocationForPlatform: correctedLocationForPlatform,
    _getPromotedCategory: getPromotedCategory,
  };

  couldShowWarning: (() => boolean) = () => {
    const {
      _correctedLocationForPlatform,
      _couldShowWarning,
      _getPromotedCategory,
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

    const promotedCategory = _getPromotedCategory({
      addon,
      clientApp,
    });

    return _couldShowWarning
      ? _couldShowWarning()
      : !correctedLocation &&
          isFirefox({ userAgentInfo }) &&
          clientApp === CLIENT_APP_FIREFOX &&
          addon.type === ADDON_TYPE_EXTENSION &&
          (!promotedCategory ||
            !EXCLUDE_WARNING_CATEGORIES.includes(promotedCategory));
  };

  render(): null | React.Node {
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
            'This add-on is not actively monitored for security by Mozilla. Make sure you trust it before installing.',
          )}
        </Notice>
      );
    }
    return null;
  }
}

export const mapStateToProps = (state: AppState): {|
  clientApp: null | string,
  lang: null | string,
  userAgentInfo: UserAgentInfoType,
|} => {
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
