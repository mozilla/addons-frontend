import React from 'react';

import AddonCompatibilityError, {
  AddonCompatibilityErrorBase,
} from 'amo/components/AddonCompatibilityError';
import createStore from 'amo/store';
import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import { signedInApiState } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  const defaultUserAgentInfo = {
    browser: { name: 'Firefox' },
    os: { name: 'Plan 9' },
  };

  function render({ ...props }) {
    const api = {
      ...signedInApiState,
      lang: props.lang,
      userAgentInfo: props.userAgentInfo,
    };
    const { store } = createStore({ api });

    const defaultProps = {
      i18n: fakeI18n(),
      minVersion: null,
      store,
    };

    return shallowUntilTarget(
      <AddonCompatibilityError {...defaultProps} {...props} />,
      AddonCompatibilityErrorBase
    );
  }

  it('renders a notice for non-Firefox browsers', () => {
    const root = render({
      lang: 'en-GB',
      reason: INCOMPATIBLE_NOT_FIREFOX,
      userAgentInfo: { browser: { name: 'Chrome' }, os: {} },
    });

    expect(
      root.find('.AddonCompatibilityError').render().find('a').attr('href')
    ).toEqual('https://www.mozilla.org/en-GB/firefox/');
    expect(
      root.find('.AddonCompatibilityError').render().text()
    ).toContain('You need to download Firefox to install this add-on.');
  });

  it('renders a notice if add-on is over maxVersion/compat is strict', () => {
    const root = render({
      lang: 'en-GB',
      reason: INCOMPATIBLE_OVER_MAX_VERSION,
      userAgentInfo: {
        browser: { name: 'Firefox', version: { major: '57' } },
        os: {},
      },
    });

    expect(
      root.find('.AddonCompatibilityError').render().text()
    ).toContain('This add-on is not compatible with your version of Firefox');
  });

  it('renders a notice for old versions of Firefox', () => {
    const root = render({
      lang: 'en-GB',
      minVersion: '11.0',
      reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      userAgentInfo: {
        browser: { name: 'Firefox', version: '8.0' }, os: {},
      },
    });

    const text = root.find('.AddonCompatibilityError').render().text();

    expect(
      root.find('.AddonCompatibilityError').render().find('a').attr('href')
    ).toEqual('https://www.mozilla.org/en-GB/firefox/');
    expect(text).toContain(
      'This add-on requires a newer version of Firefox');
    expect(text).toContain('(at least version 11.0)');
    expect(text).toContain('You are using Firefox 8.0');
  });

  it('renders a notice for iOS users', () => {
    const root = render({
      reason: INCOMPATIBLE_FIREFOX_FOR_IOS,
      userAgentInfo: { browser: { name: 'Firefox' }, os: { name: 'iOS' } },
    });

    expect(root.find('.AddonCompatibilityError').render().text())
      .toContain('Firefox for iOS does not currently support add-ons.');
  });

  it('renders a notice for browsers that do not support OpenSearch', () => {
    const root = render({
      reason: INCOMPATIBLE_NO_OPENSEARCH,
      userAgentInfo: {
        browser: { name: 'Firefox' }, os: { name: 'Plan 9' },
      },
    });

    expect(root.find('.AddonCompatibilityError').render().text())
      .toContain('Your version of Firefox does not support search plugins.');
  });

  it('renders a notice and logs warning when reason code not known', () => {
    const fakeLog = { warn: sinon.stub() };
    const root = render({
      log: fakeLog,
      reason: 'fake reason',
      userAgentInfo: defaultUserAgentInfo,
    });

    sinon.assert.calledWith(
      fakeLog.warn,
      'Unknown reason code supplied to AddonCompatibilityError',
      'fake reason',
    );
    expect(root.find('.AddonCompatibilityError').render().text())
      .toContain('Your browser does not support add-ons.');
  });

  it('throws an error if no reason is supplied', () => {
    expect(() => {
      render({ userAgentInfo: defaultUserAgentInfo });
    }).toThrowError('AddonCompatibilityError requires a "reason" prop');
  });

  it('throws an error if minVersion is missing', () => {
    expect(() => {
      render({
        minVersion: undefined,
        reason: INCOMPATIBLE_NOT_FIREFOX,
        userAgentInfo: defaultUserAgentInfo,
      });
    }).toThrowError('minVersion is required; it cannot be undefined');
  });
});
