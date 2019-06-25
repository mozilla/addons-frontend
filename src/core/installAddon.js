/* @flow */
import url from 'url';

import { oneLine } from 'common-tags';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';

import { getAddonIconUrl } from 'core/imageUtils';
import { setInstallError, setInstallState } from 'core/actions/installations';
import log from 'core/logger';
import themeInstall from 'core/themeInstall';
import tracking, {
  getAddonTypeForTracking,
  getAddonEventCategory,
} from 'core/tracking';
import {
  ADDON_TYPE_THEME,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLE_ACTION,
  ERROR_CORRUPT_FILE,
  ERROR,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALLING,
  INSTALL_ACTION,
  INSTALL_CANCELLED,
  INSTALL_CANCELLED_ACTION,
  INSTALL_DOWNLOAD_FAILED_ACTION,
  INSTALL_FAILED,
  INSTALL_STARTED_ACTION,
  INSTALL_STARTED_THEME_CATEGORY,
  INSTALL_THEME_CATEGORY,
  SET_ENABLE_NOT_AVAILABLE,
  START_DOWNLOAD,
  TRACKING_TYPE_THEME,
  UNINSTALLED,
  UNINSTALLING,
  UNINSTALL_ACTION,
  UNKNOWN,
} from 'core/constants';
import * as addonManager from 'core/addonManager';
import { showInfoDialog } from 'core/reducers/infoDialog';
import { getVersionById } from 'core/reducers/versions';
import { findFileForPlatform, getDisplayName } from 'core/utils';
import { getFileHash } from 'core/utils/addons';
import type { AppState as AmoAppState } from 'amo/store';
import type { UserAgentInfoType } from 'core/reducers/api';
import type {
  AddonVersionType,
  PlatformFilesType,
} from 'core/reducers/versions';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocationType } from 'core/types/router';
import type { AppState as DiscoAppState } from 'disco/store';

type InstallThemeParams = {|
  name: string,
  status: string,
  type: string,
|};

export function installTheme(
  node: HTMLAnchorElement,
  { name, status, type }: InstallThemeParams,
  {
    _themeInstall = themeInstall,
    _tracking = tracking,
  }: {|
    _themeInstall: typeof themeInstall,
    _tracking: typeof tracking,
  |} = {},
) {
  if (
    type === ADDON_TYPE_THEME &&
    [DISABLED, UNINSTALLED, UNKNOWN].includes(status)
  ) {
    _themeInstall(node);
    // For consistency, track both a start-install and an install event.
    _tracking.sendEvent({
      action: TRACKING_TYPE_THEME,
      category: INSTALL_STARTED_THEME_CATEGORY,
      label: name,
    });
    _tracking.sendEvent({
      action: TRACKING_TYPE_THEME,
      category: INSTALL_THEME_CATEGORY,
      label: name,
    });
  }
}

type AddonInstallType = {|
  maxProgress: number,
  progress: number,
  state: string,
|};

type EventType = {|
  type: string,
|};

type MakeProgressHandlerParams = {|
  _tracking: typeof tracking,
  dispatch: DispatchFunc,
  guid: string,
  name: string,
  type: string,
|};

export function makeProgressHandler({
  _tracking,
  dispatch,
  guid,
  name,
  type,
}: MakeProgressHandlerParams) {
  return (addonInstall: AddonInstallType, event: EventType) => {
    if (addonInstall.state === 'STATE_DOWNLOADING') {
      const downloadProgress = parseInt(
        (100 * addonInstall.progress) / addonInstall.maxProgress,
        10,
      );
      dispatch({
        type: DOWNLOAD_PROGRESS,
        payload: { guid, downloadProgress },
      });
    } else if (event.type === 'onDownloadEnded') {
      dispatch(setInstallState({ guid, status: INSTALLING }));
    } else if (event.type === 'onDownloadFailed') {
      dispatch(setInstallError({ guid, error: DOWNLOAD_FAILED }));

      _tracking.sendEvent({
        action: getAddonTypeForTracking(type),
        category: getAddonEventCategory(type, INSTALL_DOWNLOAD_FAILED_ACTION),
        label: name,
      });
    } else if (event.type === 'onInstallCancelled') {
      dispatch({
        type: INSTALL_CANCELLED,
        payload: { guid },
      });

      _tracking.sendEvent({
        action: getAddonTypeForTracking(type),
        category: getAddonEventCategory(type, INSTALL_CANCELLED_ACTION),
        label: name,
      });
    } else if (event.type === 'onInstallFailed') {
      dispatch(setInstallError({ guid, error: INSTALL_FAILED }));
    } else if (event.type === 'onCorruptFile') {
      dispatch(setInstallError({ guid, error: ERROR_CORRUPT_FILE }));
    }
  };
}

