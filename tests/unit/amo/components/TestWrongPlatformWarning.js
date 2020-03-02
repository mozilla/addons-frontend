import * as React from 'react';
import UAParser from 'ua-parser-js';

import WrongPlatformWarning, {
  FENIX_LINK_DESTINATION,
  WrongPlatformWarningBase,
} from 'amo/components/WrongPlatformWarning';
import {
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalVersion } from 'core/reducers/versions';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeVersion,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let _correctedLocationForPlatform;
  let _getClientCompatibility;
  let _isFenix;
  let store;

  beforeEach(() => {
    _correctedLocationForPlatform = sinon.stub();
    _getClientCompatibility = sinon.stub().returns({});
    _isFenix = sinon.stub();
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
      _isFenix,
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

  it('calls _isFenix to check for Fenix user agent', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, userAgent });

    render();

    sinon.assert.calledWith(
      _isFenix,
      sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    );
  });

  it('calls _correctedLocationForPlatform with clientApp, location and userAgentInfo', () => {
    _isFenix.returns(false);
    const clientApp = CLIENT_APP_ANDROID;
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, userAgent });

    const pathname = '/some/path/';
    const location = createFakeLocation({ pathname });

    render({ location });

    sinon.assert.calledWith(_correctedLocationForPlatform, {
      clientApp,
      location,
      userAgentInfo: sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    });
  });

  it.each([
    [
      CLIENT_APP_ANDROID,
      [
        'To find add-ons compatible with Firefox on desktop',
        'visit our desktop site',
      ],
    ],
    [
      CLIENT_APP_FIREFOX,
      [
        'To find add-ons compatible with Firefox on Android',
        'visit our mobile site',
      ],
    ],
  ])(
    'generates the expected message when clientApp is %s and not Fenix',
    (clientApp, expectedText) => {
      const newLocation = '/some/location/';
      _correctedLocationForPlatform.returns(newLocation);
      _isFenix.returns(false);
      _dispatchClientMetadata({ clientApp });
      const root = render();

      for (const text of expectedText) {
        expect(root.find('.WrongPlatformWarning-message').html()).toContain(
          text,
        );
      }
      expect(root.find('.WrongPlatformWarning-message').html()).toContain(
        `<a href="${newLocation}">`,
      );
    },
  );

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])(
    'can display a custom message when clientApp is %s and not Fenix',
    (clientApp) => {
      const newLocation = '/some/location/';
      _correctedLocationForPlatform.returns(newLocation);
      _isFenix.returns(false);
      _dispatchClientMetadata({ clientApp });
      const androidMessageText = 'A message to show when clientApp is firefox';
      const androidLinkText = 'click here for Android';
      const firefoxMessageText = 'A message to show when clientApp is android';
      const firefoxLinkText = 'click here for Firefox';
      const fixAndroidLinkMessage = `${androidMessageText}<a href="%(newLocation)s">${androidLinkText}</a>.`;
      const fixFirefoxLinkMessage = `${firefoxMessageText}<a href="%(newLocation)s">${firefoxLinkText}</a>.`;
      const root = render({ fixAndroidLinkMessage, fixFirefoxLinkMessage });

      expect(root.find('.WrongPlatformWarning-message').html()).toContain(
        clientApp === CLIENT_APP_ANDROID
          ? firefoxMessageText
          : androidMessageText,
      );
      expect(root.find('.WrongPlatformWarning-message').html()).toContain(
        clientApp === CLIENT_APP_ANDROID ? firefoxLinkText : androidLinkText,
      );
      expect(root.find('.WrongPlatformWarning-message').html()).toContain(
        `<a href="${newLocation}">`,
      );
    },
  );

  it('generates the expected message when user agent is Fenix', () => {
    _isFenix.returns(true);
    const root = render();

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'To learn about add-ons compatible with Firefox for Android,',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'click here',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      `<a href="${FENIX_LINK_DESTINATION}">`,
    );
  });

  it('can display a custom message when user agent is Fenix', () => {
    _isFenix.returns(true);
    const messageText = 'A custom message.';
    const linkText = 'click here';
    const fixFenixLinkMessage = `${messageText}<a href="%(newLocation)s">${linkText}</a>.`;
    const root = render({ fixFenixLinkMessage });

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      messageText,
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      linkText,
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      `<a href="${FENIX_LINK_DESTINATION}">`,
    );
  });

  it('calls _getClientCompatibility when an addon and currentVersion exist', () => {
    const addon = createInternalAddon(fakeAddon);
    const currentVersion = createInternalVersion(fakeVersion);
    const clientApp = CLIENT_APP_ANDROID;
    const userAgent = userAgentsByPlatform.mac.firefox57;
    const parsedUserAgent = UAParser(userAgent);
    _dispatchClientMetadata({ clientApp, userAgent });

    render({ addon, currentVersion });

    sinon.assert.calledWith(_getClientCompatibility, {
      addon,
      clientApp,
      currentVersion,
      userAgentInfo: sinon.match({
        browser: sinon.match(parsedUserAgent.browser),
        os: sinon.match(parsedUserAgent.os),
      }),
    });
  });

  it('does not call _getClientCompatibility when an addon does not exist', () => {
    render({ currentVersion: createInternalVersion(fakeVersion) });
    sinon.assert.notCalled(_getClientCompatibility);
  });

  it('does not call _getClientCompatibility when a currentVersion does not exist', () => {
    render({ addon: createInternalAddon(fakeAddon) });
    sinon.assert.notCalled(_getClientCompatibility);
  });

  it('returns nothing if not Fenix, no location correction is required, and no addon info', () => {
    _correctedLocationForPlatform.returns(null);
    _isFenix.returns(false);
    const root = render({ addon: null, currentVersion: null });

    expect(root.find('.WrongPlatformWarning')).toHaveLength(0);
  });

  it('returns nothing if not Fenix, no location correction is required, and not Android incompatible', () => {
    _correctedLocationForPlatform.returns(null);
    _isFenix.returns(false);
    _getClientCompatibility.returns({
      reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
    });
    const root = render({
      addon: createInternalAddon(fakeAddon),
      currentVersion: createInternalVersion(fakeVersion),
    });

    expect(root.find('.WrongPlatformWarning')).toHaveLength(0);
  });

  it('generates the expected message when add-on is not compatible with Android', () => {
    _getClientCompatibility.returns({
      reason: INCOMPATIBLE_ANDROID_UNSUPPORTED,
    });
    const root = render({
      addon: createInternalAddon(fakeAddon),
      currentVersion: createInternalVersion(fakeVersion),
    });

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'Not available on Firefox for Android.',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'You can use this add-on with Firefox for Desktop,',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'or look for similar',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'Android add-ons',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      '<a href="/android/">',
    );
  });

  it('generates the expected message when add-on is not compatible with Android, even when wrong platform', () => {
    _correctedLocationForPlatform.returns('/some/location/');
    _getClientCompatibility.returns({
      reason: INCOMPATIBLE_ANDROID_UNSUPPORTED,
    });
    const root = render({
      addon: createInternalAddon(fakeAddon),
      currentVersion: createInternalVersion(fakeVersion),
    });

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'You can use this add-on with Firefox for Desktop,',
    );
    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      '<a href="/android/">',
    );
  });

  it('generates the expected message when user is on iOS', () => {
    _getClientCompatibility.returns({
      reason: INCOMPATIBLE_FIREFOX_FOR_IOS,
    });
    const root = render({
      addon: createInternalAddon(fakeAddon),
      currentVersion: createInternalVersion(fakeVersion),
    });

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'This add-on is not compatible with this browser. Try installing it on Firefox for desktop.',
    );
  });
});
