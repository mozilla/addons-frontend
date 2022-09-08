/* @flow */
import { NOT_IN_EXPERIMENT } from 'amo/withExperiment';
import type { ExperimentConfig } from 'amo/withExperiment';

export const VARIANT_A = 'a-branch';
export const VARIANT_B = 'b-branch';

export const EXPERIMENT_CONFIG: ExperimentConfig = {
  id: '20220908_amo_dimension_test',
  variants: [
    { id: VARIANT_A, percentage: 0.45 },
    { id: VARIANT_B, percentage: 0.45 },
    { id: NOT_IN_EXPERIMENT, percentage: 0.1 },
  ],
};