type FindInstallUrlParams = {|
  _findFileForPlatform?: typeof findFileForPlatform,
  appendSource?: boolean,
  defaultInstallSource?: string,
  location?: ReactRouterLocationType,
  platformFiles: PlatformFilesType,
  userAgentInfo: UserAgentInfoType,
|};

/**
 * This is a helper to find the correct install URL for the user agent's
 * platform.
 */
export const findInstallURL = ({
  _findFileForPlatform = findFileForPlatform,
  appendSource = true,
  defaultInstallSource,
  location,
  platformFiles,
  userAgentInfo,
}: FindInstallUrlParams): string | void => {
  let source;
  if (appendSource) {
    invariant(
      location,
      'The location parameter is required when appendSource is true',
    );
    source = location.query.src || defaultInstallSource;
  }

  const platformFile = _findFileForPlatform({
    platformFiles,
    userAgentInfo,
  });

  const installURL = platformFile && platformFile.url;

  if (!installURL) {
    // This could happen for themes which do not have version files.
    log.debug(
      oneLine`No file exists for os
      ${JSON.stringify(userAgentInfo.os)}; platform files:`,
      platformFiles,
    );

    return undefined;
  }

  if (!source) {
    return installURL;
  }

  // Add ?src=...
  const parseQuery = true;
  const urlParts = url.parse(installURL, parseQuery);
  return url.format({
    ...urlParts,
    // Reset the search string so we can define a new one.
    search: undefined,
    query: { ...urlParts.query, src: source },
  });
};

type WithInstallHelpersProps = {|
  addon: AddonType | null,
  defaultInstallSource: string,
  location: ReactRouterLocationType,
  version?: AddonVersionType | null,
|};

type WithInstallHelpersInternalProps = {|
  ...WithInstallHelpersProps,
  WrappedComponent: React.ComponentType<any>,
  _addonManager: typeof addonManager,
  _installTheme: typeof installTheme,
  _log: typeof log,
  _tracking: typeof tracking,
  currentVersion: AddonVersionType | null,
  dispatch: DispatchFunc,
  userAgentInfo: UserAgentInfoType,
|};

type EnableParams = {|
  sendTrackingEvent: boolean,
|};

type UninstallParams = {|
  guid: string,
  name: string,
  type: string,
|};

// Props passed to the WrappedComponent.
export type WithInstallHelpersInjectedProps = {|
  enable: (EnableParams | void) => Promise<any>,
  hasAddonManager: boolean,
  install: () => Promise<any>,
  installTheme: (HTMLAnchorElement, InstallThemeParams) => void,
  isAddonEnabled: () => Promise<boolean>,
  setCurrentStatus: () => Promise<any>,
  uninstall: (UninstallParams) => Promise<any>,
|};

export class WithInstallHelpers extends React.Component<WithInstallHelpersInternalProps> {
  static defaultProps = {
    _addonManager: addonManager,
    _installTheme: installTheme,
    _log: log,
    _tracking: tracking,
  };

  componentDidMount() {
    this.setCurrentStatus();
  }

  componentDidUpdate(prevProps: WithInstallHelpersInternalProps) {
    const oldGuid = prevProps.addon ? prevProps.addon.guid : null;
    const newGuid = this.props.addon ? this.props.addon.guid : null;

    if (newGuid && newGuid !== oldGuid) {
      this.props._log.info('Updating add-on status');
      this.setCurrentStatus();
    }
  }

