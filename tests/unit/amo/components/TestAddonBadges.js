import React from 'react';

import AddonBadges, { AddonBadgesBase } from 'amo/components/AddonBadges';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { createFakeAddon, fakeAddon } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Badge from 'ui/components/Badge';


describe(__filename, () => {
  function shallowRender(props) {
    return shallowUntilTarget(
      <AddonBadges i18n={fakeI18n()} {...props} />,
      AddonBadgesBase
    );
  }

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
      type: ADDON_TYPE_OPENSEARCH,
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
});
