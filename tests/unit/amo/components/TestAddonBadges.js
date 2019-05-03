import * as React from 'react';

import AddonBadges, { AddonBadgesBase } from 'amo/components/AddonBadges';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Badge from 'ui/components/Badge';
import RecommendedBadge from 'ui/components/RecommendedBadge';

describe(__filename, () => {
  function shallowRender(props) {
    const allProps = {
      _config: getFakeConfig({
        enableFeatureRecommendedBadges: false,
      }),
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...props,
    };

    return shallowUntilTarget(<AddonBadges {...allProps} />, AddonBadgesBase);
  }

  it('returns null when there is no add-on', () => {
    const root = shallowRender({ addon: null });
    expect(root.html()).toEqual(null);
  });

  it('displays no badges when none are called for', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      type: ADDON_TYPE_EXTENSION,
    });
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveLength(0);
  });

  it('displays a badge when the addon is recommended', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    });

    const addon = createInternalAddon({
      ...fakeAddon,
      is_recommended: true,
      type: ADDON_TYPE_EXTENSION,
    });
    const root = shallowRender({
      _config: getFakeConfig({
        enableFeatureRecommendedBadges: true,
      }),
      addon,
      store,
    });

    expect(root.find(RecommendedBadge)).toHaveLength(1);
  });

  it('does not display a recommended badge on Android', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
    });

    const addon = createInternalAddon({
      ...fakeAddon,
      is_recommended: true,
      type: ADDON_TYPE_EXTENSION,
    });
    const root = shallowRender({
      _config: getFakeConfig({
        enableFeatureRecommendedBadges: true,
      }),
      addon,
      store,
    });

    expect(root.find(RecommendedBadge)).toHaveLength(0);
  });

  it('does not display a recommended badge when the feature is disabled', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      is_recommended: true,
      type: ADDON_TYPE_EXTENSION,
    });
    const root = shallowRender({
      _config: getFakeConfig({
        enableFeatureRecommendedBadges: false,
      }),
      addon,
    });

    expect(root.find(RecommendedBadge)).toHaveLength(0);
  });

  it('displays a badge when the addon is featured', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      is_featured: true,
      type: ADDON_TYPE_EXTENSION,
    });
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'featured');
    expect(root.find(Badge)).toHaveProp('label', 'Featured Extension');
  });

  it('adds a different badge label when a "theme" addon is featured', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      is_featured: true,
      type: ADDON_TYPE_THEME,
    });
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'featured');
    expect(root.find(Badge)).toHaveProp('label', 'Featured Theme');
  });

  it('adds a different badge label when a "static theme" addon is featured', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      is_featured: true,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'featured');
    expect(root.find(Badge)).toHaveProp('label', 'Featured Theme');
  });

  it('adds a different badge label when an addon of a different type is featured', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      is_featured: true,
      type: ADDON_TYPE_DICT,
    });
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'featured');
    expect(root.find(Badge)).toHaveProp('label', 'Featured Add-on');
  });

  it('does not display the featured badge when addon is not featured', () => {
    const addon = createInternalAddon({ ...fakeAddon, is_featured: false });
    const root = shallowRender({ addon });

    expect(root.find(Badge).find({ type: 'featured' })).toHaveLength(0);
  });

  it('displays a badge when the addon needs restart', () => {
    const addon = createInternalAddon(
      createFakeAddon({
        files: [{ is_restart_required: true }],
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'restart-required');
    expect(root.find(Badge)).toHaveProp('label', 'Restart Required');
  });

  it('does not display the "restart required" badge when addon does not need restart', () => {
    const addon = createInternalAddon(
      createFakeAddon({
        files: [{ is_restart_required: false }],
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveLength(0);
  });

  it('does not display the "restart required" badge when isRestartRequired is not true', () => {
    const root = shallowRender({ addon: createInternalAddon(fakeAddon) });

    expect(root.find(Badge).find({ type: 'restart-required' })).toHaveLength(0);
  });

  it('displays a badge when the addon is experimental', () => {
    const addon = createInternalAddon(
      createFakeAddon({
        is_experimental: true,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'experimental');
    expect(root.find(Badge)).toHaveProp('label', 'Experimental');
  });

  it('does not display a badge when the addon is not experimental', () => {
    const addon = createInternalAddon(
      createFakeAddon({
        is_experimental: false,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge).find({ type: 'experimental' })).toHaveLength(0);
  });

  describe('Quantum compatible badge', () => {
    it('does not display a badge when add-on is compatible with Quantum', () => {
      const addon = createInternalAddon(
        createFakeAddon({
          files: [
            {
              is_webextension: true,
            },
          ],
          compatibility: {
            [CLIENT_APP_FIREFOX]: {
              max: '*',
              min: '53.0',
            },
          },
          is_strict_compatibility_enabled: false,
        }),
      );

      const root = shallowRender({ addon });

      expect(root.find(Badge).find({ type: 'not-compatible' })).toHaveLength(0);
    });

    it('displays a badge when the addon is not compatible with Quantum', () => {
      const addon = createInternalAddon(
        createFakeAddon({
          files: [
            {
              is_mozilla_signed_extension: false,
              is_webextension: false,
            },
          ],
          compatibility: {
            [CLIENT_APP_FIREFOX]: {
              max: '56.*',
              min: '30.0a1',
            },
          },
          is_strict_compatibility_enabled: true,
        }),
      );

      const root = shallowRender({ addon });

      expect(root.find(Badge)).toHaveLength(1);
      expect(root.find(Badge)).toHaveProp('type', 'not-compatible');
      expect(root.find(Badge)).toHaveProp(
        'label',
        'Not compatible with Firefox Quantum',
      );
    });

    it('does not display a badge for add-ons that are not extensions', () => {
      const addon = createInternalAddon(
        createFakeAddon({
          files: [
            {
              is_webextension: false,
            },
          ],
          type: ADDON_TYPE_THEME,
          compatibility: {
            [CLIENT_APP_FIREFOX]: {
              max: '56.*',
              min: '30.0a1',
            },
          },
          is_strict_compatibility_enabled: true,
        }),
      );

      const root = shallowRender({ addon });

      expect(root.find(Badge)).toHaveLength(0);
    });
  });

  it('displays a badge when the addon requires payment', () => {
    const addon = createInternalAddon(
      createFakeAddon({
        requires_payment: true,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'requires-payment');
    expect(root.find(Badge)).toHaveProp(
      'label',
      'Some features may require payment',
    );
  });

  it('does not display a badge when the addon does not require payment', () => {
    const addon = createInternalAddon(
      createFakeAddon({
        requires_payment: false,
      }),
    );
    const root = shallowRender({ addon });

    expect(root.find(Badge).find({ type: 'requires-payment' })).toHaveLength(0);
  });
});
