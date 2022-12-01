import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'amo/constants';
import { EXPERIMENT_CONFIG } from 'amo/experiments/20221130_amo_detail_category';
import { dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  const { shouldExcludeUser } = EXPERIMENT_CONFIG;

  it('includes users on firefox', () => {
    const { state } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    });
    expect(shouldExcludeUser({ state })).toEqual(false);
  });

  it('excludes users on android', () => {
    const { state } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
    });
    expect(shouldExcludeUser({ state })).toEqual(true);
  });
});
