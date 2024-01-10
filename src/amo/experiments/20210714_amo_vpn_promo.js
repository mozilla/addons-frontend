/* @flow */
import { CLIENT_APP_ANDROID } from 'amo/constants';
import { NOT_IN_EXPERIMENT } from 'amo/withExperiment';
import type { RegionCodeType } from 'amo/reducers/api';
import type { ExperimentConfig } from 'amo/withExperiment';

export const VARIANT_SHOW = 'show-promo';
export const VARIANT_HIDE = 'hide-promo';

export const shouldExcludeUser = ({
  clientApp,
  regionCode,
}: {|
  clientApp: string,
  regionCode: RegionCodeType,
|}): boolean => {
  return (
    clientApp === CLIENT_APP_ANDROID || !['US', 'DE', 'FR'].includes(regionCode)
  );
};

export const EXPERIMENT_CONFIG: ExperimentConfig = {
  id: '20210714_amo_vpn_promo',
  variants: [
    { id: VARIANT_SHOW, percentage: 0.05 },
    { id: VARIANT_HIDE, percentage: 0.05 },
    { id: NOT_IN_EXPERIMENT, percentage: 0.9 },
  ],

  shouldExcludeUser({ state }) {
    const { clientApp, regionCode } = state.api;

    return shouldExcludeUser({ clientApp, regionCode });
  },
};
