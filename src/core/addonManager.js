/* global window */

import log from 'core/logger';
import {
  globalEvents,
  globalEventStatusMap,
  SET_ENABLE_NOT_AVAILABLE,
} from 'disco/constants';
import {
  installEventList,
} from 'core/constants';
import { addQueryParams } from 'core/utils';


export function getAddon(guid, { _mozAddonManager = window.navigator.mozAddonManager } = {}) {
  // Resolves a promise with the addon on success.
  return _mozAddonManager.getAddonByID(guid)
    .then((addon) => {
      if (!addon) {
        throw new Error('Addon not found');
      }
      log.info('Add-on found', addon);
      return addon;
    });
}

export function install(_url, eventCallback,
  { _mozAddonManager = window.navigator.mozAddonManager } = {}) {
  const url = addQueryParams(_url, { src: 'discovery-promo' });

  return _mozAddonManager.createInstall({ url })
    .then((installObj) => {
      const callback = (e) => eventCallback(installObj, e);
      for (const event of installEventList) {
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

export function uninstall(guid, { _mozAddonManager = window.navigator.mozAddonManager } = {}) {
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
      return;
    });
}

export function addChangeListeners(callback, mozAddonManager) {
  function handleChangeEvent(e) {
    const { id, type, needsRestart } = e;
    log.info('Event received', { type, id, needsRestart });
    // eslint-disable-next-line no-prototype-builtins
    if (globalEventStatusMap.hasOwnProperty(type)) {
      return callback({ guid: id, status: globalEventStatusMap[type], needsRestart });
    }
    throw new Error(`Unknown global event: ${type}`);
  }

  if (mozAddonManager && mozAddonManager.addEventListener) {
    for (const event of globalEvents) {
      log.info(`adding event listener for "${event}"`);
      mozAddonManager.addEventListener(event, handleChangeEvent);
    }
    log.info('Global change event listeners have been initialized');
  } else {
    log.info('mozAddonManager.addEventListener not available');
  }
  return handleChangeEvent;
}

export function enable(guid, { _mozAddonManager = window.navigator.mozAddonManager } = {}) {
  return getAddon(guid, { _mozAddonManager })
    .then((addon) => {
      log.info(`Enable ${guid}`);
      if (addon.setEnabled) {
        return addon.setEnabled(true);
      }
      throw new Error(SET_ENABLE_NOT_AVAILABLE);
    });
}
