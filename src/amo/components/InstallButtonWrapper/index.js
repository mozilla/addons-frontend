/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import GetFirefoxButton from 'amo/components/GetFirefoxButton';
import AMInstallButton from 'amo/components/AMInstallButton';
import { UNKNOWN } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { findInstallURL, withInstallHelpers } from 'amo/installAddon';
import { getVersionById } from 'amo/reducers/versions';
import { getClientCompatibility, isFirefox } from 'amo/utils/compatibility';
import type { GetFirefoxButtonTypeType } from 'amo/components/GetFirefoxButton';
import type { WithInstallHelpersInjectedProps } from 'amo/installAddon';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { InstalledAddon } from 'amo/reducers/installations';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { AppState } from 'amo/store';

import './styles.scss';

export type Props = {|
  _getClientCompatibility?: typeof getClientCompatibility,
  _findInstallURL?: typeof findInstallURL,
  addon: AddonType,
  className?: string,
  defaultButtonText?: string,
  getFirefoxButtonType: GetFirefoxButtonTypeType,
  puffy?: boolean,
  // TODO: this is a false positive since eslint-react-plugin >= 7.18.0 (it was
  // working fine with 7.17.0)
  // eslint-disable-next-line react/no-unused-prop-types
  version?: AddonVersionType | null,
|};

type InternalProps = {|
  ...Props,
  ...WithInstallHelpersInjectedProps,
  canUninstall: $PropertyType<InstalledAddon, 'canUninstall'>,
  clientApp: string,
  currentVersion: AddonVersionType | null,
  i18n: I18nType,
  installStatus: $PropertyType<InstalledAddon, 'status'>,
  userAgentInfo: UserAgentInfoType,
|};

export const InstallButtonWrapperBase = (props: InternalProps): React.Element<"div"> => {
  const {
    _findInstallURL = findInstallURL,
    _getClientCompatibility = getClientCompatibility,
    addon,
    canUninstall,
    className,
    clientApp,
    currentVersion,
    defaultButtonText,
    enable,
    getFirefoxButtonType,
    hasAddonManager,
    i18n,
    install,
    installStatus,
    isAddonEnabled,
    puffy,
    setCurrentStatus,
    uninstall,
    userAgentInfo,
  } = props;

  let isCompatible = false;

  if (addon && isFirefox({ userAgentInfo })) {
    const compatibility = _getClientCompatibility({
      addon,
      currentVersion,
      clientApp,
      userAgentInfo,
    });
    isCompatible = compatibility.compatible;
  }

  const installURL = currentVersion
    ? _findInstallURL({
        platformFiles: currentVersion.platformFiles,
        userAgentInfo,
      })
    : undefined;

  const showDownloadLink = !isCompatible && installURL;

  return (
    addon && (
      <div
        className={makeClassName('InstallButtonWrapper', {
          'InstallButtonWrapper--notFirefox': !isFirefox({ userAgentInfo }),
        })}
      >
        <AMInstallButton
          addon={addon}
          canUninstall={canUninstall}
          className={makeClassName(
            className ? `AMInstallButton--${className}` : '',
            {
              'AMInstallButton--noDownloadLink': !showDownloadLink,
            },
          )}
          currentVersion={currentVersion}
          defaultButtonText={defaultButtonText}
          disabled={!isCompatible}
          enable={enable}
          hasAddonManager={hasAddonManager}
          install={install}
          isAddonEnabled={isAddonEnabled}
          puffy={puffy}
          setCurrentStatus={setCurrentStatus}
          status={installStatus}
          uninstall={uninstall}
        />
        <GetFirefoxButton
          addon={addon}
          buttonType={getFirefoxButtonType}
          className={className ? `GetFirefoxButton--${className}` : ''}
        />
        {showDownloadLink ? (
          <div className="InstallButtonWrapper-download">
            <a className="InstallButtonWrapper-download-link" href={installURL}>
              {i18n.gettext('Download file')}
            </a>
          </div>
        ) : null}
      </div>
    )
  );
};

export function mapStateToProps(state: AppState, ownProps: InternalProps): {|
  canUninstall: void | boolean,
  clientApp: null | string,
  currentVersion: ?AddonVersionType,
  installStatus: 
    | "DISABLED"
    | "DISABLING"
    | "DOWNLOADING"
    | "ENABLED"
    | "ENABLING"
    | "ERROR"
    | "INACTIVE"
    | "INSTALLED"
    | "INSTALLING"
    | "UNINSTALLED"
    | "UNINSTALLING"
    | "UNKNOWN",
  userAgentInfo: UserAgentInfoType,
|} {
  const { addon, version } = ownProps;
  const installedAddon = (addon && state.installations[addon.guid]) || {};

  let currentVersion = version;

  if (addon && addon.currentVersionId && !currentVersion) {
    currentVersion = getVersionById({
      id: addon.currentVersionId,
      state: state.versions,
    });
  }

  return {
    canUninstall: installedAddon.canUninstall,
    clientApp: state.api.clientApp,
    currentVersion,
    installStatus: installedAddon.status || UNKNOWN,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const InstallButtonWrapper: React.ComponentType<Props> = compose(
  withRouter,
  withInstallHelpers,
  connect(mapStateToProps),
  translate(),
)(InstallButtonWrapperBase);

export default InstallButtonWrapper;
