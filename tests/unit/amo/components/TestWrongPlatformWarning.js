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

  // This is the test config for the four possible states of the message, the format is:
  // [clientApp, forAddonDetailPage, [array of expected message text]
  const messageTestData = [
    [
      CLIENT_APP_ANDROID,
      false,
      [
        'To find add-ons compatible with Firefox on desktop',
        'visit our desktop site',
      ],
    ],
    [
      CLIENT_APP_FIREFOX,
      false,
      [
        'To find add-ons compatible with Firefox on Android',
        'visit our mobile site',
      ],
    ],
    [
      CLIENT_APP_ANDROID,
      true,
      [
        'This add-on is not compatible with this platform',
        'Browse add-ons for Firefox on desktop',
      ],
    ],
    [
      CLIENT_APP_FIREFOX,
      true,
      [
        'This add-on is not compatible with this platform',
        'Browse add-ons for Firefox on Android',
      ],
    ],
  ];

  it.each(messageTestData)(
    'generates the expected message when clientApp is %s and forAddonDetailPage is %s',
    (clientApp, forAddonDetailPage, expectedText) => {
      const newLocation = '/some/location/';
      _correctedLocationForPlatform.returns(newLocation);
      _dispatchClientMetadata({ clientApp });
      const root = render({ forAddonDetailPage });

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

  it('defaults forAddonDetailPage to `false`', () => {
    _correctedLocationForPlatform.returns('/some/location/');
    _dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const root = render();

    expect(root.find('.WrongPlatformWarning-message').html()).toContain(
      'To find add-ons compatible with Firefox on desktop',
    );
  });
});
