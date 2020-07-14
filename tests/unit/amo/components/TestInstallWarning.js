import * as React from 'react';
import UAParser from 'ua-parser-js';

import InstallWarning, {
  InstallWarningBase,
} from 'amo/components/InstallWarning';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
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
import Notice from 'ui/components/Notice';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      userAgent: userAgentsByPlatform.mac.firefox57,
    }).store;
  });

  const render = ({ location = createFakeLocation(), ...customProps } = {}) => {
    const props = {
      _correctedLocationForPlatform: sinon.stub().returns(null),
      addon: createInternalAddon(fakeAddon),
      i18n: fakeI18n(),
      store,
      ...customProps,
    };

    return shallowUntilTarget(
      <InstallWarning {...props} />,
      InstallWarningBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  // This is an add-on that would cause a warning to be displayed.
  const addonThatWouldShowWarning = {
    ...fakeAddon,
    is_recommended: false,
    type: ADDON_TYPE_EXTENSION,
  };

  // This will render the component with values needed to allow
  // the warning to be displayed.
  const renderWithWarning = (props = {}) => {
    return render({
      addon: createInternalAddon(addonThatWouldShowWarning),
      ...props,
    });
  };

  it('can be customized with a class name', () => {
    const className = 'ExampleClass';
    const root = render({ className });

    expect(root).toHaveClassName(className);
  });

  describe('couldShowWarning', () => {
    // This is a test for the happy path, but also serves as a sanity test for
    // renderWithWarning returning the happy path.
    it('returns true if the userAgent and clientApp are both Firefox, and the add-on is an extension and is not recommended', () => {
      const component = renderWithWarning();

      expect(component.instance().couldShowWarning()).toEqual(true);
    });

    it('returns false if the add-on is not an extension', () => {
      const component = renderWithWarning({
        addon: createInternalAddon({
          ...addonThatWouldShowWarning,
          type: ADDON_TYPE_STATIC_THEME,
        }),
      });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the add-on is recommended', () => {
      const component = renderWithWarning({
        addon: createInternalAddon({
          ...addonThatWouldShowWarning,
          is_recommended: true,
        }),
      });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the userAgent is not Firefox', () => {
      dispatchClientMetadata({
        store,
        userAgent: userAgentsByPlatform.mac.chrome41,
      });

      const component = renderWithWarning({ store });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the clientApp is Android', () => {
      dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, store });

      const component = renderWithWarning({ store });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('returns false if the WrongPlatformWarning would be shown', () => {
      const _correctedLocationForPlatform = sinon.stub().returns('/some/path/');

      const component = renderWithWarning({ _correctedLocationForPlatform });

      expect(component.instance().couldShowWarning()).toEqual(false);
    });

    it('calls _correctedLocationForPlatform with clientApp, location and userAgentInfo', () => {
      const clientApp = CLIENT_APP_ANDROID;
      const userAgent = userAgentsByPlatform.mac.firefox57;
      const parsedUserAgent = UAParser(userAgent);
      const location = createFakeLocation();
      const _correctedLocationForPlatform = sinon.spy();

      dispatchClientMetadata({
        clientApp,
        store,
        userAgent,
      });

      renderWithWarning({ _correctedLocationForPlatform, location, store });

      sinon.assert.calledWith(_correctedLocationForPlatform, {
        clientApp,
        location,
        userAgentInfo: sinon.match({
          browser: sinon.match(parsedUserAgent.browser),
          os: sinon.match(parsedUserAgent.os),
        }),
      });
    });
  });

  it('displays a warning if couldShowWarning is true', () => {
    const _couldShowWarning = sinon.stub().returns(true);

    const root = render({ _couldShowWarning });
    expect(root.find(Notice)).toHaveLength(1);
  });

  it('does not display a warning if couldShowWarning is false', () => {
    const _couldShowWarning = sinon.stub().returns(false);

    const root = render({ _couldShowWarning });
    expect(root.find(Notice)).toHaveLength(0);
  });
});
