import * as React from 'react';

import AddonInstallError, {
  AddonInstallErrorBase,
} from 'amo/components/AddonInstallError';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import { FATAL_ERROR } from 'amo/constants';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      error: null,
      ...props,
    };
    return shallowUntilTarget(
      <AddonInstallError i18n={fakeI18n()} {...allProps} />,
      AddonInstallErrorBase,
    );
  };

  it('does not render an install error if there is no error', () => {
    const root = render();

    expect(root.find('.AddonInstallError')).toHaveLength(0);
  });

  it('renders an install error if there is one', () => {
    const error = FATAL_ERROR;
    const root = render({ error });

    expect(root.find('.AddonInstallError')).toHaveLength(1);
    expect(root.find('.AddonInstallError').children()).toHaveText(
      'An unexpected error occurred.',
    );
  });
});
