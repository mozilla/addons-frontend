import path from 'path';

const fixturesPath = path.join(__dirname, '..', 'tests', '__fixtures__');

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

  // Force-disable Sentry
  publicSentryDsn: null,

  // We use a fake/incomplete file for the test suite.
  loadableStatsFile: path.join(fixturesPath, 'loadable-stats.json'),

  mozillaUserId: 1337,
};
