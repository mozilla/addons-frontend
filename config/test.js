// Put any test configuration overrides here.
module.exports = {
  appName: 'test-app-set-from-config',
  // No test should touch the API so seeing this would indicate a bug.
  apiHost: 'http://if-you-see-this-host-file-a-bug',
  allowErrorSimulation: true,
  enableClientConsole: true,
  isDeployed: false,
  enableLogging: false,
};
