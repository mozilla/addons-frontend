import * as React from 'react';
import UAParser from 'ua-parser-js';

import WrongPlatformWarning, {
  WrongPlatformWarningBase,
} from 'amo/components/WrongPlatformWarning';
import { getMobileHomepageLink } from 'amo/utils/compatibility';
import { CLIENT_APP_ANDROID } from 'amo/constants';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
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
    _correctedLocationForPlatform = sinon.stub();
    _getClientCompatibility = sinon.stub().returns({});
    _isFirefoxForAndroid = sinon.stub();
    _isFirefoxForIOS = sinon.stub();
    _isAndroidInstallable = sinon.stub();
    store = dispatchClientMetadata().store;
  });

  const _dispatchClientMetadata = (params = {}) => {
    return dispatchClientMetadata({
      store,
      userAgent: userAgentsByPlatform.mac.firefox57,
      ...params,
    });
  };

  const render = ({ location = createFakeLocation(), ...customProps } = {}) => {
    const props = {
      _correctedLocationForPlatform,
      _getClientCompatibility,
      _isFirefoxForAndroid,
      _isFirefoxForIOS,
      _isAndroidInstallable,
      i18n: fakeI18n(),
      store,
      ...customProps,
    };

    return shallowUntilTarget(
      <WrongPlatformWarning {...props} />,
      WrongPlatformWarningBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  it('can add a custom className', () => {
    _correctedLocationForPlatform.returns('/some/location/');
    const className = 'some-class-name';
    const root = render({ className });

    expect(root).toHaveClassName('WrongPlatformWarning');
    expect(root).toHaveClassName(className);
  });

  it('calls _isFirefoxForAndroid to check for Android user agent', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, userAgent });

    render({ addon: createInternalAddonWithLang(fakeAddon) });

    sinon.assert.calledWith(
      _isFirefoxForAndroid,
      sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    );
  });

  it('calls _isAndroidInstallable to check for Android compatibility', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    _isFirefoxForAndroid.returns(true);

    render({ addon: createInternalAddonWithLang(fakeAddon) });

    sinon.assert.calledWith(_isAndroidInstallable, { addon });
  });

  it('calls _correctedLocationForPlatform with clientApp, isHomePage, lang, location and userAgentInfo', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const isHomePage = true;
    const lang = 'fr';
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, lang, userAgent });

    const pathname = '/some/path/';
    const location = createFakeLocation({ pathname });

    render({ isHomePage, location });

    sinon.assert.calledWith(_correctedLocationForPlatform, {
      clientApp,
      isHomePage,
      lang,
      location,
      userAgentInfo: sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    });
  });

  it('calls _correctedLocationForPlatform with isHomePage defaulted to false', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const lang = 'fr';
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, lang, userAgent });

    const pathname = '/some/path/';
    const location = createFakeLocation({ pathname });

    render({ location });

    sinon.assert.calledWith(_correctedLocationForPlatform, {
      clientApp,
      isHomePage: false,
      lang,
      location,
      userAgentInfo: sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    });
  });

  it('returns nothing when user agent is Firefox for Android and add-on is compatible', () => {
    _isFirefoxForAndroid.returns(true);
    _isAndroidInstallable.returns(true);
    const root = render({ addon: createInternalAddonWithLang(fakeAddon) });

    expect(root.find('.WrongPlatformWarning')).toHaveLength(0);
  });

  it('generates the expected message when user agent is Firefox for iOS', () => {
    _isFirefoxForIOS.returns(true);
    const root = render();

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'Add-ons are not compatible with Firefox for iOS. Try installing them on Firefox for desktop.',
    );
  });

  it('generates the expected message when being directed to the mobile home page', () => {
    const mobileLink = getMobileHomepageLink('en-US');
    _correctedLocationForPlatform.returns(mobileLink);
    const root = render();

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'To find add-ons compatible with Firefox for Android,',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'click here',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      `<a href="${mobileLink}">`,
    );
  });

  it('generates the expected message when being directed to other than the mobile home page, from the detail page', () => {
    const newLocation = '/some/location/';
    _correctedLocationForPlatform.returns(newLocation);
    const root = render({ addon: createInternalAddonWithLang(fakeAddon) });

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'This listing is not intended for this platform.',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'Browse add-ons for Firefox on desktop',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      `<a href="${newLocation}">`,
    );
  });

  it('generates the expected message when being directed to other than the mobile home page, from other pages', () => {
    const newLocation = '/some/location/';
    _correctedLocationForPlatform.returns(newLocation);
    const root = render();

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'To find add-ons compatible with Firefox on desktop,',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'visit our desktop site',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      `<a href="${newLocation}">`,
    );
  });

  it('returns nothing if not Firefox for Android, not Firefox for iOS, and no location correction is required', () => {
    _correctedLocationForPlatform.returns(null);
    _isFirefoxForAndroid.returns(false);
    _isFirefoxForIOS.returns(false);
    const root = render();

    expect(root.find('.WrongPlatformWarning')).toHaveLength(0);
  });
});
