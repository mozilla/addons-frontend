import * as React from 'react';

import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import ExperimentalInstallButtonWrapper, {
  ExperimentalInstallButtonWrapperBase,
} from 'amo/components/ExperimentalInstallButtonWrapper';
import { GET_FIREFOX_BUTTON_TYPE_ADDON } from 'amo/components/GetFirefoxButton';
import {
  VARIANT_CURRENT,
  VARIANT_NEW,
} from 'amo/experiments/downloadCtaExperiment20210404';
import {
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  fakeAddon,
  fakeVersion,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    return shallowUntilTarget(
      <ExperimentalInstallButtonWrapper {...props} />,
      ExperimentalInstallButtonWrapperBase,
    );
  }

  it('renders an InstallButtonWrapper component', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    const className = 'some-class-name';
    const defaultButtonText = 'Some button text';
    const getFirefoxButtonType = GET_FIREFOX_BUTTON_TYPE_ADDON;
    const puffy = true;
    const version = createInternalVersionWithLang(fakeVersion);

    const root = render({
      addon,
      className,
      defaultButtonText,
      getFirefoxButtonType,
      puffy,
      variant: VARIANT_NEW,
      version,
    });
    const iBWrapper = root.find(InstallButtonWrapper);
    expect(iBWrapper).toHaveProp('addon', addon);
    expect(iBWrapper).toHaveProp('className', className);
    expect(iBWrapper).toHaveProp('defaultButtonText', defaultButtonText);
    expect(iBWrapper).toHaveProp('getFirefoxButtonType', getFirefoxButtonType);
    expect(iBWrapper).toHaveProp('puffy', puffy);
    expect(iBWrapper).toHaveProp('useNewVersion', true);
    expect(iBWrapper).toHaveProp('version', version);
  });

  it.each([
    [true, VARIANT_NEW],
    [false, VARIANT_CURRENT],
  ])('passes %s for useNewVersion when variant is %s', (expected, variant) => {
    const root = render({ variant });
    expect(root.find(InstallButtonWrapper)).toHaveProp(
      'useNewVersion',
      expected,
    );
  });
});
