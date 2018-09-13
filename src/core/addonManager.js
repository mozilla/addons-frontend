/* @flow */
/* global window */
import log from 'core/logger';
import {
  DISABLED,
  ENABLED,
  GLOBAL_EVENTS,
  GLOBAL_EVENT_STATUS_MAP,
  INACTIVE,
  INSTALL_EVENT_LIST,
  SET_ENABLE_NOT_AVAILABLE,
} from 'core/constants';
import { addQueryParams, isTheme } from 'core/utils';

// This is the representation of an add-on in Firefox.
type ClientAddon = {|
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

type MozAddonManagerType = {|
  addEventListener: (eventName: string, handler: Function) => void,
  createInstall: ({| url: string |}) => Promise<any>,
  getAddonByID: (guid: string) => Promise<ClientAddon>,
  permissionPromptsEnabled: boolean,
|};

type NavigatorType = {|
  mozAddonManager: MozAddonManagerType,
|};

type OptionalParams = {|
  _mozAddonManager?: MozAddonManagerType,
|};

type GetAddonStatusParams = {|
  addon: ClientAddon,
  type: string,
|};

export function getAddonStatus({ addon, type }: GetAddonStatusParams) {
  const { isActive, isEnabled } = addon;

  let status = DISABLED;

  if (isActive && isEnabled) {
    status = ENABLED;
  } else if (!isTheme(type) && !isActive && isEnabled) {
    // We only use the INACTIVE status for add-ons that are not themes.
    status = INACTIVE;
  }

  return status;
}

export function hasAddonManager({
  navigator,
}: { navigator: NavigatorType } = {}) {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'mozAddonManager' in (navigator || window.navigator);
}

export function hasPermissionPromptsEnabled({
  navigator,
}: { navigator: NavigatorType } = {}) {
  if (module.exports.hasAddonManager({ navigator })) {
    const _navigator = navigator || window.navigator;
    return _navigator.mozAddonManager.permissionPromptsEnabled;
  }
  return undefined;
}

export function getAddon(
  guid: string,
  { _mozAddonManager = window.navigator.mozAddonManager }: OptionalParams = {},
) {
  if (_mozAddonManager || module.exports.hasAddonManager()) {
    // Resolves a promise with the addon on success.
    return _mozAddonManager.getAddonByID(guid).then((addon) => {
      if (!addon) {
        throw new Error('Addon not found');
      }
      log.info('Add-on found', addon);
      return addon;
    });
  }
  return Promise.reject(new Error('Cannot check add-on status'));
}

type OptionalInstallParams = {|
  ...OptionalParams,
  src: string,
|};

export function install(
  _url: string | void,
  eventCallback: Function,
  {
    _mozAddonManager = window.navigator.mozAddonManager,
    src,
  }: OptionalInstallParams = {},
) {
  if (src === undefined) {
    return Promise.reject(new Error('No src for add-on install'));
  }
  const url = addQueryParams(_url, { src });

  return _mozAddonManager.createInstall({ url }).then((installObj) => {
    const callback = (e) => eventCallback(installObj, e);
    for (const event of INSTALL_EVENT_LIST) {
      log.info(`[install] Adding listener for ${event}`);
      installObj.addEventListener(event, callback);
    }
    return new Promise((resolve, reject) => {
      installObj.addEventListener('onInstallEnded', () => resolve());
      installObj.addEventListener('onInstallFailed', () => reject());
      log.info('Events to handle the installation initialized.');
      installObj.install();
    });
  });
}

export function uninstall(
  guid: string,
  { _mozAddonManager = window.navigator.mozAddonManager }: OptionalParams = {},
) {
  return getAddon(guid, { _mozAddonManager })
    .then((addon) => {
      log.info(`Requesting uninstall of ${guid}`);
      return addon.uninstall();
    })
    .then((result) => {
      // Until bug 1268075 this will resolve with a boolean
      // for success and failure.
      if (result === false) {
        throw new Error('Uninstall failed');
      }
    });
}

type GlobalEvent = {|
  id: string,
  needsRestart: boolean,
  type: string,
|};

export function addChangeListeners(
  callback: Function,
  mozAddonManager: MozAddonManagerType,
) {
  function handleChangeEvent(e: GlobalEvent) {
    const { id, type, needsRestart } = e;

    log.info('Event received', { type, id, needsRestart });

    // eslint-disable-next-line no-prototype-builtins
    if (GLOBAL_EVENT_STATUS_MAP.hasOwnProperty(type)) {
      return callback({
        guid: id,
        status: GLOBAL_EVENT_STATUS_MAP[type],
        needsRestart,
      });
    }
    throw new Error(`Unknown global event: ${type}`);
  }

  if (mozAddonManager && mozAddonManager.addEventListener) {
    for (const event of GLOBAL_EVENTS) {
      log.info(`adding event listener for "${event}"`);
      mozAddonManager.addEventListener(event, handleChangeEvent);
    }

    log.info('Global change event listeners have been initialized');
  } else {
    log.info('mozAddonManager.addEventListener not available');
  }
  return handleChangeEvent;
}

export function enable(
  guid: string,
  { _mozAddonManager = window.navigator.mozAddonManager }: OptionalParams = {},
) {
  return getAddon(guid, { _mozAddonManager }).then((addon) => {
    log.info(`Enable ${guid}`);
    if (addon.setEnabled) {
      return addon.setEnabled(true);
    }
    throw new Error(SET_ENABLE_NOT_AVAILABLE);
  });
}
