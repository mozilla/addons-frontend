import { shallow } from 'enzyme';
import * as React from 'react';

import AddonTitle from 'amo/components/AddonTitle';
import AddonSummaryCard, {
  AddonSummaryCardBase,
} from 'amo/components/AddonSummaryCard';
import RatingsByStar from 'amo/components/RatingsByStar';
import Link from 'amo/components/Link';
import fallbackIcon from 'amo/img/icons/default-64.png';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  fakeAddon,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { getAddonURL } from 'amo/utils';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import { DEFAULT_UTM_SOURCE, DEFAULT_UTM_MEDIUM } from 'core/constants';

describe(__filename, () => {
  const render = ({ addon, headerText, location, ...props }) => {
    return shallowUntilTarget(
      <AddonSummaryCard
        addon={addon ? createInternalAddon(addon) : addon}
        headerText={headerText}
        i18n={fakeI18n()}
        {...props}
      />,
      AddonSummaryCardBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  const getAddonHeader = (root) => {
    return shallow(root.find('.AddonSummaryCard').prop('header'));
  };

  const renderAddonHeader = (props = {}) => {
    const root = render(props);

    return getAddonHeader(root);
  };

  describe('Card header', () => {
    it('renders a fallback icon without an add-on', () => {
      const header = renderAddonHeader({ addon: null });

      expect(header.find('.AddonSummaryCard-header-icon img')).toHaveProp(
        'src',
        fallbackIcon,
      );
    });

    it("renders the add-on's icon in the header", () => {
      const addon = fakeAddon;
      const header = renderAddonHeader({ addon });
      const img = header.find('.AddonSummaryCard-header-icon img');

      expect(img).toHaveProp('src', addon.icon_url);
    });

    it('adds a link on the icon when there is an add-on', () => {
      const addon = fakeAddon;

      const header = renderAddonHeader({ addon });

      expect(header.find(Link)).toHaveLength(1);
      expect(header.find(Link)).toHaveProp('to', getAddonURL(addon.slug));
    });

    it('adds a `src` query parameter to the link on the icon when there is a `src` query param', () => {
      const _config = getFakeConfig({ enableFeatureUseUtmParams: false });
      const src = 'some-src';
      const addon = fakeAddon;

      const header = renderAddonHeader({
        _config,
        addon,
        location: createFakeLocation({ query: { src } }),
      });

      expect(header.find(Link)).toHaveProp(
        'to',
        `${getAddonURL(addon.slug)}?src=${src}`,
      );
    });

    it('adds UTM query parameters to the link on the icon when there is a `src` query param and UTM flag is enabled', () => {
      const _config = getFakeConfig({ enableFeatureUseUtmParams: true });
      const src = 'some-src';
      const addon = fakeAddon;

      const header = renderAddonHeader({
        _config,
        addon,
        location: createFakeLocation({ query: { src } }),
      });

      const expectedQueryString = [
        `utm_source=${DEFAULT_UTM_SOURCE}`,
        `utm_medium=${DEFAULT_UTM_MEDIUM}`,
        `utm_content=${src}`,
      ].join('&');
      expect(header.find(Link)).toHaveProp(
        'to',
        `${getAddonURL(addon.slug)}?${expectedQueryString}`,
      );
    });

    it('adds UTM query parameters to the link on the icon when there are some and UTM flag is enabled', () => {
      const _config = getFakeConfig({ enableFeatureUseUtmParams: true });
      const addon = fakeAddon;
      const utm_medium = 'some-utm-medium';

      const header = renderAddonHeader({
        _config,
        addon,
        location: createFakeLocation({ query: { utm_medium } }),
      });

      expect(header.find(Link)).toHaveProp(
        'to',
        `${getAddonURL(addon.slug)}?utm_medium=${utm_medium}`,
      );
    });

    it('does not add UTM query parameters to the link on the icon when there are some but UTM flag is disabled', () => {
      const _config = getFakeConfig({ enableFeatureUseUtmParams: false });
      const addon = fakeAddon;
      const utm_medium = 'some-utm-medium';

      const header = renderAddonHeader({
        _config,
        addon,
        location: createFakeLocation({ query: { utm_medium } }),
      });

      expect(header.find(Link)).toHaveProp('to', getAddonURL(addon.slug));
    });

    it('renders the fallback icon if the origin is not allowed', () => {
      const addon = {
        ...fakeAddon,
        icon_url: 'http://foo.com/hax.png',
      };
      const header = renderAddonHeader({ addon });
      const img = header.find('.AddonSummaryCard-header-icon img');

      expect(img).toHaveProp('src', fallbackIcon);
    });

    it('renders a hidden h1 for SEO', () => {
      const headerText = 'Expected header text';
      const header = renderAddonHeader({ headerText });
      const h1 = header.find('.AddonSummaryCard-header h1');
      expect(h1).toHaveClassName('visually-hidden');
      expect(h1).toHaveText(headerText);
    });

    it('renders an AddonTitle', () => {
      const addon = fakeAddon;

      const header = renderAddonHeader({ addon });

      expect(header.find(AddonTitle)).toHaveProp(
        'addon',
        createInternalAddon(addon),
      );
      expect(header.find(AddonTitle)).toHaveProp('linkSource', undefined);
    });

    it('sets the linkSource to the value of `location.query.src`', () => {
      const _config = getFakeConfig({ enableFeatureUseUtmParams: false });
      const src = 'some-src';

      const header = renderAddonHeader({
        _config,
        addon: fakeAddon,
        location: createFakeLocation({ query: { src } }),
      });

      expect(header.find(AddonTitle)).toHaveProp('linkSource', src);
    });

    it('sets the linkSource to the value of `src` when UTM flag is enabled', () => {
      const _config = getFakeConfig({ enableFeatureUseUtmParams: true });
      const src = 'some-src';

      const header = renderAddonHeader({
        _config,
        addon: fakeAddon,
        location: createFakeLocation({ query: { src } }),
      });

      expect(header.find(AddonTitle)).toHaveProp('linkSource', src);
    });

    it('sets the linkSource to the value of `utm_conetnt` if available when UTM flag is enabled', () => {
      const _config = getFakeConfig({ enableFeatureUseUtmParams: true });
      const utm_content = 'some-src';

      const header = renderAddonHeader({
        _config,
        addon: fakeAddon,
        location: createFakeLocation({ query: { utm_content } }),
      });

      expect(header.find(AddonTitle)).toHaveProp('linkSource', utm_content);
    });
  });

  describe('overallRatingStars', () => {
    it('renders Rating without an add-on', () => {
      const root = render({ addon: null });
      const rating = root.find(Rating);

      expect(rating).toHaveProp('rating', null);
    });

    it('renders Rating without add-on ratings', () => {
      const addon = { ...fakeAddon, ratings: undefined };
      const root = render({ addon });
      const rating = root.find(Rating);

      expect(rating).toHaveProp('rating', undefined);
    });

    it('renders Rating with add-on ratings', () => {
      const addon = {
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          average: 4.5,
        },
      };
      const root = render({ addon });
      const rating = root.find(Rating);

      expect(rating).toHaveProp('rating', addon.ratings.average);
    });

    it('renders RatingsByStar without an add-on', () => {
      const root = render({ addon: null });
      const ratingsByStar = root.find(RatingsByStar);

      expect(ratingsByStar).toHaveProp('addon', null);
    });

    it('renders RatingsByStar with an add-on', () => {
      const addon = { ...fakeAddon, id: 8892 };
      const root = render({ addon });
      const ratingsByStar = root.find(RatingsByStar);

      expect(ratingsByStar).toHaveProp('addon');
      // Do a sanity check to make sure the right add-on was used.
      // This can't compare the full object since it the test doesn't have
      // access to the internal add-on.
      expect(ratingsByStar.prop('addon')).toMatchObject({ id: addon.id });
    });

    it('renders loading text without an add-on', () => {
      const root = render({ addon: null });

      expect(
        root.find('.AddonSummaryCard-addonAverage').find(LoadingText),
      ).toHaveLength(1);
    });

    it('renders empty text without add-on ratings', () => {
      const root = render({ addon: { ...fakeAddon, ratings: undefined } });

      expect(root.find('.AddonSummaryCard-addonAverage').text()).toEqual('');
    });

    it('renders a fixed star average', () => {
      const root = render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            average: 4.6667,
          },
        },
      });

      expect(root.find('.AddonSummaryCard-addonAverage').text()).toEqual(
        '4.7 Stars out of 5',
      );
    });

    it('renders whole number star averages', () => {
      const root = render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            average: 4.0,
          },
        },
      });

      expect(root.find('.AddonSummaryCard-addonAverage').text()).toEqual(
        '4 Stars out of 5',
      );
    });

    it('renders a single star average with singular text', () => {
      const root = render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            average: 1.0,
          },
        },
      });

      expect(root.find('.AddonSummaryCard-addonAverage').text()).toEqual(
        '1 Star out of 5',
      );
    });
  });
});
