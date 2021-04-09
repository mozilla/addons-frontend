/* @flow */
export const VARIANT_CURRENT = 'current-cta';
export const VARIANT_NEW = 'new-cta';

export const EXPERIMENT_CONFIG = {
  id: '20210404_download_cta_experiment',
  variants: [
    { id: VARIANT_CURRENT, percentage: 0.5 },
    { id: VARIANT_NEW, percentage: 0.5 },
  ],
};
