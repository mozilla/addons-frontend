// Put any test configuration overrides here.
module.exports = {
  // No test should touch the API so seeing this would indicate a bug.
  apiHost: 'http://if-you-see-this-host-file-a-bug',
  allowErrorSimulation: true,
  isDeployed: false,
  loggingLevel: 'debug',
  // We do not enable the request ID feature because httpContext eats all the
  // memory we have (and more...).
  enableRequestID: false,

  mozillaUserId: 1337,
  
  // Disable any active experiments, otherwise tests try to send an enrollment
  // event.
  // We cannot just use an empty object here, as the configs are merged.
  experiments: {
    '20210404_download_cta_experiment': false,
  },
};
