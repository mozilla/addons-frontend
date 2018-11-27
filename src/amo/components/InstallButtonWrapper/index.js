/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import GetFirefoxButton from 'amo/components/GetFirefoxButton';
import AMInstallButton from 'core/components/AMInstallButton';
import { UNKNOWN } from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import { getVersionById } from 'core/reducers/versions';
import { getClientCompatibility, isFirefox } from 'core/utils/compatibility';
import type { GetFirefoxButtonTypeType } from 'amo/components/GetFirefoxButton';
import type { WithInstallHelpersInjectedProps } from 'core/installAddon';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { InstalledAddon } from 'core/reducers/installations';
import type { AddonVersionType } from 'core/reducers/versions';
import type { AddonType } from 'core/types/addons';
import type { AppState } from 'disco/store';

import './styles.scss';

export type Props = {|
  _getClientCompatibility?: typeof getClientCompatibility,
  addon: AddonType,
  className?: string,
  defaultButtonText?: string,
  defaultInstallSource: string,
  getFirefoxButtonType: GetFirefoxButtonTypeType,
  puffy?: boolean,
|};

type InternalProps = {|
  ...Props,
  ...WithInstallHelpersInjectedProps,
  clientApp: string,
  currentVersion: AddonVersionType | null,
  installStatus: $PropertyType<InstalledAddon, 'status'>,
  userAgentInfo: UserAgentInfoType,
|};

export const InstallButtonWrapperBase = (props: InternalProps) => {
  const {
    _getClientCompatibility = getClientCompatibility,
    addon,
    className,
    clientApp,
    currentVersion,
    defaultButtonText,
    defaultInstallSource,
    enable,
    getFirefoxButtonType,
    hasAddonManager,
    isAddonEnabled,
    install,
    installStatus,
    installTheme,
    setCurrentStatus,
    puffy,
    uninstall,
    userAgentInfo,
  } = props;

  let isCompatible = false;
  let compatibility;

  if (addon && isFirefox({ userAgentInfo })) {
    compatibility = _getClientCompatibility({
      addon,
      currentVersion,
      clientApp,
      userAgentInfo,
    });
    isCompatible = compatibility.compatible;
  }

  return (
    addon && (
      <div
        className={makeClassName('InstallButtonWrapper', {
          'InstallButtonWrapper--notFirefox': !isFirefox({ userAgentInfo }),
        })}
      >
        <AMInstallButton
          addon={addon}
          className={makeClassName({
            [`AMInstallButton--${className}`]: className,
          })}
          currentVersion={currentVersion}
          defaultButtonText={defaultButtonText}
          defaultInstallSource={defaultInstallSource}
          disabled={!isCompatible}
          enable={enable}
          hasAddonManager={hasAddonManager}
          install={install}
          installTheme={installTheme}
          isAddonEnabled={isAddonEnabled}
          puffy={puffy}
          setCurrentStatus={setCurrentStatus}
          status={installStatus}
          uninstall={uninstall}
        />
        <GetFirefoxButton
          addon={addon}
          buttonType={getFirefoxButtonType}
          className={makeClassName({
            [`GetFirefoxButton--${className}`]: className,
          })}
        />
      </div>
    )
  );
};

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
  const { addon } = ownProps;
  const installedAddon = (addon && state.installations[addon.guid]) || {};

  let currentVersion = null;

  if (addon) {
    currentVersion = addon.currentVersionId
      ? getVersionById({
          id: addon.currentVersionId,
          state: state.versions,
        })
      : null;
  }

  return {
    clientApp: state.api.clientApp,
    currentVersion,
    installStatus: installedAddon.status || UNKNOWN,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const InstallButtonWrapper: React.ComponentType<Props> = compose(
  withRouter,
  withInstallHelpers(),
  connect(mapStateToProps),
)(InstallButtonWrapperBase);

export default InstallButtonWrapper;
