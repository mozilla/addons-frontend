/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';

import { setInstallError, setInstallState } from 'amo/reducers/installations';
import log from 'amo/logger';
import tracking, {
  getAddonTypeForTracking,
  getAddonEventCategory,
} from 'amo/tracking';
import {
  ADDON_TYPE_EXTENSION,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLE_ACTION,
  ERROR,
  ERROR_CORRUPT_FILE,
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
  INSTALL_TRUSTED_EXTENSION_CATEGORY,
  SET_ENABLE_NOT_AVAILABLE,
  START_DOWNLOAD,
  UNINSTALLED,
  UNINSTALLING,
  UNINSTALL_ACTION,
} from 'amo/constants';
import * as addonManager from 'amo/addonManager';
import { getVersionById } from 'amo/reducers/versions';
import { getDisplayName } from 'amo/utils';
import { getFileHash, getPromotedCategories } from 'amo/utils/addons';
import type { AppState } from 'amo/store';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';

type AddonInstallType = {|
  maxProgress: number,
  progress: number,
  state: string,
|};

type EventType = {|
  type: string,
  target?: {|
    error: string,
  |},
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
  type,
}: MakeProgressHandlerParams): (
  addonInstall: AddonInstallType,
  event: EventType,
) => void {
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
      // See: https://github.com/mozilla/addons-frontend/issues/7985
      if (event.target && event.target.error === ERROR_CORRUPT_FILE) {
        dispatch(setInstallError({ guid, error: ERROR_CORRUPT_FILE }));
      } else {
        dispatch(setInstallError({ guid, error: DOWNLOAD_FAILED }));

        _tracking.sendEvent({
          action: getAddonTypeForTracking(type),
          category: getAddonEventCategory(type, INSTALL_DOWNLOAD_FAILED_ACTION),
          label: guid,
        });
      }
    } else if (event.type === 'onInstallCancelled') {
      dispatch({
        type: INSTALL_CANCELLED,
        payload: { guid },
      });

      _tracking.sendEvent({
        action: getAddonTypeForTracking(type),
        category: getAddonEventCategory(type, INSTALL_CANCELLED_ACTION),
        label: guid,
      });
    } else if (event.type === 'onInstallFailed') {
      dispatch(setInstallError({ guid, error: INSTALL_FAILED }));
    }
  };
}

type WithInstallHelpersProps = {|
  addon: AddonType | null,
  version?: AddonVersionType | null,
|};

type WithInstallHelpersPropsFromState = {|
  WrappedComponent: React.ComponentType<any>,
  clientApp: string,
  currentVersion: AddonVersionType | null,
|};

type WithInstallHelpersDefaultProps = {|
  _addonManager: typeof addonManager,
  _getPromotedCategories: typeof getPromotedCategories,
  _log: typeof log,
  _tracking: typeof tracking,
|};

type WithInstallHelpersInternalProps = {|
  ...WithInstallHelpersProps,
  ...WithInstallHelpersPropsFromState,
  ...WithInstallHelpersDefaultProps,
  dispatch: DispatchFunc,
|};

type UninstallParams = {|
  guid: string,
  name: string,
  type: string,
|};

// Props passed to the WrappedComponent.
export type WithInstallHelpersInjectedProps = {|
  enable: () => Promise<any>,
  hasAddonManager: boolean,
  install: () => Promise<any>,
  setCurrentStatus: () => Promise<any>,
  uninstall: (UninstallParams) => Promise<any>,
|};

