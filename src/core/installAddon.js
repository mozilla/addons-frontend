/* @flow */
import url from 'url';

import { oneLine } from 'common-tags';
import config from 'config';
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
import { findFileForPlatform, getDisplayName } from 'core/utils';
import { getFileHash } from 'core/utils/addons';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { AddonType, PlatformFilesType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocationType } from 'core/types/router';

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
      oneLine` No file exists for os "${userAgentInfo.os.toString()}"; platform files:`,
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
  WrappedComponent: React.ComponentType<any>,
  _addonManager: typeof addonManager,
  _installTheme: typeof installTheme,
  _tracking: typeof tracking,
  addon: AddonType,
  defaultInstallSource: string,
  userAgentInfo: UserAgentInfoType,
|};

type WithInstallHelpersInternalProps = {|
  ...WithInstallHelpersProps,
  dispatch: DispatchFunc,
  location: ReactRouterLocationType,
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

export class WithInstallHelpers extends React.Component<
  WithInstallHelpersInternalProps,
> {
  static defaultProps = {
    _addonManager: addonManager,
    _installTheme: installTheme,
    _tracking: tracking,
  };

  componentDidMount() {
    this.setCurrentStatus(this.props);
  }

  componentWillReceiveProps(nextProps: WithInstallHelpersInternalProps) {
    const oldGuid = this.props.addon ? this.props.addon.guid : null;
    const newGuid = nextProps.addon ? nextProps.addon.guid : null;

    if (newGuid && newGuid !== oldGuid) {
      log.info('Updating add-on status');
      this.setCurrentStatus(nextProps);
    }
  }

  async isAddonEnabled() {
    const {
      _addonManager,
      addon: { guid },
    } = this.props;

    try {
      const addon = await _addonManager.getAddon(guid);
      return addon.isEnabled;
    } catch (error) {
      log.error('could not determine whether the add-on was enabled', error);
    }

    return false;
  }

  setCurrentStatus(newProps: WithInstallHelpersInternalProps = this.props) {
    const {
      _addonManager,
      addon,
      defaultInstallSource,
      dispatch,
      location,
      userAgentInfo,
    } = {
      ...this.props,
      ...newProps,
    };

    if (!_addonManager.hasAddonManager()) {
      log.info('No addon manager, cannot set add-on status');
      return Promise.resolve();
    }

    if (!addon) {
      return Promise.resolve();
    }

    const { guid, platformFiles, type } = addon;

    const installURL = findInstallURL({
      defaultInstallSource,
      location,
      platformFiles,
      userAgentInfo,
    });

    const payload = { guid, url: installURL };

    log.info('Setting add-on status');
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
          log.info(oneLine`Add-on "${guid}" not found so setting status to
            UNINSTALLED; exact error: ${error}`);
          dispatch(setInstallState({ ...payload, status: UNINSTALLED }));
        },
      )
      .catch((error) => {
        log.error(`Caught error from addonManager: ${error}`);
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
    const {
      _addonManager,
      _tracking,
      addon: { guid, type, name },
      dispatch,
    } = this.props;

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
          log.info(`addon.setEnabled not available. Unable to enable ${guid}`);
        } else {
          log.error(`Error while trying to enable ${guid}:`, err);

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
      _tracking,
      addon,
      defaultInstallSource,
      dispatch,
      location,
      userAgentInfo,
    } = this.props;

    const { guid, name, platformFiles, type } = addon;

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
        const hash = installURL && getFileHash({ addon, installURL });

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
        log.error(`Install error: ${error}`);

        dispatch(setInstallError({ guid, error: FATAL_INSTALL_ERROR }));
      });
  }

  showInfo() {
    const { addon, dispatch } = this.props;

    dispatch(
      showInfoDialog({
        addonName: addon.name,
        imageURL: getAddonIconUrl(addon),
      }),
    );
  }

  uninstall({ guid, name, type }: UninstallParams) {
    const { _addonManager, _tracking, dispatch } = this.props;
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
        log.error(`Uninstall error: ${error}`);

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

export function makeMapDispatchToProps({
  WrappedComponent,
  defaultInstallSource,
  _config = config,
}: {|
  WrappedComponent: React.ComponentType<any>,
  defaultInstallSource: string,
  _config?: typeof config,
|}) {
  return function mapDispatchToProps(
    dispatch: DispatchFunc,
    ownProps: WithInstallHelpersInternalProps,
  ) {
    const mappedProps = {
      WrappedComponent,
      defaultInstallSource,
      dispatch,
    };

    if (_config.get('server')) {
      // Return early without validating properties.
      // I think this returns early because a user agent prop isn't
      // guaranteed on the server.
      return mappedProps;
    }

    if (ownProps.addon === undefined) {
      throw new Error(oneLine`The addon prop is required;
        ensure the wrapped component defines this property`);
    }

    if (ownProps.location === undefined) {
      throw new Error(oneLine`The location prop is required;
        ensure the wrapped component defines this property`);
    }

    if (ownProps.userAgentInfo === undefined) {
      throw new Error(oneLine`The userAgentInfo prop is required;
        ensure the wrapped component defines this property`);
    }

    return mappedProps;
  };
}

export function withInstallHelpers({
  _makeMapDispatchToProps = makeMapDispatchToProps,
  defaultInstallSource,
}: {|
  _makeMapDispatchToProps?: typeof makeMapDispatchToProps,
  defaultInstallSource: string,
|}) {
  if (typeof defaultInstallSource === 'undefined') {
    throw new Error('defaultInstallSource is required for withInstallHelpers');
  }
  return (WrappedComponent: React.ComponentType<any>) => {
    WithInstallHelpers.displayName = `WithInstallHelpers(${getDisplayName(
      WrappedComponent,
    )})`;

    return connect(
      undefined,
      _makeMapDispatchToProps({ WrappedComponent, defaultInstallSource }),
    )(WithInstallHelpers);
  };
}
