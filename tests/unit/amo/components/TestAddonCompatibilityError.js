import { oneLineTrim } from 'common-tags';
import * as React from 'react';

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
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'core/constants';
import Notice from 'ui/components/Notice';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  fakeI18n,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    // Set up an empty store and let each test call
    // dispatchClientMetadata().
    store = createStore().store;
  });

  const _dispatchClientMetadata = (params = {}) => {
    return dispatchClientMetadata({
      store,
      userAgent: userAgentsByPlatform.mac.firefox57,
      ...params,
    });
  };

  function render({ ...props }) {
    const defaultProps = {
      i18n: fakeI18n(),
      minVersion: null,
      store,
    };

    return shallowUntilTarget(
      <AddonCompatibilityError {...defaultProps} {...props} />,
      AddonCompatibilityErrorBase,
    );
  }

  it('renders a notice for non-Firefox browsers', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });
    const root = render({ reason: INCOMPATIBLE_NOT_FIREFOX });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .render()
        .find('a')
        .attr('href'),
    ).toEqual(oneLineTrim`https://www.mozilla.org/firefox/new/
      ?utm_source=addons.mozilla.org&utm_medium=referral
      &utm_campaign=non-fx-button&utm_content=install-addon-button`);
    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toMatch(/You need to .*download Firefox.* to install this add-on/);
  });

  it('allows downloadUrl overrides', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });
    const root = render({
      downloadUrl: 'http://waterfoxproject.org/',
      reason: INCOMPATIBLE_NOT_FIREFOX,
    });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .render()
        .find('a')
        .attr('href'),
    ).toEqual(oneLineTrim`http://waterfoxproject.org/
      ?utm_source=addons.mozilla.org&utm_medium=referral
      &utm_campaign=non-fx-button&utm_content=install-addon-button`);
    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toMatch(/You need to .*download Firefox.* to install this add-on/);
  });

  it('renders a generic notice for non-Firefox browsers', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });
    const root = render({ reason: INCOMPATIBLE_NOT_FIREFOX });

    expect(root.find('.AddonCompatibilityError').find(Notice)).toHaveProp(
      'type',
      'firefox',
    );
  });

  it('renders an error notice for other reasons than non-Firefox', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.firefox57,
    });
    const root = render({ reason: INCOMPATIBLE_OVER_MAX_VERSION });

    expect(root.find('.AddonCompatibilityError').find(Notice)).toHaveProp(
      'type',
      'error',
    );
  });

  it('renders a notice if add-on is over maxVersion/compat is strict', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.firefox57,
    });
    const root = render({ reason: INCOMPATIBLE_OVER_MAX_VERSION });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('This add-on is not compatible with your version of Firefox');
  });

  it('renders a notice for old versions of Firefox', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.firefox33,
    });
    const root = render({
      minVersion: '34.0',
      reason: INCOMPATIBLE_UNDER_MIN_VERSION,
    });

    const text = root
      .find('.AddonCompatibilityError')
      .childAt(0)
      .html();

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .render()
        .find('a')
        .attr('href'),
    ).toMatch(new RegExp('https://www.mozilla.org/firefox/new/'));
    expect(text).toMatch(/This add-on requires a .*newer version of Firefox/);
    expect(text).toContain('(at least version 34.0)');
    expect(text).toContain('You are using Firefox 33.0');
  });

  it('renders a notice for iOS users', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.ios.firefox1iPhone,
    });
    const root = render({ reason: INCOMPATIBLE_FIREFOX_FOR_IOS });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('Firefox for iOS does not currently support add-ons.');
  });

  it('renders a notice for browsers that do not support OpenSearch', () => {
    _dispatchClientMetadata();
    const root = render({ reason: INCOMPATIBLE_NO_OPENSEARCH });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('Your version of Firefox does not support search plugins.');
  });

  it('renders a notice if add-on is incompatible with the platform', () => {
    _dispatchClientMetadata();
    const root = render({ reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM });

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('This add-on is not available on your platform.');
  });

  it('renders a notice and logs warning when reason code not known', () => {
    _dispatchClientMetadata();
    const fakeLog = { warn: sinon.stub() };
    const root = render({
      log: fakeLog,
      reason: 'fake reason',
    });

    sinon.assert.calledWith(
      fakeLog.warn,
      'Unknown reason code supplied to AddonCompatibilityError',
      'fake reason',
    );
    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .html(),
    ).toContain('Your browser does not support add-ons.');
  });

  it('throws an error if no reason is supplied', () => {
    _dispatchClientMetadata();
    expect(() => {
      render();
    }).toThrowError('AddonCompatibilityError requires a "reason" prop');
  });

  it('throws an error if minVersion is missing', () => {
    _dispatchClientMetadata();
    expect(() => {
      render({
        minVersion: undefined,
        reason: INCOMPATIBLE_NOT_FIREFOX,
      });
    }).toThrowError('minVersion is required; it cannot be undefined');
  });
});
