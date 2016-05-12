import { installEventList } from 'disco/constants';


export class AddonManager {
  constructor(id, url, eventCallback, {mozAddonManager = window.navigator.mozAddonManager} = {}) {
    if (typeof mozAddonManager === 'undefined') {
      throw new Error('mozAddonManager not available');
    }
    this.id = id;
    this.url = url;
    this.mozAddonManager = mozAddonManager;
    this.eventCallback = eventCallback;
  }

  handleEvent = (e) => {
    this.eventCallback(e, this.id);
  }

  getAddon() {
    // Resolves a promise with the addon on success.
    return this.mozAddonManager.getAddonByID(this.id)
      .then((addon) => {
        if (!addon) {
          return Promise.reject(new Error('Addon not found'));
        }
        return Promise.resolve(addon);
      });
  }

  install() {
    return this.mozAddonManager.createInstall({url: this.url})
      .then((installObj) => {
        for (const event of installEventList) {
          installObj.addEventListener(event, this.handleEvent);
        }
        return installObj.install();
      });
  }

  uninstall() {
    return this.getAddon()
      .then((addon) => {
        const addonUninstall = addon.uninstall();
        return addonUninstall
          .then((result) => {
            // Until bug 1268075 this will resolve with a boolean
            // for success and failure.
            if (result === false) {
              return Promise.reject(new Error('Uninstall failed'));
            }
            // If uninstallation succeeded return the original
            // promise.
            return addonUninstall;
          });
      });
  }
}
