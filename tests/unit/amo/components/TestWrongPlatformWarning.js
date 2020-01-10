import * as React from 'react';
import UAParser from 'ua-parser-js';

import WrongPlatformWarning, {
  FENIX_LINK_DESTINATION,
  WrongPlatformWarningBase,
} from 'amo/components/WrongPlatformWarning';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let _correctedLocationForPlatform;
  let _isFenix;
  let store;

  beforeEach(() => {
    _correctedLocationForPlatform = sinon.stub();
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

  it('returns nothing if not Fenix and no location correction is required', () => {
    _correctedLocationForPlatform.returns(null);
    _isFenix.returns(false);
    const root = render();

    expect(root.find('.WrongPlatformWarning')).toHaveLength(0);
  });

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

  it('does not call _correctedLocationForPlatform when user agent is Fenix', () => {
    _isFenix.returns(true);
    render();

    sinon.assert.notCalled(_correctedLocationForPlatform);
  });

  it('calls _correctedLocationForPlatform with clientApp, location and userAgentInfo when not Fenix', () => {
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
      'To find add-ons compatible with Firefox on Android,',
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
});
