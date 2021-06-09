/* @flow */
import { isFirefox } from 'amo/utils/compatibility';
import type { ExperimentConfig } from 'amo/withExperiment';

export const VARIANT_CURRENT = 'current-link';
export const VARIANT_NEW = 'new-link';

export const EXPERIMENT_CONFIG: ExperimentConfig = {
  id: '20210531_download_funnel_experiment',
  variants: [
    { id: VARIANT_CURRENT, percentage: 0.5 },
    { id: VARIANT_NEW, percentage: 0.5 },
  ],
  // Exclude Firefox users.
  shouldExcludeUser(state) {
    const { userAgentInfo } = state.api;
    return isFirefox({ userAgentInfo });
  },
};
