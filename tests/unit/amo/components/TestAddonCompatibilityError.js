import * as React from 'react';

import AddonCompatibilityError, {
  AddonCompatibilityErrorBase,
} from 'amo/components/AddonCompatibilityError';
import {
  CLIENT_APP_FIREFOX,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
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

  it('renders a notice if add-on is incompatible with the platform', () => {
    const _getClientCompatibility = makeGetClientCompatibilityIncompatible({
      reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
    });

    const root = render({ _getClientCompatibility });

    expect(root.find('.AddonCompatibilityError').childAt(0).html()).toContain(
      'This add-on is not available on your platform.',
    );
  });

  it.each([
    INCOMPATIBLE_ANDROID_UNSUPPORTED,
    INCOMPATIBLE_FIREFOX_FOR_IOS,
    INCOMPATIBLE_NOT_FIREFOX,
    INCOMPATIBLE_UNDER_MIN_VERSION,
    'unknown reason',
  ])('renders nothing if the incompatibility reason is %s', (reason) => {
    const _getClientCompatibility = makeGetClientCompatibilityIncompatible({
      reason,
    });

    const root = render({ _getClientCompatibility });

    expect(root.find('.AddonCompatibilityError')).toHaveLength(0);
  });
});
