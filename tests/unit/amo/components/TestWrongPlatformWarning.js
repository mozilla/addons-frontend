import * as React from 'react';
import UAParser from 'ua-parser-js';

import WrongPlatformWarning, {
  ANDROID_SUMO_LINK_DESTINATION,
  WrongPlatformWarningBase,
} from 'amo/components/WrongPlatformWarning';
import { CLIENT_APP_ANDROID, MOBILE_HOME_PAGE_LINK } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createContextWithFakeRouter,
  createFakeLocation,
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
  let _isFenixCompatible;
  let store;

  beforeEach(() => {
    _correctedLocationForPlatform = sinon.stub();
    _getClientCompatibility = sinon.stub().returns({});
    _isFirefoxForAndroid = sinon.stub();
    _isFirefoxForIOS = sinon.stub();
    _isFenixCompatible = sinon.stub();
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
      _isFenixCompatible,
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

    render({ addon: createInternalAddon(fakeAddon) });

    sinon.assert.calledWith(
      _isFirefoxForAndroid,
      sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    );
  });

  it('calls _isFenixCompatible to check for Fenix compatibility', () => {
    const addon = createInternalAddon(fakeAddon);
    _isFirefoxForAndroid.returns(true);

    render({ addon: createInternalAddon(fakeAddon) });

    sinon.assert.calledWith(_isFenixCompatible, { addon });
  });

  it('calls _correctedLocationForPlatform with clientApp, isHomePage, location and userAgentInfo', () => {
    const isHomePage = true;
    const clientApp = CLIENT_APP_ANDROID;
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, userAgent });

    const pathname = '/some/path/';
    const location = createFakeLocation({ pathname });

    render({ isHomePage, location });

    sinon.assert.calledWith(_correctedLocationForPlatform, {
      clientApp,
      isHomePage,
      location,
      userAgentInfo: sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    });
  });

  it('calls _correctedLocationForPlatform with isHomePage defaulted to false', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, userAgent });

    const pathname = '/some/path/';
    const location = createFakeLocation({ pathname });

    render({ location });

    sinon.assert.calledWith(_correctedLocationForPlatform, {
      clientApp,
      isHomePage: false,
      location,
      userAgentInfo: sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    });
  });

  it('generates the expected message when user agent is Firefox for Android and add-on is compatible', () => {
    _isFirefoxForAndroid.returns(true);
    _isFenixCompatible.returns(true);
    const root = render({ addon: createInternalAddon(fakeAddon) });

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'You can install this add-on in the Add-ons Manager.',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'add-ons for Android',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      `<a href="${ANDROID_SUMO_LINK_DESTINATION}">`,
    );
  });

  it('generates the expected message when user agent is Firefox for iOS', () => {
    _isFirefoxForIOS.returns(true);
    const root = render();

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'This add-on is not compatible with this browser. Try installing it on Firefox for desktop.',
    );
  });

  it('generates the expected message when being directed to the mobile home page', () => {
    _correctedLocationForPlatform.returns(MOBILE_HOME_PAGE_LINK);
    const root = render();

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'To find add-ons compatible with Firefox for Android,',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'click here',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      `<a href="${MOBILE_HOME_PAGE_LINK}">`,
    );
  });

  it('generates the expected message when being directed to other than the mobile home page, from the detail page', () => {
    const newLocation = '/some/location/';
    _correctedLocationForPlatform.returns(newLocation);
    const root = render({ addon: createInternalAddon(fakeAddon) });

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
