// Put any test configuration overrides here.
import { apiDevHost } from './lib/shared';

module.exports = {
  apiHost: apiDevHost,
  taarParamsToUse: ['fakeTestParam', 'platform', 'telemetry-client-id'],
};
