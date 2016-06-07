import log from 'core/logger';

import {
  globalEvents,
  installEventList,
  ON_ENABLE,
  ON_DISABLE,
  ON_INSTALLING,
  ON_UNINSTALLING,
  ON_INSTALLED,
  ON_UNINSTALLED,
} from 'disco/constants';


export function getAddon(guid, {_mozAddonManager = window.navigator.mozAddonManager} = {}) {
  // Resolves a promise with the addon on success.
  return _mozAddonManager.getAddonByID(guid)
    .then((addon) => {
      if (!addon) {
        throw new Error('Addon not found');
      }
      return addon;
    });
}

export function install(url, eventCallback,
  {_mozAddonManager = window.navigator.mozAddonManager} = {}) {
  return _mozAddonManager.createInstall({url})
    .then((installObj) => {
      const callback = (e) => eventCallback(installObj, e);
      for (const event of installEventList) {
        installObj.addEventListener(event, callback);
      }
      return installObj.install();
    });
}

export function uninstall(guid, {_mozAddonManager = window.navigator.mozAddonManager} = {}) {
  return getAddon(guid, {_mozAddonManager})
    .then((addon) => addon.uninstall())
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
    const payload = { guid: id, needsRestart };
    log.info('Event received', type, id, needsRestart);
    switch (type) {
      case 'onDisabled':
        callback({type: ON_DISABLE, payload});
        break;
      case 'onEnabled':
        callback({type: ON_ENABLE, payload});
        break;
      case 'onInstalling':
        callback({type: ON_INSTALLING, payload});
        break;
      case 'onInstalled':
        callback({type: ON_INSTALLED, payload});
        break;
      case 'onUninstalling':
        callback({type: ON_UNINSTALLING, payload});
        break;
      case 'onUninstalled':
        callback({type: ON_UNINSTALLED, payload});
        break;
      default:
        throw new Error(`Unknown global event: ${type}`);
    }
  }

  if (mozAddonManager && mozAddonManager.addEventListener) {
    for (const event of globalEvents) {
      mozAddonManager.addEventListener(event, handleChangeEvent);
    }
  } else {
    log.info('mozAddonManager.addEventListener not available');
  }
  return handleChangeEvent;
}
