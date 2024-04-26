/* @flow */
/* global window */
import log from 'amo/logger';
import {
  ADDON_TYPE_STATIC_THEME,
  DISABLED,
  ENABLED,
  GLOBAL_EVENTS,
  GLOBAL_EVENT_STATUS_MAP,
  INACTIVE,
  INSTALL_EVENT_LIST,
  ON_INSTALLING_EVENT,
  ON_OPERATION_CANCELLED_EVENT,
  ON_UNINSTALLED_EVENT,
  SET_ENABLE_NOT_AVAILABLE,
} from 'amo/constants';
import type { InstalledAddonStatus } from 'amo/reducers/installations';

// This is the representation of an add-on in Firefox.
type FirefoxAddon = {|
  canUninstall: boolean,
  description: string,
  id: string,
  isActive: boolean,
  isEnabled: boolean,
  name: string,
  setEnabled: (boolean) => void,
  type: 'extension' | 'theme',
  uninstall: () => void,
  version: string,
|};

export type MozAddonManagerType = {|
  addEventListener: (eventName: string, handler: Function) => void,
  createInstall: ({| url: string, hash?: string | null |}) => Promise<any>,
  getAddonByID: (guid: string) => Promise<FirefoxAddon>,
|};

type PrivilegedNavigatorType = {|
  mozAddonManager: MozAddonManagerType,
|};

type OptionalParams = {
  _mozAddonManager?: MozAddonManagerType,
};

type GetAddonStatusParams = {|
  addon: FirefoxAddon,
  type?: string,
|};

export function getAddonStatus({
  addon,
  type,
}: GetAddonStatusParams): InstalledAddonStatus {
  const { isActive, isEnabled } = addon;

  let status = DISABLED;

  if (isActive && isEnabled) {
    status = ENABLED;
  } else if (ADDON_TYPE_STATIC_THEME !== type && !isActive && isEnabled) {
    // We only use the INACTIVE status for add-ons that are not themes.
    status = INACTIVE;
  }

  return status;
}

export function hasAddonManager({
  navigator,
}: { navigator: PrivilegedNavigatorType } = {}): boolean {
  if (typeof window === 'undefined') {
    /* istanbul ignore next */
    return false;
  }

  return 'mozAddonManager' in (navigator || window.navigator);
}

export function getAddon(
  guid: string,
  { _mozAddonManager = window.navigator.mozAddonManager }: OptionalParams = {},
): Promise<FirefoxAddon> {
  // $FlowFixMe: Deal with cannot-read error.
  if (_mozAddonManager || module.exports.hasAddonManager()) {
    // Resolves a promise with the addon on success.
    return _mozAddonManager.getAddonByID(guid).then((addon) => {
      if (!addon) {
        throw new Error('Addon not found');
      }
      log.debug('Add-on found', addon);

      return addon;
    });
  }
  return Promise.reject(new Error('Cannot check add-on status'));
}

type OptionalInstallParams = {
  ...OptionalParams,
  _log?: typeof log,
  hash?: string | null,
  onIgnoredRejection?: () => void,
};

export function install(
  _url: string,
  eventCallback: Function,
  {
    _log = log,
    _mozAddonManager = window.navigator.mozAddonManager,
    hash,
    onIgnoredRejection = () => {},
  }: OptionalInstallParams = {},
): Promise<void> {
  return _mozAddonManager
    .createInstall({ url: _url, hash })
    .then((installObj) => {
      const callback = (e) => eventCallback(installObj, e);
      for (const event of INSTALL_EVENT_LIST) {
        _log.info(`[install] Adding listener for ${event}`);
        installObj.addEventListener(event, callback);
      }
      return new Promise((resolve, reject) => {
        installObj.addEventListener('onInstallEnded', () => resolve());
        installObj.addEventListener('onInstallFailed', () => reject());
        _log.info('Events to handle the installation initialized.');

        installObj.install().catch((error) => {
          // The `mozAddonManager` has events we can listen to, this error occurs
          // when a user cancels the installation but we are already notified via
          // `onInstallCancelled`.
          // See: https://github.com/mozilla/addons-frontend/issues/8668
          _log.warn(`Ignoring promise rejection during installation: ${error}`);
          onIgnoredRejection();
        });
      });
    });
}

