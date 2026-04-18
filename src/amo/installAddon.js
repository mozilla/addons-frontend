/* @flow */
/* global window */
import { oneLine } from 'common-tags';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';

import { setInstallError, setInstallState } from 'amo/reducers/installations';
import log from 'amo/logger';
import tracking, {
  getAddonEventCategory,
  getAddonEventParams,
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
import { getFileHash, getPromotedCategory } from 'amo/utils/addons';
import {
  injectUTMParams as defaultInjectUTMParams,
  removeUTMParams as defaultRemoveUTMParams,
} from 'amo/utils/installAttribution';
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
  _removeUTMParams: typeof defaultRemoveUTMParams,
  _tracking: typeof tracking,
  addon: AddonType,
  dispatch: DispatchFunc,
  guid: string,
  type: string,
|};

export function makeProgressHandler({
  _removeUTMParams,
  _tracking,
  addon,
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
          category: getAddonEventCategory(type, INSTALL_DOWNLOAD_FAILED_ACTION),
          params: getAddonEventParams(addon, window.location.pathname),
        });
        _removeUTMParams();
      }
    } else if (event.type === 'onInstallCancelled') {
      dispatch({
        type: INSTALL_CANCELLED,
        payload: { guid },
      });

      _tracking.sendEvent({
        category: getAddonEventCategory(type, INSTALL_CANCELLED_ACTION),
        params: getAddonEventParams(addon, window.location.pathname),
      });
      _removeUTMParams();
    } else if (event.type === 'onInstallFailed') {
      dispatch(setInstallError({ guid, error: INSTALL_FAILED }));
      _removeUTMParams();
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
  installSource: string | null,
|};

type WithInstallHelpersDefaultProps = {|
  _addonManager: typeof addonManager,
  _getPromotedCategory: typeof getPromotedCategory,
  _injectUTMParams: typeof defaultInjectUTMParams,
  _log: typeof log,
  _removeUTMParams: typeof defaultRemoveUTMParams,
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
    _getPromotedCategory: getPromotedCategory,
    _injectUTMParams: defaultInjectUTMParams,
    _log: log,
    _removeUTMParams: defaultRemoveUTMParams,
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
          category: getAddonEventCategory(type, ENABLE_ACTION),
          params: getAddonEventParams(addon, window.location.pathname),
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
      _getPromotedCategory,
      _injectUTMParams,
      _log,
      _removeUTMParams,
      _tracking,
      addon,
      clientApp,
      currentVersion,
      dispatch,
      installSource,
    } = this.props;

    invariant(addon, 'need an addon to call install()');
    invariant(currentVersion, 'need a currentVersion to call install()');

    const { guid, type } = addon;
    const { file } = currentVersion;

    if (!file) {
      _log.debug('no file found, aborting install().');
      return Promise.resolve();
    }

    // Inject UTM params into the page URL so Firefox can read them at
    // install time for attribution.
    if (installSource) {
      _injectUTMParams(installSource);
    }

    return new Promise((resolve) => {
      dispatch({ type: START_DOWNLOAD, payload: { guid } });
      _tracking.sendEvent({
        category: getAddonEventCategory(type, INSTALL_STARTED_ACTION),
        params: {
          ...getAddonEventParams(addon, window.location.pathname),
          trusted: !!_getPromotedCategory({ addon, clientApp }),
        },
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
            _removeUTMParams,
            _tracking,
            addon,
            dispatch,
            guid,
            type,
          }),
          { hash },
        );
      })
      .then(() => {
        const promotedCategory = _getPromotedCategory({ addon, clientApp });
        _tracking.sendEvent({
          category: getAddonEventCategory(type),
          params: {
            ...getAddonEventParams(addon, window.location.pathname),
            trusted: !!promotedCategory,
          },
        });

        // If the add-on is trusted, send an additional event for trusted
        // add-on install.
        if (addon.type === ADDON_TYPE_EXTENSION && promotedCategory) {
          _tracking.sendEvent({
            category: INSTALL_TRUSTED_EXTENSION_CATEGORY,
            params: {
              ...getAddonEventParams(addon, window.location.pathname),
              trusted: true,
            },
          });
        }

        // Clean up UTM params injected before install. This is called on
        // every exit path (success, failure, cancel) to ensure the URL is
        // always restored. removeUTMParams() is idempotent.
        _removeUTMParams();
      })
      .catch((error) => {
        _log.error(`Install error: ${error}`);

        _removeUTMParams();
        dispatch(setInstallError({ guid, error: FATAL_INSTALL_ERROR }));
      });
  }

  uninstall({ guid, type }: UninstallParams): Promise<void> {
    const { _addonManager, _log, _tracking, addon, dispatch } = this.props;

    dispatch(setInstallState({ guid, status: UNINSTALLING }));

    return _addonManager
      .uninstall(guid)
      .then(() => {
        if (addon) {
          _tracking.sendEvent({
            category: getAddonEventCategory(type, UNINSTALL_ACTION),
            params: getAddonEventParams(addon, window.location.pathname),
          });
        }
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
      installSource: state.addonInstallSource.installSource,
    };
  };

  return connect(mapStateToProps)(WithInstallHelpers);
};
