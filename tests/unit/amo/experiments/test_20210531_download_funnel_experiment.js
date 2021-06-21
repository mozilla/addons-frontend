import { EXPERIMENT_CONFIG } from 'amo/experiments/20210531_download_funnel_experiment';
import { dispatchClientMetadata, userAgents } from 'tests/unit/helpers';

describe(__filename, () => {
  const { shouldExcludeUser } = EXPERIMENT_CONFIG;

  it.each([
    ...userAgents.firefox,
    ...userAgents.firefoxAndroid,
    ...userAgents.firefoxIOS,
  ])('excludes Firefox users: %s', (userAgent) => {
    const { state } = dispatchClientMetadata({ userAgent });
    expect(shouldExcludeUser({ state })).toEqual(true);
  });

  it.each([
    ...userAgents.androidWebkit,
    ...userAgents.chromeAndroid,
    ...userAgents.chrome,
  ])('includes non-Firefox users: %s', (userAgent) => {
    const { state } = dispatchClientMetadata({ userAgent });
    expect(shouldExcludeUser({ state })).toEqual(false);
  });
});