export function uninstall(
  guid: string,
  { _mozAddonManager = window.navigator.mozAddonManager }: OptionalParams = {},
): Promise<void> {
  return getAddon(guid, { _mozAddonManager }).then((addon) => {
    log.info(`Requesting uninstall of ${guid}`);
    return addon.uninstall();
  });
}

type AddonChangeEvent = {|
  id: string,
  needsRestart: boolean,
  type: string,
|};

type HandleChangeEventFunction = (e: AddonChangeEvent) => Promise<void>;

export function addChangeListeners(
  callback: ({|
    guid: string,
    status: $Values<typeof GLOBAL_EVENT_STATUS_MAP>,
    needsRestart: boolean,
    canUninstall: boolean,
  |}) => Promise<void>,
  mozAddonManager: MozAddonManagerType,
  { _log = log }: { _log: typeof log } = {},
): HandleChangeEventFunction {
  function handleChangeEvent(e: AddonChangeEvent) {
    const { id: guid, type, needsRestart } = e;

    // eslint-disable-next-line amo/only-log-strings
    _log.info('Event received: %o', { type, id: guid, needsRestart });

    if (type === ON_OPERATION_CANCELLED_EVENT) {
      // We need to retrieve the correct status for this add-on.
      return getAddon(guid, { _mozAddonManager: mozAddonManager })
        .then((addon) => {
          const status = getAddonStatus({ addon });

          return callback({
            guid,
            status,
            needsRestart,
            canUninstall: addon.canUninstall,
          });
        })
        .catch((error) => {
          // eslint-disable-next-line amo/only-log-strings
          _log.error(
            'Unexpected error after having received onOperationCancelled event: %o',
            error,
          );
        });
    }

    // We cannot retrieve an add-on when it is not yet installed or already
    // uninstalled.
    if ([ON_INSTALLING_EVENT, ON_UNINSTALLED_EVENT].includes(type)) {
      return callback({
        guid,
        status: GLOBAL_EVENT_STATUS_MAP[type],
        needsRestart,
        // We assume that an add-on can be uninstalled by default.
        canUninstall: true,
      });
    }

    // eslint-disable-next-line no-prototype-builtins
    if (GLOBAL_EVENT_STATUS_MAP.hasOwnProperty(type)) {
      return getAddon(guid, { _mozAddonManager: mozAddonManager }).then(
        (addon) => {
          return callback({
            guid,
            status: GLOBAL_EVENT_STATUS_MAP[type],
            needsRestart,
            canUninstall: addon.canUninstall,
          });
        },
      );
    }

    throw new Error(`Unknown global event: ${type}`);
  }

  if (mozAddonManager && mozAddonManager.addEventListener) {
    for (const event of GLOBAL_EVENTS) {
      _log.info(`adding event listener for "${event}"`);
      mozAddonManager.addEventListener(event, handleChangeEvent);
    }

    mozAddonManager.addEventListener(
      ON_OPERATION_CANCELLED_EVENT,
      handleChangeEvent,
    );

    _log.info('Global change event listeners have been initialized');
  } else {
    _log.info('mozAddonManager.addEventListener not available');
  }

  return handleChangeEvent;
}

export function enable(
  guid: string,
  { _mozAddonManager = window.navigator.mozAddonManager }: OptionalParams = {},
): Promise<void> {
  return getAddon(guid, { _mozAddonManager }).then((addon) => {
    log.info(`Enable ${guid}`);
    if (addon.setEnabled) {
      return addon.setEnabled(true);
    }
    throw new Error(SET_ENABLE_NOT_AVAILABLE);
  });
}
