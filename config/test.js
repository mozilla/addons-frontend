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
  
  // Because tests run on the server by default and experiments are client-side
  // only, we don't want to have any active experiments. Otherwise tests try to
  // send an enrollment event, which triggers an exception.
  experiments: null,
};
