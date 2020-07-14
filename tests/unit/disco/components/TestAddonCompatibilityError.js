import * as React from 'react';

import AddonCompatibilityError, {
  AddonCompatibilityErrorBase,
} from 'disco/components/AddonCompatibilityError';
import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ ...props }) {
    return shallowUntilTarget(
      <AddonCompatibilityError i18n={fakeI18n()} {...props} />,
      AddonCompatibilityErrorBase,
    );
  }

  it('renders a notice for old versions of Firefox', () => {
    const root = render({ reason: INCOMPATIBLE_UNDER_MIN_VERSION });
    const content = root.find('.AddonCompatibilityError').render();

    expect(content.text()).toEqual(
      'This add-on does not support your version of Firefox.',
    );
  });

  it('renders a notice for iOS users', () => {
    const root = render({ reason: INCOMPATIBLE_FIREFOX_FOR_IOS });
    const content = root.find('.AddonCompatibilityError').render();

    expect(content.text()).toContain(
      'Firefox for iOS does not currently support add-ons.',
    );
  });

  it('renders a generic message when not FF', () => {
    const root = render({ reason: INCOMPATIBLE_NOT_FIREFOX });
    const content = root.find('.AddonCompatibilityError').render();

    expect(content.text()).toContain(
      'This add-on does not support your browser.',
    );
  });

  it('renders a generic message when reason code not known', () => {
    const root = render({ reason: 'fake reason' });
    const content = root.find('.AddonCompatibilityError').render();

    expect(content.text()).toContain(
      'This add-on does not support your browser.',
    );
  });
});
