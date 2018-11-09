/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AddonTitle from 'amo/components/AddonTitle';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import { makeQueryStringWithUTM } from 'amo/utils';
import AMInstallButton from 'core/components/AMInstallButton';
import {
  INCOMPATIBLE_NOT_FIREFOX,
  INSTALL_SOURCE_GUIDES_PAGE,
  UNKNOWN,
} from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import translate from 'core/i18n/translate';
import { getAddonByGUID } from 'core/reducers/addons';
import { getVersionById } from 'core/reducers/versions';
import { getErrorMessage } from 'core/utils/addons';
import { getClientCompatibility } from 'core/utils/compatibility';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import Button from 'ui/components/Button';
import Notice from 'ui/components/Notice';
import type { AddonType } from 'core/types/addons';
import type { AddonVersionType } from 'core/reducers/versions';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';
import type { WithInstallHelpersInjectedProps } from 'core/installAddon';

import './styles.scss';

type Props = {
  addonGuid: string,
  addonCustomText: string,
  staffPick?: boolean,
};

type InternalProps = {
  ...Props,
  ...WithInstallHelpersInjectedProps,
  _getClientCompatibility: typeof getClientCompatibility,
  addon: AddonType,
  clientApp: string,
  currentVersion: AddonVersionType,
  defaultInstallSource: string,
  installError: string,
  installStatus: string,
  i18n: I18nType,
  location: ReactRouterLocationType,
  userAgentInfo: UserAgentInfoType,
};

export class GuidesAddonCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    _getClientCompatibility: getClientCompatibility,
    staffPick: true,
  };

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

    if (addon) {
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

    // TODO: waiting to hear back on how to handle "+Addon" buttons on non
    // firefox browsers. See:
    // https://github.com/mozilla/addons-frontend/issues/6432#issuecomment-433083079.
    const showGetFirefoxButton = addon && !isFireFox;

    return addon ? (
      <Card>
        {this.renderInstallError()}
        <div className="GuidesAddonCard">
          {isFireFox && !compatible && compatibility ? (
            <AddonCompatibilityError
              downloadUrl={compatibility.downloadUrl}
              maxVersion={compatibility.maxVersion}
              minVersion={compatibility.minVersion}
              reason={compatibility.reason}
            />
          ) : null}
          <div className="GuidesAddonCard-content">
            <img
              className="GuidesAddonCard-content-icon"
              src={addon.icon_url}
              alt={addon.name}
            />
            <div className="GuidesAddonCard-content-text">
              <div className="GuidesAddonCard-content-header">
                <div className="GuidesAddonCard-content-header-title">
                  <span className="GuidesAddonCard-content-authors">
                    <AddonTitle addon={addon} as="span" />
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
            {showInstallButton && (
              <AMInstallButton
                addon={addon}
                currentVersion={currentVersion}
                defaultButtonText={i18n.gettext('Addon')}
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
            {showGetFirefoxButton && (
              <Button
                buttonType="confirm"
                href={`https://www.mozilla.org/firefox/new/${makeQueryStringWithUTM(
                  {
                    utm_content: addon.guid,
                  },
                )}`}
                puffy
                className="Button--get-firefox"
              >
                {i18n.gettext('Only with Firefox—Get Firefox Now')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    ) : null;
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const addon = getAddonByGUID(state, ownProps.addonGuid);
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
    addon,
    clientApp: state.api.clientApp,
    currentVersion,
    location: state.router.location,
    installError:
      installedAddon && installedAddon.error ? installedAddon.error : null,
    installStatus: installedAddon ? installedAddon.status : UNKNOWN,
    userAgentInfo: state.api.userAgentInfo,
  };
};

const GuidesAddonCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_GUIDES_PAGE }),
  translate(),
)(GuidesAddonCardBase);

export default GuidesAddonCard;
