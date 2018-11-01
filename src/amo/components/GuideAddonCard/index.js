/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AddonTitle from 'amo/components/AddonTitle';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AMInstallButton from 'core/components/AMInstallButton';
import {
  INCOMPATIBLE_NOT_FIREFOX,
  INSTALL_SOURCE_GUIDE_PAGE,
} from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import translate from 'core/i18n/translate';
import { getClientCompatibility } from 'core/utils/compatibility';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import type { AddonType } from 'core/types/addons';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';
import type { WithInstallHelpersInjectedProps } from 'core/installAddon';
import { makeQueryStringWithUTM } from 'amo/utils';
import Button from 'ui/components/Button';

import './styles.scss';

type Props = {
  addon: AddonType,
  addonText: string,
  staffPick?: boolean,
};

type InternalProps = {
  ...Props,
  ...WithInstallHelpersInjectedProps,
  _getClientCompatibility: typeof getClientCompatibility,
  clientApp: string,
  defaultInstallSource: string,
  installStatus: string,
  i18n: I18nType,
  location: ReactRouterLocationType,
  userAgentInfo: UserAgentInfoType,
};

export class GuideAddonCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    _getClientCompatibility: getClientCompatibility,
    staffPick: false,
  };

  render() {
    const {
      _getClientCompatibility,
      addon,
      clientApp,
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
        userAgentInfo,
      });

      compatible = compatibility.compatible;
    }

    const isFireFox =
      compatibility && compatibility.reason !== INCOMPATIBLE_NOT_FIREFOX;
    const showInstallButton = addon && isFireFox;

    // TODO: waiting to hear back on how to handle + Addon buttons on non
    // firefox browsers. See:
    // https://github.com/mozilla/addons-frontend/issues/6432#issuecomment-433083079.
    const showGetFirefoxButton = addon && !isFireFox;

    return addon ? (
      <Card>
        <div className="GuideAddonCard">
          <div className="GuideAddonCard-content">
            <img
              className="GuideAddonCard-content-icon"
              src={addon.icon_url}
              alt={addon.name}
            />
            <div className="GuideAddonCard-content-text">
              <div className="GuideAddonCard-content-header">
                <div className="GuideAddonCard-content-header-title">
                  {isFireFox && !compatible && compatibility ? (
                    <AddonCompatibilityError
                      downloadUrl={compatibility.downloadUrl}
                      maxVersion={compatibility.maxVersion}
                      minVersion={compatibility.minVersion}
                      reason={compatibility.reason}
                    />
                  ) : null}
                  <span className="GuideAddonCard-content-authors">
                    <AddonTitle addon={addon} as="span" />
                  </span>
                </div>
                {staffPick && (
                  <div className="GuideAddonCard-content-header-staff-pick">
                    <Icon name="trophy" />
                    <span>{i18n.gettext('STAFF PICK')}</span>
                  </div>
                )}
              </div>
              <p className="GuideAddonCard-content-description">
                {this.props.addonText}
              </p>
            </div>
            {showInstallButton && (
              <AMInstallButton
                addon={addon}
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

export const mapStateToProps = (state: AppState, ownProps) => {
  const installedAddon = state.installations[ownProps.addon.guid] || {};
  return {
    clientApp: state.api.clientApp,
    location: state.router.location,
    installError: installedAddon.error,
    installStatus: installedAddon.status,
    userAgentInfo: state.api.userAgentInfo,
  };
};

const GuideAddonCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_GUIDE_PAGE }),
  translate(),
)(GuideAddonCardBase);

export default GuideAddonCard;
