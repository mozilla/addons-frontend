import { shallow } from 'enzyme';
import * as React from 'react';

import AddonMeta, {
  AddonMetaBase,
  roundToOneDigit,
} from 'amo/components/AddonMeta';
import RatingsByStar from 'amo/components/RatingsByStar';
import { createInternalAddon } from 'core/reducers/addons';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import MetadataCard from 'ui/components/MetadataCard';
import Rating from 'ui/components/Rating';

describe(__filename, () => {
  function render({
    addon = createInternalAddon(fakeAddon),
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <AddonMeta addon={addon} i18n={fakeI18n()} store={store} {...props} />,
      AddonMetaBase,
    );
  }

  it('can render without an addon', () => {
    const root = render({ addon: null });
    expect(root.find('.AddonMeta')).toHaveLength(1);
    expect(root.find(MetadataCard)).toHaveLength(1);
  });

  describe('average daily users', () => {
    function getUserCount(root) {
      return root.find(MetadataCard).prop('metadata')[0];
    }

    it('renders the user count', () => {
      const root = render({
        addon: createInternalAddon({ ...fakeAddon, average_daily_users: 2 }),
      });

      expect(getUserCount(root).content).toEqual('2');
      expect(getUserCount(root).title).toEqual('Users');
    });

    it('renders one user', () => {
      const root = render({
        addon: createInternalAddon({ ...fakeAddon, average_daily_users: 1 }),
      });

      expect(getUserCount(root).content).toEqual('1');
      expect(getUserCount(root).title).toEqual('User');
    });

    it('renders no users', () => {
      const root = render({
        addon: createInternalAddon({ ...fakeAddon, average_daily_users: 0 }),
      });

      expect(getUserCount(root).content).toEqual('');
      expect(getUserCount(root).title).toEqual('No Users');
    });

    it('localizes the user count', () => {
      const i18n = fakeI18n({ lang: 'de' });
      const root = render({
        addon: createInternalAddon({
          ...fakeAddon,
          average_daily_users: 1000,
        }),
        i18n,
      });
      expect(getUserCount(root).content).toMatch(/^1\.000/);
    });
  });

  describe('ratings', () => {
    function renderRatings(ratings = {}, otherProps = {}) {
      return render({
        addon: createInternalAddon({
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            ...ratings,
          },
        }),
        ...otherProps,
      });
    }

    function getReviewCount(root) {
      return root.find(MetadataCard).prop('metadata')[1];
    }

    function getAverageMeta(root) {
      return root.find(MetadataCard).prop('metadata')[2];
    }

    it('renders a count of multiple ratings', () => {
      const root = renderRatings({ count: 5 });

      expect(getReviewCount(root).content).toEqual('5');
      expect(getReviewCount(root).title).toEqual('Ratings');
    });

    it('renders a count of one rating', () => {
      const root = renderRatings({ count: 1 });

      expect(getReviewCount(root).content).toEqual('1');
      expect(getReviewCount(root).title).toEqual('Rating');
    });

    it('localizes review count', () => {
      const i18n = fakeI18n({ lang: 'de' });
      const root = renderRatings({ count: 1000 }, { i18n });

      expect(getReviewCount(root).content).toEqual('1.000');
    });

    it('handles zero ratings', () => {
      const root = render({
        addon: createInternalAddon({ ...fakeAddon, ratings: null }),
      });

      expect(getReviewCount(root).title).toEqual('No Ratings');

      const averageMeta = getAverageMeta(root);
      const rating = shallow(averageMeta.content).find(Rating);
      const title = shallow(averageMeta.title).find('.AddonMeta-rating-title');

      expect(rating).toHaveProp('rating', null);
      expect(title).toHaveText('Not rated yet');
    });

    it('renders RatingsByStar with an add-on', () => {
      const addon = createInternalAddon(fakeAddon);
      const root = render({ addon });

      expect(root.find(RatingsByStar)).toHaveProp('addon', addon);
    });

    it('renders RatingsByStar without an add-on', () => {
      const root = render({ addon: null });

      expect(root.find(RatingsByStar)).toHaveProp('addon', null);
    });

    it('renders the average rating', () => {
      const average = 2.34;
      const root = renderRatings({ average });

      const averageMeta = getAverageMeta(root);
      const rating = shallow(averageMeta.content).find(Rating);
      const title = shallow(averageMeta.title).find('.AddonMeta-rating-title');

      expect(rating).toHaveProp('rating', average);
      expect(title).toHaveText(`${roundToOneDigit(average)} star average`);
    });
  });

  describe('roundToOneDigit', () => {
    it('returns a 0 for a null', () => {
      expect(roundToOneDigit(null)).toEqual(0);
    });

    it('returns a 0 for a 0', () => {
      expect(roundToOneDigit(0)).toEqual(0);
    });

    it('rounds a float down to one digit', () => {
      expect(roundToOneDigit(2.34)).toEqual(2.3);
    });

    it('rounds a float up to one digit', () => {
      expect(roundToOneDigit(2.36)).toEqual(2.4);
    });

    it('returns an integer with no decimal point', () => {
      expect(roundToOneDigit(2)).toEqual(2);
    });
  });
});
