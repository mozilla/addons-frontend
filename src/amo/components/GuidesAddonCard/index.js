/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import AddonTitle from 'amo/components/AddonTitle';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import AMInstallButton from 'core/components/AMInstallButton';
import {
  INCOMPATIBLE_NOT_FIREFOX,
  INSTALL_SOURCE_GUIDES_PAGE,
  UNKNOWN,
} from 'core/constants';
import { getAddonIconUrl } from 'core/imageUtils';
import { withInstallHelpers } from 'core/installAddon';
import translate from 'core/i18n/translate';
import { getVersionById } from 'core/reducers/versions';
import { getErrorMessage } from 'core/utils/addons';
import { getClientCompatibility } from 'core/utils/compatibility';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import Notice from 'ui/components/Notice';
import type { AddonType } from 'core/types/addons';
import type { AddonVersionType } from 'core/reducers/versions';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { WithInstallHelpersInjectedProps } from 'core/installAddon';

import './styles.scss';

type Props = {
  addon: AddonType | null,
  addonCustomText: string,
  staffPick?: boolean,
};

type InternalProps = {
  ...Props,
  ...WithInstallHelpersInjectedProps,
  _getClientCompatibility: typeof getClientCompatibility,
  clientApp: string | null,
  currentVersion: AddonVersionType | null,
  defaultInstallSource: string,
  installError: string | null,
  installStatus: string,
  i18n: I18nType,
  userAgentInfo: UserAgentInfoType,
};

export class GuidesAddonCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    _getClientCompatibility: getClientCompatibility,
    staffPick: true,
  };

  // TODO: See https://github.com/mozilla/addons-frontend/issues/6902.
  renderInstallError() {
    const { i18n, installError: error } = this.props;

    if (!error) {
      return null;
    }

    return (
      <Notice className="Addon-header-install-error" type="error">
        {getErrorMessage({ i18n, error })}
      </Notice>
    );
  }

  render() {
    const {
      _getClientCompatibility,
      addon,
      clientApp,
      currentVersion,
      i18n,
      staffPick,
      userAgentInfo,
    } = this.props;

    let compatible = false;
    let compatibility;

    if (addon && clientApp) {
      compatibility = _getClientCompatibility({
        addon,
        clientApp,
        currentVersion,
        userAgentInfo,
      });

      compatible = compatibility.compatible;
    }

    const isFireFox =
      compatibility && compatibility.reason !== INCOMPATIBLE_NOT_FIREFOX;
    const showInstallButton = addon && isFireFox;

    return addon ? (
      <Card>
        {this.renderInstallError()}
        <div className="GuidesAddonCard">
          <AddonCompatibilityError addon={addon} />
          <div className="GuidesAddonCard-content">
            <img
              className="GuidesAddonCard-content-icon"
              src={getAddonIconUrl(addon)}
              alt={addon.name}
            />
            <div className="GuidesAddonCard-content-text">
              <div className="GuidesAddonCard-content-header">
                <div className="GuidesAddonCard-content-header-title">
                  <span className="GuidesAddonCard-content-header-authors">
                    <AddonTitle addon={addon} as="span" linkToAddon />
                  </span>
                </div>
                {staffPick && (
                  <div className="GuidesAddonCard-content-header-staff-pick">
                    <Icon name="trophy" />
                    <span>{i18n.gettext('Staff Pick')}</span>
                  </div>
                )}
              </div>
              <p className="GuidesAddonCard-content-description">
                {this.props.addonCustomText}
              </p>
            </div>
            {showInstallButton && currentVersion && (
              <AMInstallButton
                addon={addon}
                currentVersion={currentVersion}
                defaultButtonText={i18n.gettext('Add')}
                defaultInstallSource={this.props.defaultInstallSource}
                disabled={!compatible}
                enable={this.props.enable}
                hasAddonManager={this.props.hasAddonManager}
                install={this.props.install}
                installTheme={this.props.installTheme}
                setCurrentStatus={this.props.setCurrentStatus}
                status={this.props.installStatus}
                uninstall={this.props.uninstall}
                isAddonEnabled={this.props.isAddonEnabled}
                puffy={false}
              />
            )}
            <GetFirefoxButton
              addon={addon}
              buttonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
              className="GetFirefoxButton--guides"
            />
          </div>
        </div>
      </Card>
    ) : null;
  }
}

export const mapStateToProps = (
  state: AppState,
  ownProps: Props,
): $Shape<InternalProps> => {
  const { addon } = ownProps;

  let currentVersion = null;
  let installedAddon = {};

  if (addon) {
    installedAddon = state.installations[addon.guid];

    if (addon.currentVersionId) {
      currentVersion = getVersionById({
        id: addon.currentVersionId,
        state: state.versions,
      });
    }
  }
  return {
    clientApp: state.api.clientApp,
    currentVersion,
    installError:
      installedAddon && installedAddon.error ? installedAddon.error : null,
    installStatus: installedAddon ? installedAddon.status : UNKNOWN,
    userAgentInfo: state.api.userAgentInfo,
  };
};

const GuidesAddonCard: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_GUIDES_PAGE }),
  translate(),
)(GuidesAddonCardBase);

export default GuidesAddonCard;
