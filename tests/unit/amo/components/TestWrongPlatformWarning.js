import * as React from 'react';
import UAParser from 'ua-parser-js';

import WrongPlatformWarning, {
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
  let store;

  beforeEach(() => {
    _correctedLocationForPlatform = sinon.stub();
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

  it('returns nothing if no location correction is required', () => {
    _correctedLocationForPlatform.returns(null);
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

  it('calls _correctedLocationForPlatform with clientApp, location and userAgentInfo', () => {
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
    'generates the expected message when clientApp is %s',
    (clientApp, expectedText) => {
      const newLocation = '/some/location/';
      _correctedLocationForPlatform.returns(newLocation);
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
    'can display a custom message when clientApp is %s',
    (clientApp) => {
      const newLocation = '/some/location/';
      _correctedLocationForPlatform.returns(newLocation);
      _dispatchClientMetadata({ clientApp });
      const fixAndroidLinkMessage =
        'A message to show when clientApp is firefox';
      const fixFirefoxLinkMessage =
        'A message to show when clientApp is android';
      const root = render({ fixAndroidLinkMessage, fixFirefoxLinkMessage });

      expect(root.find('.WrongPlatformWarning-message').html()).toContain(
        clientApp === CLIENT_APP_ANDROID
          ? fixFirefoxLinkMessage
          : fixAndroidLinkMessage,
      );
    },
  );
});
