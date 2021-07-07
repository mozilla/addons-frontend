/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import AMInstallButton from 'amo/components/AMInstallButton';
import GetFirefoxButton from 'amo/components/GetFirefoxButton';
import {
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  UNKNOWN,
} from 'amo/constants';
import { EXPERIMENT_CONFIG } from 'amo/experiments/20210531_download_funnel_experiment';
import translate from 'amo/i18n/translate';
import { findInstallURL, withInstallHelpers } from 'amo/installAddon';
import { getVersionById } from 'amo/reducers/versions';
import { getClientCompatibility, isFirefox } from 'amo/utils/compatibility';
import { withExperiment } from 'amo/withExperiment';
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
  addon: AddonType | null,
  className?: string,
  defaultButtonText?: string,
  puffy?: boolean,
  // TODO: this is a false positive since eslint-react-plugin >= 7.18.0 (it was
  // working fine with 7.17.0)
  // eslint-disable-next-line react/no-unused-prop-types
  version?: AddonVersionType | null,
  showLinkInsteadOfButton?: boolean,
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
    experimentId,
    hasAddonManager,
    i18n,
    install,
    installStatus,
    isAddonEnabled,
    puffy,
    setCurrentStatus,
    showLinkInsteadOfButton,
    uninstall,
    userAgentInfo,
    variant,
  } = props;

  const browserIsFirefox = isFirefox({ userAgentInfo });
  let isCompatible = false;
  let showInstallButton = browserIsFirefox;
  let showDownloadButton = !browserIsFirefox;
  let forIncompatibleAddon = false;

  if (addon && browserIsFirefox) {
    const compatibility = _getClientCompatibility({
      addon,
      currentVersion,
      clientApp,
      userAgentInfo,
    });
    isCompatible = compatibility.compatible;
    if (
      !isCompatible &&
      // We want to show the download button and hide the install button for
      // incompatible add-ons on Firefox that are not incompatible for the
      // following reasons, as these are dealt with differently.
      //
      // This includes those that are INCOMPATIBLE_UNDER_MIN_VERSION, and also
      // serves as a catch-all for any other reason not specified below.
      ![
        INCOMPATIBLE_ANDROID_UNSUPPORTED,
        INCOMPATIBLE_FIREFOX_FOR_IOS,
        INCOMPATIBLE_NOT_FIREFOX,
        INCOMPATIBLE_OVER_MAX_VERSION,
        INCOMPATIBLE_UNSUPPORTED_PLATFORM,
      ].includes(compatibility.reason)
    ) {
      forIncompatibleAddon = true;
      showInstallButton = false;
      showDownloadButton = true;
    }
  }

  const file = currentVersion ? currentVersion.file : null;

  const installURL = file
    ? _findInstallURL({
        file,
      })
    : undefined;

  const showDownloadLink = !isCompatible && installURL;

  const showFileLink = () => {
    return (
      <div className="InstallButtonWrapper-download">
        <a className="InstallButtonWrapper-download-link" href={installURL}>
          {i18n.gettext('Download file')}
        </a>
      </div>
    );
  };

  const overrideQueryParams = variant
    ? {
        experiment: experimentId,
        variation: variant,
      }
    : {};

  return (
    addon && (
      <div className="InstallButtonWrapper">
        {!showLinkInsteadOfButton && (
          <>
            {showInstallButton ? (
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
            ) : null}
            {showDownloadButton ? (
              <GetFirefoxButton
                addon={addon}
                className={className ? `GetFirefoxButton--${className}` : ''}
                forIncompatibleAddon={forIncompatibleAddon}
                overrideQueryParams={overrideQueryParams}
                variant={variant}
              />
            ) : null}
          </>
        )}
        {showDownloadLink || showLinkInsteadOfButton ? showFileLink() : null}
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
  withExperiment({ experimentConfig: EXPERIMENT_CONFIG }),
)(InstallButtonWrapperBase);

export default InstallButtonWrapper;
