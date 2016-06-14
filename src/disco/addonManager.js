import log from 'core/logger';

import {
  globalEvents,
  globalEventStatusMap,
  installEventList,
} from 'disco/constants';


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

export function install(url, eventCallback,
  { _mozAddonManager = window.navigator.mozAddonManager } = {}) {
  return _mozAddonManager.createInstall({ url })
    .then((installObj) => {
      const callback = (e) => eventCallback(installObj, e);
      for (const event of installEventList) {
        log.info(`[install] Adding listener for ${event}`);
        installObj.addEventListener(event, callback);
      }
      log.info('Events to handle the installation initialized.');
      return installObj.install();
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
      log.info('Uninstall complete');
      return;
    });
}

export function addChangeListeners(callback, mozAddonManager) {
  function handleChangeEvent(e) {
    const { id, type, needsRestart } = e;
    log.info('Event received', { type, id, needsRestart });
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
