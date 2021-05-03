import * as React from 'react';

import { ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import AddonTitle from 'amo/components/AddonTitle';
import AddonBadges from 'amo/components/AddonBadges';
import StaticAddonCard, {
  StaticAddonCardBase,
} from 'blog-utils/StaticAddonCard';
import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
} from 'amo/components/GetFirefoxButton';
import Rating from 'amo/components/Rating';
import ThemeImage from 'amo/components/ThemeImage';
import {
  fakeAddon,
  fakeI18n,
  createLocalizedString,
  createInternalAddonWithLang,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ addon }) => {
    return shallowUntilTarget(
      <StaticAddonCard addon={addon} i18n={fakeI18n()} />,
      StaticAddonCardBase,
    );
  };

  it('renders nothing when add-on is falsey', () => {
    const root = render({ addon: null });

    expect(root.find('.StaticAddonCard')).toHaveLength(0);
  });

  it('renders a static add-on card', () => {
    const addon = createInternalAddonWithLang(fakeAddon);

    const root = render({ addon });

    expect(root.find('.StaticAddonCard')).toHaveLength(1);
    expect(root).toHaveProp('data-addon-id', addon.id);

    expect(root.find(AddonTitle)).toHaveLength(1);
    expect(root.find(AddonTitle)).toHaveProp('addon', addon);

    expect(root.find(AddonBadges)).toHaveLength(1);
    expect(root.find(AddonBadges)).toHaveProp('addon', addon);

    expect(root.find('.StaticAddonCard-summary').html()).toContain(
      addon.summary,
    );

    expect(root.find(GetFirefoxButton)).toHaveLength(1);
    expect(root.find(GetFirefoxButton)).toHaveProp('addon', addon);
    expect(root.find(GetFirefoxButton)).toHaveProp(
      'buttonType',
      GET_FIREFOX_BUTTON_TYPE_ADDON,
    );
    expect(root.find(GetFirefoxButton)).toHaveProp('useNewVersion', true);

    // This is always rendered but hidden by default using CSS.
    expect(root.find('.StaticAddonCard-error-overlay')).toHaveLength(1);
  });

  it('displays the description if there is no summary', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, summary: null });

    const root = render({ addon });

    expect(root.find('.StaticAddonCard-summary').html()).not.toContain(
      addon.summary,
    );
    expect(root.find('.StaticAddonCard-summary').html()).toContain(
      addon.description,
    );
  });

  it('sanitizes the summary', () => {
    const scriptHTML = createLocalizedString(
      '<script>alert(document.cookie);</script>',
    );

    const root = render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        summary: scriptHTML,
      }),
    });

    // Make sure an actual script tag was not created.
    expect(root.find('.StaticAddonCard-summary script')).toHaveLength(0);
    // Make sure the script has been removed.
    expect(root.find('.StaticAddonCard-summary').html()).not.toContain(
      '<script>',
    );
  });

  it('displays the number of users', () => {
    const average_daily_users = 1234567;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      average_daily_users,
    });

    const root = render({ addon });

    expect(root.find('.StaticAddonCard-metadata-adu')).toHaveLength(1);
    expect(root.find('.StaticAddonCard-metadata-adu').text()).toEqual(
      'Users: 1,234,567',
    );
  });

  it('hides the number of users when there is no data', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      average_daily_users: null,
    });

    const root = render({ addon });

    expect(root.find('.StaticAddonCard-metadata-adu')).toHaveLength(0);
  });

  it('displays ratings', () => {
    const average = 4.3;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      ratings: { average },
    });

    const root = render({ addon });

    expect(root.find(Rating)).toHaveLength(1);
    expect(root.find(Rating)).toHaveProp('rating', average);
    expect(root.find(Rating)).toHaveProp('readOnly', true);
    expect(root.find(Rating)).toHaveProp('styleSize', 'small');
  });

  it('hides ratings when there is no data', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      ratings: null,
    });

    const root = render({ addon });

    expect(root.find(Rating)).toHaveLength(0);
  });

  it('renders a theme image preview when add-on is a theme', () => {
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      type: ADDON_TYPE_STATIC_THEME,
    });

    const root = render({ addon });

    expect(root).toHaveClassName('StaticAddonCard--is-theme');
    expect(root.find(ThemeImage)).toHaveLength(1);
    expect(root.find(ThemeImage)).toHaveProp('addon', addon);
    expect(root.find('.StaticAddonCard-icon')).toHaveLength(0);
  });

  it('overrides some query parameters in the download FF link', () => {
    const addon = createInternalAddonWithLang(fakeAddon);

    const root = render({ addon });

    expect(root.find(GetFirefoxButton)).toHaveProp('overrideQueryParams', {
      utm_term: `amo-blog-fx-cta-${addon.id}`,
      experiment: null,
      variation: null,
    });
  });
});
