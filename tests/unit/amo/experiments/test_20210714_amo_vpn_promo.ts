import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'amo/constants';
import { EXPERIMENT_CONFIG } from 'amo/experiments/20210714_amo_vpn_promo';
import { dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  const {
    shouldExcludeUser,
  } = EXPERIMENT_CONFIG;
  const acceptedRegions = ['US', 'DE', 'FR'];
  it.each(acceptedRegions)('includes users with a region code of: %s on desktop', (regionCode) => {
    const {
      state,
    } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      regionCode,
    });
    expect(shouldExcludeUser({
      state,
    })).toEqual(false);
  });
  it.each(acceptedRegions)('excludes users with a locale of: %s on android', (regionCode) => {
    const {
      state,
    } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
      regionCode,
    });
    expect(shouldExcludeUser({
      state,
    })).toEqual(true);
  });
  // A sampling of popular regions
  it.each(['CN', 'IN', 'BR'])('excludes users with a locale of: %s on desktop', (regionCode) => {
    const {
      state,
    } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      regionCode,
    });
    expect(shouldExcludeUser({
      state,
    })).toEqual(true);
  });
});