  async isAddonEnabled() {
    const { _addonManager, _log, addon } = this.props;

    if (!addon) {
      _log.debug('no addon, assuming addon is not enabled');
      return false;
    }

    try {
      const clientAddon = await _addonManager.getAddon(addon.guid);

      return clientAddon.isEnabled;
    } catch (error) {
      // eslint-disable-next-line amo/only-log-strings
      _log.error('could not determine whether the add-on was enabled', error);
    }

    return false;
  }

  setCurrentStatus() {
    const {
      _addonManager,
      _log,
      addon,
      currentVersion,
      defaultInstallSource,
      dispatch,
      location,
      userAgentInfo,
    } = this.props;

    if (!_addonManager.hasAddonManager()) {
      _log.info('No addon manager, cannot set add-on status');
      return Promise.resolve();
    }

    if (!addon) {
      _log.debug('no addon, aborting setCurrentStatus()');
      return Promise.resolve();
    }

    if (!currentVersion) {
      _log.debug('no currentVersion, aborting setCurrentStatus()');
      return Promise.resolve();
    }

    const { guid, type } = addon;
    const { platformFiles } = currentVersion;

    const installURL = findInstallURL({
      defaultInstallSource,
      location,
      platformFiles,
      userAgentInfo,
    });

    const payload = { guid, url: installURL };

    _log.info('Setting add-on status');
    return _addonManager
      .getAddon(guid)
      .then(
        (clientAddon) => {
          const status = _addonManager.getAddonStatus({
            addon: clientAddon,
            type,
          });

          dispatch(setInstallState({ ...payload, status }));
        },
        (error) => {
          _log.info(oneLine`Add-on "${guid}" not found so setting status to
            UNINSTALLED; exact error: ${error}`);
          dispatch(setInstallState({ ...payload, status: UNINSTALLED }));
        },
      )
      .catch((error) => {
        _log.error(`Caught error from addonManager: ${error}`);
        // Dispatch a generic error should the success/error functions throw.
        dispatch(
          setInstallState({
            guid,
            status: ERROR,
            error: FATAL_ERROR,
          }),
        );
      });
  }

  enable({ sendTrackingEvent }: EnableParams = { sendTrackingEvent: true }) {
    const { _addonManager, _log, _tracking, dispatch, addon } = this.props;

    if (!addon) {
      _log.debug('no addon found, aborting enable().');
      return Promise.resolve();
    }

    const { guid, type, name } = addon;

    return _addonManager
      .enable(guid)
      .then(() => {
        if (sendTrackingEvent) {
          _tracking.sendEvent({
            action: getAddonTypeForTracking(type),
            category: getAddonEventCategory(type, ENABLE_ACTION),
            label: name,
          });
        }

        if (!_addonManager.hasPermissionPromptsEnabled()) {
          this.showInfo();
        }
      })
      .catch((err) => {
        if (err && err.message === SET_ENABLE_NOT_AVAILABLE) {
          _log.info(`addon.setEnabled not available. Unable to enable ${guid}`);
        } else {
          // eslint-disable-next-line amo/only-log-strings
          _log.error(`Error while trying to enable ${guid}:`, err);

          dispatch(
            setInstallState({
              guid,
              status: ERROR,
              error: FATAL_ERROR,
            }),
          );
        }
      });
  }

