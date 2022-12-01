/* @flow */
import { CLIENT_APP_ANDROID } from 'amo/constants';
import type { ExperimentConfig } from 'amo/withExperiment';

export const VARIANT_SHOW = 'show-suggestions';
export const VARIANT_HIDE = 'hide-suggestions';

export const shouldExcludeUser = ({
  clientApp,
}: {|
  clientApp: string,
|}): boolean => {
  return clientApp === CLIENT_APP_ANDROID;
};

export const EXPERIMENT_CONFIG: ExperimentConfig = {
  id: '20221130_amo_detail_category',
  variants: [
    { id: VARIANT_SHOW, percentage: 0.5 },
    { id: VARIANT_HIDE, percentage: 0.5 },
  ],
  shouldExcludeUser({ state }) {
    const { clientApp } = state.api;

    return shouldExcludeUser({ clientApp });
  },
};
