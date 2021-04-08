/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import AMInstallButton from 'amo/components/AMInstallButton';
import GetFirefoxButton from 'amo/components/GetFirefoxButton';
import { UNKNOWN } from 'amo/constants';
import {
  VARIANT_NEW,
  EXPERIMENT_CONFIG,
} from 'amo/experiments/downloadCtaExperiment20210404';
import translate from 'amo/i18n/translate';
import { findInstallURL, withInstallHelpers } from 'amo/installAddon';
import { getVersionById } from 'amo/reducers/versions';
import { getClientCompatibility, isFirefox } from 'amo/utils/compatibility';
import { withExperiment } from 'amo/withExperiment';
import type { GetFirefoxButtonTypeType } from 'amo/components/GetFirefoxButton';
import type { WithInstallHelpersInjectedProps } from 'amo/installAddon';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { InstalledAddon } from 'amo/reducers/installations';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { WithExperimentInjectedProps } from 'amo/withExperiment';

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

type PropsFromState = {|
  canUninstall: $PropertyType<InstalledAddon, 'canUninstall'>,
  clientApp: string,
  currentVersion: AddonVersionType | null,
  installStatus: $PropertyType<InstalledAddon, 'status'>,
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...WithInstallHelpersInjectedProps,
  ...PropsFromState,
  ...WithExperimentInjectedProps,
  i18n: I18nType,
|};

export const InstallButtonWrapperBase = (props: InternalProps): React.Node => {
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
    variant,
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

  const file = currentVersion ? currentVersion.file : null;

  const installURL = file
    ? _findInstallURL({
        file,
      })
    : undefined;

  const showDownloadLink = !isCompatible && installURL;

  return (
    addon && (
      <div
        className={makeClassName('InstallButtonWrapper', {
          'InstallButtonWrapper--new': variant === VARIANT_NEW,
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
          useNewVersion={variant === VARIANT_NEW}
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

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { addon, version } = ownProps;
  const installedAddon = (addon && state.installations[addon.guid]) || {};

  let currentVersion = version || null;

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
  withExperiment(EXPERIMENT_CONFIG),
)(InstallButtonWrapperBase);

export default InstallButtonWrapper;
