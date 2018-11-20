import * as React from 'react';

import { getErrorMessage } from 'core/utils/addons';
import AddonInstallError, {
  AddonInstallErrorBase,
} from 'amo/components/AddonInstallError';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import { FATAL_ERROR } from 'core/constants';

function renderProps({ i18n = fakeI18n(), ...customProps } = {}) {
  return {
    i18n,
    ...customProps,
  };
}

function render(otherProps = {}) {
  const props = renderProps({ ...otherProps });
  return shallowUntilTarget(
    <AddonInstallError {...props} />,
    AddonInstallErrorBase,
  );
}

describe(__filename, () => {
  it('does not render an install error if there is no error', () => {
    const root = render({ error: null });

    expect(root.find('.Addon-header-install-error')).toHaveLength(0);
  });

  it('renders an install error if there is one', () => {
    const error = FATAL_ERROR;
    const root = render({ error });

    expect(root.find('.Addon-header-install-error')).toHaveLength(1);
    expect(root.find('.Addon-header-install-error')).toHaveProp(
      'children',
      getErrorMessage({ i18n: fakeI18n(), error }),
    );
  });
});
