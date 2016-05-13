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
        const callback = (e) => this.eventCallback(installObj, e, this.id);
        for (const event of installEventList) {
          installObj.addEventListener(event, callback);
        }
        return installObj.install();
      });
  }

  uninstall() {
    return this.getAddon()
      .then((addon) => addon.uninstall())
      .then((result) => {
        // Until bug 1268075 this will resolve with a boolean
        // for success and failure.
        if (result === false) {
          return Promise.reject(new Error('Uninstall failed'));
        }
        // eslint-disable-next-line consistent-return
        return;
      });
  }
}
