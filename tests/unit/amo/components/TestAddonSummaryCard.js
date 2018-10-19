import { shallow } from 'enzyme';
import * as React from 'react';

import AddonTitle from 'amo/components/AddonTitle';
import AddonSummaryCard, {
  AddonSummaryCardBase,
} from 'amo/components/AddonSummaryCard';
import RatingsByStar from 'amo/components/RatingsByStar';
import fallbackIcon from 'amo/img/icons/default-64.png';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon, fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';

describe(__filename, () => {
  const render = ({ addon, headerText }) => {
    return shallowUntilTarget(
      <AddonSummaryCard
        addon={addon ? createInternalAddon(addon) : addon}
        headerText={headerText}
        i18n={fakeI18n()}
      />,
      AddonSummaryCardBase,
    );
  };

  const getAddonHeader = (root) => {
    return shallow(root.find('.AddonSummaryCard').prop('header'));
  };

  const renderAddonHeader = ({ addon, headerText }) => {
    const root = render({ addon, headerText });
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
        '4.7 star average',
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
        '4 star average',
      );
    });
  });
});
