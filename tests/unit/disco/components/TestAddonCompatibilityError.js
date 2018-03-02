import * as React from 'react';

import AddonCompatibilityError, {
  AddonCompatibilityErrorBase,
} from 'disco/components/AddonCompatibilityError';
import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


describe('AddonCompatibilityError', () => {
  function render({ ...props }) {
    const { store } = dispatchClientMetadata();

    return shallowUntilTarget(
      <AddonCompatibilityError
        i18n={fakeI18n()}
        store={store}
        minVersion={null}
        {...props}
      />,
      AddonCompatibilityErrorBase
    );
  }

  it('renders a notice for old versions of Firefox', () => {
    const root = render({
      minVersion: '11.0',
      reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      userAgentInfo: { browser: { name: 'Firefox', version: '8.0' }, os: {} },
    });
    const content = root.find('.AddonCompatibilityError').render();

    expect(content.text()).toEqual(
      'This add-on does not support your version of Firefox.');
  });

  it('renders a notice for iOS users', () => {
    const root = render({
      reason: INCOMPATIBLE_FIREFOX_FOR_IOS,
      userAgentInfo: { browser: { name: 'Firefox' }, os: { name: 'iOS' } },
    });
    const content = root.find('.AddonCompatibilityError').render();

    expect(content.text()).toContain(
      'Firefox for iOS does not currently support add-ons.');
  });

  it('renders a generic message when reason code not known', () => {
    const root = render({ reason: 'fake reason' });
    const content = root.find('.AddonCompatibilityError').render();

    expect(content.text()).toContain(
      'This add-on does not support your browser.');
  });

  it('throws an error if no reason is supplied', () => {
    expect(() => {
      render({ minVersion: '11.0' });
    }).toThrowError('AddonCompatibilityError requires a "reason" prop');
  });

  it('throws an error if minVersion is missing', () => {
    expect(() => {
      render({ minVersion: undefined, reason: INCOMPATIBLE_NOT_FIREFOX });
    }).toThrowError('minVersion is required; it cannot be undefined');
  });
});
