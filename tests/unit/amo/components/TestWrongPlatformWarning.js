import * as React from 'react';

import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import {
  createInternalAddonWithLang,
  dispatchClientMetadata,
  fakeAddon,
  render as defaultRender,
  screen,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const _dispatchClientMetadata = (params = {}) => {
    return dispatchClientMetadata({
      store,
      userAgent: userAgentsByPlatform.mac.firefox57,
      ...params,
    });
  };

  const render = (customProps = {}) => {
    return defaultRender(<WrongPlatformWarning {...customProps} />, { store });
  };

  it('can add a custom className', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.ios.firefox1iPhone,
    });
    const className = 'some-class-name';
    render({ className });

    expect(screen.getByClassName('WrongPlatformWarning')).toHaveClass(
      className,
    );
  });

  it('generates the expected message when user agent is Firefox for iOS', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.ios.firefox1iPhone,
    });
    render();

    expect(
      screen.getByText(
        'Add-ons are not compatible with Firefox for iOS. Try installing them on Firefox for desktop.',
      ),
    ).toBeInTheDocument();
  });

  it('returns nothing when user agent is Firefox for Android', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.android.firefox136,
    });
    render({ addon: createInternalAddonWithLang(fakeAddon) });

    expect(
      screen.queryByClassName('WrongPlatformWarning'),
    ).not.toBeInTheDocument();
  });

  it('returns nothing when user agent is Firefox for desktop', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.firefox57,
    });
    render();

    expect(
      screen.queryByClassName('WrongPlatformWarning'),
    ).not.toBeInTheDocument();
  });

  it('returns nothing when user agent is not Firefox', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.chrome41,
    });
    render();

    expect(
      screen.queryByClassName('WrongPlatformWarning'),
    ).not.toBeInTheDocument();
  });
});
