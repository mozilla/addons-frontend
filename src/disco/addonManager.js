import { installEventList } from 'disco/constants';


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
