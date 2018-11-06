/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import AddonTitle from 'amo/components/AddonTitle';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import { GET_FIREFOX_BUTTON_TYPE_ADDON } from 'amo/components/GetFirefoxButton';
import AddonInstallError from 'amo/components/AddonInstallError';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import { INSTALL_SOURCE_GUIDES_PAGE } from 'core/constants';
import { getAddonIconUrl } from 'core/imageUtils';
import { withInstallHelpers } from 'core/installAddon';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import type { AddonType } from 'core/types/addons';
import type { AppState } from 'amo/store';
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
  clientApp: string | null,
  defaultInstallSource: string,
  installError: string | null,
  i18n: I18nType,
};

export class GuidesAddonCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    staffPick: true,
  };

  render() {
    const {
      addon,
      defaultInstallSource,
      enable,
      hasAddonManager,
      i18n,
      install,
      installTheme,
      isAddonEnabled,
      setCurrentStatus,
      staffPick,
      uninstall,
    } = this.props;

    return addon ? (
      <Card>
        <AddonInstallError error={this.props.installError} />
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
            {addon && (
              <InstallButtonWrapper
                addon={addon}
                className="guides"
                defaultButtonText={i18n.gettext('Add')}
                defaultInstallSource={defaultInstallSource}
                enable={enable}
                getFirefoxButtonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
                hasAddonManager={hasAddonManager}
                install={install}
                installTheme={installTheme}
                isAddonEnabled={isAddonEnabled}
                puffy={false}
                setCurrentStatus={setCurrentStatus}
                uninstall={uninstall}
              />
            )}
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

  let installedAddon = {};

  if (addon) {
    installedAddon = state.installations[addon.guid];
  }

  return {
    clientApp: state.api.clientApp,
    installError:
      installedAddon && installedAddon.error ? installedAddon.error : null,
  };
};

const GuidesAddonCard: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_GUIDES_PAGE }),
  translate(),
)(GuidesAddonCardBase);

export default GuidesAddonCard;