  install() {
    const {
      _addonManager,
      _log,
      _tracking,
      addon,
      currentVersion,
      defaultInstallSource,
      dispatch,
      location,
      userAgentInfo,
    } = this.props;

    if (!addon) {
      _log.debug('no addon found, aborting install().');
      return Promise.resolve();
    }

    if (!currentVersion) {
      _log.debug('no currentVersion found, aborting install().');
      return Promise.resolve();
    }

    const { guid, name, type } = addon;
    const { platformFiles } = currentVersion;

    return new Promise((resolve) => {
      dispatch({ type: START_DOWNLOAD, payload: { guid } });
      _tracking.sendEvent({
        action: getAddonTypeForTracking(type),
        category: getAddonEventCategory(type, INSTALL_STARTED_ACTION),
        label: name,
      });

      const installURL = findInstallURL({
        defaultInstallSource,
        location,
        platformFiles,
        userAgentInfo,
      });

      resolve(installURL);
    })
      .then((installURL) => {
        const hash =
          installURL &&
          getFileHash({ addon, installURL, version: currentVersion });

        return _addonManager.install(
          installURL,
          makeProgressHandler({
            _tracking,
            dispatch,
            guid,
            name,
            type,
          }),
          { src: defaultInstallSource, hash },
        );
      })
      .then(() => {
        _tracking.sendEvent({
          action: getAddonTypeForTracking(type),
          category: getAddonEventCategory(type, INSTALL_ACTION),
          label: name,
        });
        if (!_addonManager.hasPermissionPromptsEnabled()) {
          this.showInfo();
        }
      })
      .catch((error) => {
        _log.error(`Install error: ${error}`);

        dispatch(setInstallError({ guid, error: FATAL_INSTALL_ERROR }));
      });
  }

  showInfo() {
    const { addon, dispatch } = this.props;

    invariant(addon, 'addon is required');

    dispatch(
      showInfoDialog({
        addonName: addon.name,
        imageURL: getAddonIconUrl(addon),
      }),
    );
  }

  uninstall({ guid, name, type }: UninstallParams) {
    const { _addonManager, _log, _tracking, dispatch } = this.props;

    dispatch(setInstallState({ guid, status: UNINSTALLING }));

    const action = getAddonTypeForTracking(type);
    return _addonManager
      .uninstall(guid)
      .then(() => {
        _tracking.sendEvent({
          action,
          category: getAddonEventCategory(type, UNINSTALL_ACTION),
          label: name,
        });
      })
      .catch((error) => {
        _log.error(`Uninstall error: ${error}`);

        dispatch(setInstallError({ guid, error: FATAL_UNINSTALL_ERROR }));
      });
  }

  render() {
    const {
      WrappedComponent,
      _addonManager,
      _installTheme,
      ...passThroughProps
    } = this.props;

    // Wrapped components will receive these props.
    const injectedProps: WithInstallHelpersInjectedProps = {
      enable: (...args) => this.enable(...args),
      // We pass a `boolean` value here, not the function.
      hasAddonManager: _addonManager.hasAddonManager(),
      install: (...args) => this.install(...args),
      installTheme: (...args) => _installTheme(...args),
      isAddonEnabled: (...args) => this.isAddonEnabled(...args),
      setCurrentStatus: (...args) => this.setCurrentStatus(...args),
      uninstall: (...args) => this.uninstall(...args),
    };

    return <WrappedComponent {...injectedProps} {...passThroughProps} />;
  }
}

export const withInstallHelpers = (
  WrappedComponent: React.ComponentType<any>,
) => {
  WithInstallHelpers.displayName = `WithInstallHelpers(${getDisplayName(
    WrappedComponent,
  )})`;

  const mapStateToProps = (
    state: AmoAppState | DiscoAppState,
    ownProps: WithInstallHelpersProps,
  ) => {
    const { addon, defaultInstallSource, location } = ownProps;

    invariant(typeof addon !== 'undefined', 'addon is required');
    invariant(
      typeof defaultInstallSource !== 'undefined',
      'defaultInstallSource is required',
    );
    invariant(location, 'location is required');

    let currentVersion = ownProps.version;
    if (!currentVersion) {
      currentVersion =
        addon && addon.currentVersionId
          ? getVersionById({
              id: addon.currentVersionId,
              state: state.versions,
            })
          : null;
    }

    return {
      WrappedComponent,
      currentVersion,
      userAgentInfo: state.api.userAgentInfo,
    };
  };

  return connect(mapStateToProps)(WithInstallHelpers);
};
