/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import {
  VARIANT_NEW,
  EXPERIMENT_CONFIG,
} from 'amo/experiments/downloadCtaExperiment20210404';
import { withExperiment } from 'amo/withExperiment';
import type { Props } from 'amo/components/InstallButtonWrapper';
import type { WithExperimentInjectedProps } from 'amo/withExperiment';

type InternalProps = {|
  ...Props,
  ...WithExperimentInjectedProps,
|};

export const ExperimentalInstallButtonWrapperBase = (
  props: InternalProps,
): React.Node => {
  const {
    addon,
    className,
    defaultButtonText,
    getFirefoxButtonType,
    puffy,
    variant,
    version,
  } = props;

  return (
    <InstallButtonWrapper
      addon={addon}
      className={className}
      defaultButtonText={defaultButtonText}
      getFirefoxButtonType={getFirefoxButtonType}
      puffy={puffy}
      useNewVersion={variant === VARIANT_NEW}
      version={version}
    />
  );
};

const ExperimentalInstallButtonWrapper: React.ComponentType<Props> = compose(
  withExperiment(EXPERIMENT_CONFIG),
)(ExperimentalInstallButtonWrapperBase);

export default ExperimentalInstallButtonWrapper;
