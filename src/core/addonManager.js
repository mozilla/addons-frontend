/* global window */
import log from 'core/logger';
import {
  GLOBAL_EVENT_STATUS_MAP,
  GLOBAL_EVENTS,
  INSTALL_EVENT_LIST,
  SET_ENABLE_NOT_AVAILABLE,
} from 'core/constants';
import { addQueryParams } from 'core/utils';

export function hasAddonManager({ navigator } = {}) {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'mozAddonManager' in (navigator || window.navigator);
}

export function hasPermissionPromptsEnabled({ navigator } = {}) {
  if (module.exports.hasAddonManager({ navigator })) {
    const _navigator = navigator || window.navigator;
    return _navigator.mozAddonManager.permissionPromptsEnabled;
  }
  return undefined;
}

export function getAddon(
  guid,
  { _mozAddonManager = window.navigator.mozAddonManager } = {},
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

export function install(
  _url,
  eventCallback,
  { _mozAddonManager = window.navigator.mozAddonManager, src } = {},
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
  guid,
  { _mozAddonManager = window.navigator.mozAddonManager } = {},
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

export function addChangeListeners(callback, mozAddonManager) {
  function handleChangeEvent(e) {
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
  guid,
  { _mozAddonManager = window.navigator.mozAddonManager } = {},
) {
  return getAddon(guid, { _mozAddonManager }).then((addon) => {
    log.info(`Enable ${guid}`);
    if (addon.setEnabled) {
      return addon.setEnabled(true);
    }
    throw new Error(SET_ENABLE_NOT_AVAILABLE);
  });
}