export class WithInstallHelpers extends React.Component<WithInstallHelpersInternalProps> {
  static defaultProps: WithInstallHelpersDefaultProps = {
    _addonManager: addonManager,
    _getPromotedCategories: getPromotedCategories,
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

  setCurrentStatus(): Promise<void> {
    const { _addonManager, _log, addon, currentVersion, dispatch } = this.props;

    if (!_addonManager.hasAddonManager()) {
      _log.info('No addon manager, cannot set add-on status');
      return Promise.resolve();
    }

    if (!addon) {
      _log.debug('no addon, aborting setCurrentStatus()');
      return Promise.resolve();
    }

    const { guid, type } = addon;
    const payload = { guid, url: currentVersion?.file?.url };

    _log.info('Setting add-on status');
    return _addonManager
      .getAddon(guid)
      .then(
        (clientAddon) => {
          const status = _addonManager.getAddonStatus({
            addon: clientAddon,
            type,
          });

          dispatch(
            setInstallState({
              ...payload,
              status,
              canUninstall: clientAddon.canUninstall,
              version: clientAddon.version,
              name: clientAddon.name,
            }),
          );
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

  enable(): Promise<void> {
    const { _addonManager, _log, _tracking, dispatch, addon } = this.props;

    invariant(addon, 'need an addon to call enable()');

    const { guid, type } = addon;

    return _addonManager
      .enable(guid)
      .then(() => {
        _tracking.sendEvent({
          action: getAddonTypeForTracking(type),
          category: getAddonEventCategory(type, ENABLE_ACTION),
          label: guid,
        });
      })
      .catch((err) => {
        if (err && err.message === SET_ENABLE_NOT_AVAILABLE) {
          _log.info(`addon.setEnabled not available. Unable to enable ${guid}`);
        } else {
          // eslint-disable-next-line amo/only-log-strings
          _log.error(`Error while trying to enable ${guid}: %o`, err);

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

  install(): Promise<void> {
    const {
      _addonManager,
      _getPromotedCategories,
      _log,
      _tracking,
      addon,
      clientApp,
      currentVersion,
      dispatch,
    } = this.props;

    invariant(addon, 'need an addon to call install()');
    invariant(currentVersion, 'need a currentVersion to call install()');

    const { guid, name, type } = addon;
    const { file } = currentVersion;

    if (!file) {
      _log.debug('no file found, aborting install().');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      dispatch({ type: START_DOWNLOAD, payload: { guid } });
      _tracking.sendEvent({
        action: getAddonTypeForTracking(type),
        category: getAddonEventCategory(type, INSTALL_STARTED_ACTION),
        label: guid,
      });

      const installURL = file.url;

      resolve(installURL);
    })
      .then((installURL) => {
        const hash = getFileHash({
          addon,
          installURL,
          version: currentVersion,
        });

        return _addonManager.install(
          installURL || '',
          makeProgressHandler({
            _tracking,
            dispatch,
            guid,
            name,
            type,
          }),
          { hash },
        );
      })
      .then(() => {
        _tracking.sendEvent({
          action: getAddonTypeForTracking(type),
          category: getAddonEventCategory(type, INSTALL_ACTION),
          label: guid,
        });

        // If the add-on is trusted, send an additional event for trusted
        // add-on install.
        const promotedCategories = _getPromotedCategories({ addon, clientApp });
        if (addon.type === ADDON_TYPE_EXTENSION && promotedCategories) {
          _tracking.sendEvent({
            action: promotedCategories.join(', '),
            category: INSTALL_TRUSTED_EXTENSION_CATEGORY,
            label: guid,
          });
        }
      })
      .catch((error) => {
        _log.error(`Install error: ${error}`);

        dispatch(setInstallError({ guid, error: FATAL_INSTALL_ERROR }));
      });
  }

  uninstall({ guid, type }: UninstallParams): Promise<void> {
    const { _addonManager, _log, _tracking, dispatch } = this.props;

    dispatch(setInstallState({ guid, status: UNINSTALLING }));

    const action = getAddonTypeForTracking(type);
    return _addonManager
      .uninstall(guid)
      .then(() => {
        _tracking.sendEvent({
          action,
          category: getAddonEventCategory(type, UNINSTALL_ACTION),
          label: guid,
        });
      })
      .catch((error) => {
        _log.error(`Uninstall error: ${error}`);

        dispatch(setInstallError({ guid, error: FATAL_UNINSTALL_ERROR }));
      });
  }

  render(): React.Node {
    const { WrappedComponent, _addonManager, ...passThroughProps } = this.props;

    // Wrapped components will receive these props.
    const injectedProps: WithInstallHelpersInjectedProps = {
      enable: (...args) => this.enable(...args),
      // We pass a `boolean` value here, not the function.
      hasAddonManager: _addonManager.hasAddonManager(),
      install: (...args) => this.install(...args),
      setCurrentStatus: (...args) => this.setCurrentStatus(...args),
      uninstall: (...args) => this.uninstall(...args),
    };

    return <WrappedComponent {...injectedProps} {...passThroughProps} />;
  }
}

export const withInstallHelpers = (
  WrappedComponent: React.ComponentType<mixed>,
): React.ComponentType<mixed> => {
  // eslint-disable-next-line react/static-property-placement
  WithInstallHelpers.displayName = `WithInstallHelpers(${getDisplayName(
    WrappedComponent,
  )})`;

  const mapStateToProps = (
    state: AppState,
    ownProps: WithInstallHelpersProps,
  ): WithInstallHelpersPropsFromState => {
    const { addon } = ownProps;

    invariant(typeof addon !== 'undefined', 'addon is required');

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
      clientApp: state.api.clientApp,
      currentVersion,
    };
  };

  return connect(mapStateToProps)(WithInstallHelpers);
};
