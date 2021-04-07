/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import GetFirefoxButton from 'amo/components/GetFirefoxButton';
import { withExperiment } from 'amo/withExperiment';
import type { Props } from 'amo/components/GetFirefoxButton';
import type { WithExperimentInjectedProps } from 'amo/withExperiment';

export const VARIANT_CURRENT = 'current-cta';
export const VARIANT_NEW = 'new-cta';

export const EXPERIMENT_CONFIG = {
  id: '20210404_download_cta_experiment',
  variants: [
    { id: VARIANT_CURRENT, percentage: 0.5 },
    { id: VARIANT_NEW, percentage: 0.5 },
  ],
};

type InternalProps = {|
  ...Props,
  ...WithExperimentInjectedProps,
|};

export const ExperimentalGetFirefoxButtonBase = (
  props: InternalProps,
): React.Node => {
  const { addon, buttonType, className, variant } = props;

  return (
    <GetFirefoxButton
      addon={addon}
      buttonType={buttonType}
      className={className}
      useNewVersion={variant === VARIANT_NEW}
    />
  );
};

const ExperimentalGetFirefoxButton: React.ComponentType<Props> = compose(
  withExperiment(EXPERIMENT_CONFIG),
)(ExperimentalGetFirefoxButtonBase);

export default ExperimentalGetFirefoxButton;
