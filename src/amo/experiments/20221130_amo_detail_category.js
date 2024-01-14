/* @flow */
import { CLIENT_APP_ANDROID } from 'amo/constants';
import type { ExperimentConfig } from 'amo/withExperiment';

export const VARIANT_SHOW_TOP = 'show-suggestions-top';
export const VARIANT_SHOW_MIDDLE = 'show-suggestions-middle';
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
    { id: VARIANT_SHOW_TOP, percentage: 0.1 },
    { id: VARIANT_SHOW_MIDDLE, percentage: 0.1 },
    { id: VARIANT_HIDE, percentage: 0.8 },
  ],

  shouldExcludeUser({ state }) {
    const { clientApp } = state.api;

    return shouldExcludeUser({ clientApp });
  },
};
