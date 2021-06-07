import { oneLine } from 'common-tags';
import * as React from 'react';

import AddonCompatibilityError, {
  AddonCompatibilityErrorBase,
} from 'amo/components/AddonCompatibilityError';
import {
  DOWNLOAD_FIREFOX_BASE_URL,
  CLIENT_APP_FIREFOX,
  CLIENT_APP_ANDROID,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NON_RESTARTLESS_ADDON,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'amo/constants';
import { loadVersions } from 'amo/reducers/versions';
import {
  createFakeClientCompatibility,
  createInternalAddonWithLang,
  createInternalVersionWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  getFakeLogger,
  shallowUntilTarget,
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

  const getClientCompatibilityNonFirefox = () => {
    return createFakeClientCompatibility({
      compatible: false,
      reason: INCOMPATIBLE_NOT_FIREFOX,
    });
  };

  const makeGetClientCompatibilityIncompatible = (compatibilityProps = {}) => {
    return () => {
      return createFakeClientCompatibility({
        compatible: false,
        ...compatibilityProps,
      });
    };
  };

  const getClientCompatibilityCompatible = () => {
    return createFakeClientCompatibility({
      compatible: true,
    });
  };

  const _loadVersions = ({ slug, versions } = {}) => {
    store.dispatch(
      loadVersions({
        slug,
        versions,
      }),
    );
  };

  const render = (props = {}) => {
    const defaultProps = {
      addon: createInternalAddonWithLang(fakeAddon),
      i18n: fakeI18n(),
      store,
    };

    return shallowUntilTarget(
      <AddonCompatibilityError {...defaultProps} {...props} />,
      AddonCompatibilityErrorBase,
    );
  };

  it('renders nothing if there is no addon', () => {
    const root = render({ addon: null });

    expect(root.find('.AddonCompatibilityError')).toHaveLength(0);
  });

  it(`calls getClientCompatibility with the add-on's current version`, () => {
    const addon = fakeAddon;

    _loadVersions({ slug: addon.slug, versions: [addon.current_version] });

    const clientApp = CLIENT_APP_FIREFOX;
    const _getClientCompatibility = sinon.mock().returns({
      compatible: true,
    });

    _dispatchClientMetadata({
      clientApp,
    });

    render({
      _getClientCompatibility,
      addon: createInternalAddonWithLang(addon),
      store,
    });

    sinon.assert.calledWith(_getClientCompatibility, {
      addon: createInternalAddonWithLang(addon),
      clientApp,
      currentVersion: createInternalVersionWithLang(addon.current_version),
      userAgentInfo: store.getState().api.userAgentInfo,
    });
  });

  it('renders nothing if the browser is not Firefox', () => {
    const root = render({
      _getClientCompatibility: getClientCompatibilityNonFirefox,
    });

    expect(root.find('.AddonCompatibilityError')).toHaveLength(0);
  });

  it.each([CLIENT_APP_FIREFOX, CLIENT_APP_ANDROID])(
    'renders nothing if the add-on is not compatible with Android and clientApp is %s',
    (clientApp) => {
      _dispatchClientMetadata({
        clientApp,
      });

      const root = render({
        _getClientCompatibility: makeGetClientCompatibilityIncompatible({
          reason: INCOMPATIBLE_ANDROID_UNSUPPORTED,
        }),
      });

      expect(root.find('.AddonCompatibilityError')).toHaveLength(0);
    },
  );

  it('renders nothing if the add-on is compatible', () => {
    const root = render({
      _getClientCompatibility: getClientCompatibilityCompatible,
    });

    expect(root.find('.AddonCompatibilityError')).toHaveLength(0);
  });

  it('renders a notice if add-on is over maxVersion/compat is strict', () => {
    const _getClientCompatibility = makeGetClientCompatibilityIncompatible({
      reason: INCOMPATIBLE_OVER_MAX_VERSION,
    });

    const root = render({ _getClientCompatibility });

    expect(root.find('.AddonCompatibilityError').childAt(0).html()).toContain(
      'This add-on is not compatible with your version of Firefox',
    );
  });

  it('renders a notice for old versions of Firefox', () => {
    _dispatchClientMetadata({
      userAgent: userAgentsByPlatform.mac.firefox33,
    });
    const _getClientCompatibility = makeGetClientCompatibilityIncompatible({
      minVersion: '34.0',
      reason: INCOMPATIBLE_UNDER_MIN_VERSION,
    });

    const root = render({ _getClientCompatibility });

    const text = root.find('.AddonCompatibilityError').childAt(0).html();

    expect(
      root
        .find('.AddonCompatibilityError')
        .childAt(0)
        .render()
        .find('a')
        .attr('href'),
    ).toMatch(new RegExp(DOWNLOAD_FIREFOX_BASE_URL));
    expect(text).toMatch(/This add-on requires a .*newer version of Firefox/);
    expect(text).toContain('(at least version 34.0)');
    expect(text).toContain('You are using Firefox 33.0');
  });

  it('renders nothing for iOS users', () => {
    const _getClientCompatibility = makeGetClientCompatibilityIncompatible({
      reason: INCOMPATIBLE_FIREFOX_FOR_IOS,
    });

    const root = render({ _getClientCompatibility });

    expect(root.find('.AddonCompatibilityError')).toHaveLength(0);
  });

  it('renders a notice if add-on is incompatible with the platform', () => {
    const _getClientCompatibility = makeGetClientCompatibilityIncompatible({
      reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
    });

    const root = render({ _getClientCompatibility });

    expect(root.find('.AddonCompatibilityError').childAt(0).html()).toContain(
      'This add-on is not available on your platform.',
    );
  });

  it('renders a notice if add-on is non-restartless', () => {
    const _getClientCompatibility = makeGetClientCompatibilityIncompatible({
      reason: INCOMPATIBLE_NON_RESTARTLESS_ADDON,
    });

    const root = render({ _getClientCompatibility });

    expect(root.find('.AddonCompatibilityError').childAt(0).html())
      .toContain(oneLine`Your version of Firefox does not support this add-on
      because it requires a restart.`);
  });

  it('renders a notice and logs warning when reason code not known', () => {
    const fakeLog = getFakeLogger();
    const reason = 'fake reason';
    const _getClientCompatibility = makeGetClientCompatibilityIncompatible({
      reason,
    });

    const root = render({ _getClientCompatibility, _log: fakeLog });

    sinon.assert.calledWith(
      fakeLog.warn,
      `Unknown reason code supplied to AddonCompatibilityError: ${reason}`,
    );
    expect(root.find('.AddonCompatibilityError').childAt(0).html()).toContain(
      'Your browser does not support add-ons.',
    );
  });
});
