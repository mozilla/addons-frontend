import * as React from 'react';
import UAParser from 'ua-parser-js';

import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import { getMobileHomepageLink } from 'amo/utils/compatibility';
import { CLIENT_APP_ANDROID } from 'amo/constants';
import {
  createHistory,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  fakeAddon,
  render as defaultRender,
  screen,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let _correctedLocationForPlatform;
  let _getClientCompatibility;
  let _isFirefoxForAndroid;
  let _isFirefoxForIOS;
  let _isAndroidInstallable;
  let store;

  beforeEach(() => {
    _correctedLocationForPlatform = jest.fn();
    _getClientCompatibility = jest.fn().mockReturnValue({});
    _isFirefoxForAndroid = jest.fn();
    _isFirefoxForIOS = jest.fn();
    _isAndroidInstallable = jest.fn();
    store = dispatchClientMetadata().store;
  });

  const _dispatchClientMetadata = (params = {}) => {
    return dispatchClientMetadata({
      store,
      userAgent: userAgentsByPlatform.mac.firefox57,
      ...params,
    });
  };

  const render = ({ location, ...customProps } = {}) => {
    const props = {
      _correctedLocationForPlatform,
      _getClientCompatibility,
      _isFirefoxForAndroid,
      _isFirefoxForIOS,
      _isAndroidInstallable,
      ...customProps,
    };
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || '/'],
      }),
      store,
    };

    return defaultRender(<WrongPlatformWarning {...props} />, renderOptions);
  };

  it('can add a custom className', () => {
    _correctedLocationForPlatform.mockReturnValue('/some/location/');
    const className = 'some-class-name';
    render({ className });

    expect(screen.getByClassName('WrongPlatformWarning')).toHaveClass(
      className,
    );
  });

  it('calls _isFirefoxForAndroid to check for Android user agent', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, userAgent });

    render({ addon: createInternalAddonWithLang(fakeAddon) });

    expect(_isFirefoxForAndroid).toHaveBeenCalledWith(
      expect.objectContaining({
        browser: parsedUserAgent.browser,
        os: parsedUserAgent.os,
      }),
    );
  });

  it('calls _correctedLocationForPlatform with clientApp, isHomePage, lang, location and userAgentInfo', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const isHomePage = true;
    const lang = 'fr';
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, lang, userAgent });

    const pathname = '/some/path/';

    render({ isHomePage, location: pathname });

    expect(_correctedLocationForPlatform).toHaveBeenCalledWith({
      clientApp,
      isHomePage,
      lang,
      location: expect.objectContaining({ pathname }),
      userAgentInfo: expect.objectContaining({
        browser: parsedUserAgent.browser,
        os: parsedUserAgent.os,
      }),
    });
  });

  it('calls _correctedLocationForPlatform with isHomePage defaulted to false', () => {
    const clientApp = CLIENT_APP_ANDROID;
    _dispatchClientMetadata({ clientApp });

    const pathname = '/some/path/';

    render({ location: pathname });

    expect(_correctedLocationForPlatform).toHaveBeenCalledWith(
      expect.objectContaining({
        clientApp,
        isHomePage: false,
      }),
    );
  });

  it('returns nothing when user agent is Firefox for Android and add-on is compatible', () => {
    _isFirefoxForAndroid.mockReturnValue(true);
    _isAndroidInstallable.mockReturnValue(true);
    render({ addon: createInternalAddonWithLang(fakeAddon) });

    expect(
      screen.queryByClassName('WrongPlatformWarning'),
    ).not.toBeInTheDocument();
  });

  it('generates the expected message when user agent is Firefox for iOS', () => {
    _isFirefoxForIOS.mockReturnValue(true);
    render();

    expect(
      screen.getByText(
        'Add-ons are not compatible with Firefox for iOS. Try installing them on Firefox for desktop.',
      ),
    ).toBeInTheDocument();
  });

  it('generates the expected message when being directed to the mobile home page', () => {
    const mobileLink = getMobileHomepageLink('en-US');
    _correctedLocationForPlatform.mockReturnValue(mobileLink);
    render();

    expect(screen.getByRole('link', { name: 'click here' })).toHaveAttribute(
      'href',
      mobileLink,
    );
    expect(
      screen.getByText(
        /To find extensions compatible with Firefox for Android,/,
      ),
    ).toBeInTheDocument();
  });

  it('does not generate a message on android when on /android/ pages that are not home or search', () => {
    _correctedLocationForPlatform.mockReturnValue(null);
    _isFirefoxForAndroid.mockReturnValue(true);
    render({ location: '/android/extensions/categories' });

    expect(
      screen.queryByClassName('WrongPlatformWarning'),
    ).not.toBeInTheDocument();
  });

  it('generates the expected message when being directed to other than the mobile home page, from the detail page', () => {
    const newLocation = '/some/location/';
    _correctedLocationForPlatform.mockReturnValue(newLocation);
    render({ addon: createInternalAddonWithLang(fakeAddon) });

    expect(
      screen.getByRole('link', {
        name: 'Browse add-ons for Firefox for desktop',
      }),
    ).toHaveAttribute('href', newLocation);
    expect(
      screen.getByText(/This listing is not intended for this platform./),
    ).toBeInTheDocument();
  });

  it('generates the expected message when being directed to other than the mobile home page, from other pages', () => {
    const newLocation = '/some/location/';
    _correctedLocationForPlatform.mockReturnValue(newLocation);
    render();

    expect(
      screen.getByRole('link', {
        name: 'Firefox for Android',
      }),
    ).toHaveAttribute(
      'href',
      `https://play.google.com/store/apps/details?${[
        'id=org.mozilla.firefox',
        `referrer=${encodeURIComponent(
          [
            'utm_campaign=amo-fx-cta',
            'utm_content=banner-download-button',
            'utm_medium=referral',
            'utm_source=addons.mozilla.org',
          ].join('&'),
        )}`,
      ].join('&')}`,
    );
    expect(screen.getByText(/To use Android extensions/)).toBeInTheDocument();

    expect(
      screen.getByRole('link', {
        name: 'visit our desktop site',
      }),
    ).toHaveAttribute('href', newLocation);
    expect(
      screen.getByText(/To explore Firefox for desktop add-ons, please/),
    ).toBeInTheDocument();
  });

  it('passes the utm_campaign value to the Play Store link when available', () => {
    const newLocation = '/some/location/';
    _correctedLocationForPlatform.mockReturnValue(newLocation);
    const campaign = 'some-utm-campaign';
    render({ location: `/some/page/?utm_campaign=${campaign}` });

    expect(
      screen.getByRole('link', {
        name: 'Firefox for Android',
      }),
    ).toHaveAttribute(
      'href',
      `https://play.google.com/store/apps/details?${[
        'id=org.mozilla.firefox',
        `referrer=${encodeURIComponent(
          [
            `utm_campaign=${campaign}`,
            'utm_content=banner-download-button',
            'utm_medium=referral',
            'utm_source=addons.mozilla.org',
          ].join('&'),
        )}`,
      ].join('&')}`,
    );
  });

  it('returns nothing if not Firefox for Android, not Firefox for iOS, and no location correction is required', () => {
    _correctedLocationForPlatform.mockReturnValue(null);
    _isFirefoxForAndroid.mockReturnValue(false);
    _isFirefoxForIOS.mockReturnValue(false);
    render();

    expect(
      screen.queryByClassName('WrongPlatformWarning'),
    ).not.toBeInTheDocument();
  });
});
