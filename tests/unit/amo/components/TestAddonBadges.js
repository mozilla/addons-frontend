import React from 'react';

import AddonBadges, { AddonBadgesBase } from 'amo/components/AddonBadges';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { createFakeAddon, fakeAddon } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Badge from 'ui/components/Badge';


describe(__filename, () => {
  function shallowRender(props) {
    const allProps = {
      i18n: fakeI18n(),
      ...props,
    };

    return shallowUntilTarget(
      <AddonBadges {...allProps} />,
      AddonBadgesBase
    );
  }

  it('returns null when there is no add-on', () => {
    const root = shallowRender({ addon: null });
    expect(root.html()).toEqual(null);
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

    expect(root.find(Badge)).toHaveLength(0);
  });

  it('displays a badge when the addon needs restart', () => {
    const addon = createInternalAddon(createFakeAddon({
      files: [{ is_restart_required: true }],
    }));
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'restart-required');
    expect(root.find(Badge)).toHaveProp('label', 'Restart Required');
  });

  it('does not display the "restart required" badge when addon does not need restart', () => {
    const addon = createInternalAddon(createFakeAddon({
      files: [{ is_restart_required: false }],
    }));
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveLength(0);
  });

  it('does not display the "restart required" badge when isRestartRequired is not true', () => {
    const root = shallowRender({ addon: createInternalAddon(fakeAddon) });

    expect(root.find(Badge)).toHaveLength(0);
  });

  it('displays a badge when the addon is experimental', () => {
    const addon = createInternalAddon(createFakeAddon({
      is_experimental: true,
    }));
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'experimental');
    expect(root.find(Badge)).toHaveProp('label', 'Experimental');
  });

  it('does not display a badge when the addon is not experimental', () => {
    const addon = createInternalAddon(createFakeAddon({
      is_experimental: false,
    }));
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveLength(0);
  });

  describe('Quantum compatible badge', () => {
    it('does not display a badge when add-on is compatible with Quantum', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_webextension: true,
        }],
        compatibility: {
          [CLIENT_APP_FIREFOX]: {
            max: '*',
            min: '53.0',
          },
        },
        is_strict_compatibility_enabled: false,
      }));

      const root = shallowRender({ addon });

      expect(root.find(Badge)).toHaveLength(0);
    });

    it('displays a badge when the addon is not compatible with Quantum', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_mozilla_signed_extension: false,
          is_webextension: false,
        }],
        compatibility: {
          [CLIENT_APP_FIREFOX]: {
            max: '56.*',
            min: '30.0a1',
          },
        },
        is_strict_compatibility_enabled: true,
      }));

      const root = shallowRender({ addon });

      expect(root.find(Badge)).toHaveLength(1);
      expect(root.find(Badge)).toHaveProp('type', 'not-compatible');
      expect(root.find(Badge))
        .toHaveProp('label', 'Not compatible with Firefox Quantum');
    });

    it('does not display a badge for add-ons that are not extensions', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{
          is_webextension: false,
        }],
        type: ADDON_TYPE_THEME,
        compatibility: {
          [CLIENT_APP_FIREFOX]: {
            max: '56.*',
            min: '30.0a1',
          },
        },
        is_strict_compatibility_enabled: true,
      }));

      const root = shallowRender({ addon });

      expect(root.find(Badge)).toHaveLength(0);
    });
  });
});
