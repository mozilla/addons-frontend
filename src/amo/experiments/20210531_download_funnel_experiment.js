/* @flow */
import { FIREFOX_USERS } from 'amo/constants';

export const VARIANT_CURRENT = 'current-link';
export const VARIANT_NEW = 'new-link';

export const EXPERIMENT_CONFIG = {
  excludedGroups: [FIREFOX_USERS],
  id: '20210531_download_funnel_experiment',
  variants: [
    { id: VARIANT_CURRENT, percentage: 0.5 },
    { id: VARIANT_NEW, percentage: 0.5 },
  ],
};
