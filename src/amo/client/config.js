/*
 * This module is a stand-in for the config module
 * when imported on the client.
 * When webpack builds the client-side code it exposes
 * the clientConfig config via the definePlugin as CLIENT_CONFIG.
 */
import { oneLine } from 'common-tags';

export class ClientConfig {
  constructor(objData) {
    // This Object.assign keeps the config data private.
    Object.assign(this, {
      // eslint-disable-next-line no-prototype-builtins
      has: (key) => objData.hasOwnProperty(key),

      get: (key) => {
        if (this.has(key)) {
          return objData[key];
        }
        throw new Error(oneLine`Key "${key}" was not found in clientConfig. Check the
          key has been added to clientConfigKeys`);
      },
    });
  }
}

export default new ClientConfig({
  ...CLIENT_CONFIG,
  client: true,
  server: false,
});
