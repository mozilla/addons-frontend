/*
 * This module is a stand-in for the config module
 * when imported on the client.
 * When webpack builds the client-side code it exposes
 * the clientConfig config via the definePlugin as CLIENT_CONFIG.
 */

const clientConfig = new Map();

Object.keys(CLIENT_CONFIG).forEach((key) => {
  clientConfig.set(key, CLIENT_CONFIG[key]);
});

module.exports = clientConfig;
