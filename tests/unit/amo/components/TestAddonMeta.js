import { shallow } from 'enzyme';
import * as React from 'react';

import AddonMeta, {
  AddonMetaBase,
  roundToOneDigit,
} from 'amo/components/AddonMeta';
import Link from 'amo/components/Link';
import RatingsByStar from 'amo/components/RatingsByStar';
import { reviewListURL } from 'amo/reducers/reviews';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
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

    function getReviewData(root) {
      return root.find(MetadataCard).prop('metadata')[1];
    }

    function getReviewTitle(root) {
      const { title } = getReviewData(root);
      return shallow(<div>{title}</div>);
    }

    function getReviewCount(root) {
      const { content } = getReviewData(root);
      return shallow(<div>{content}</div>);
    }

    function getAverageData(root) {
      return root.find(MetadataCard).prop('metadata')[2];
    }

    function getAverageTitle(root) {
      return shallow(getAverageData(root).title);
    }

    function getAverageNumber(root) {
      return shallow(getAverageData(root).content);
    }

    it('renders a count of multiple reviews', () => {
      const slug = 'some-slug';
      const ratingsCount = 5;
      const root = render({
        addon: createInternalAddon({
          ...fakeAddon,
          ratings: { text_count: 3, count: ratingsCount },
          slug,
        }),
      });

      const reviewTitleLink = getReviewTitle(root).find(Link);
      const reviewCountLink = getReviewCount(root).find(Link);

      const listURL = reviewListURL({ addonSlug: slug });

      expect(reviewTitleLink).toHaveProp('to', listURL);
      expect(reviewTitleLink.children()).toHaveText('Reviews');

      expect(reviewCountLink).toHaveProp('to', listURL);
      expect(reviewCountLink.children()).toHaveText(ratingsCount.toString());
    });

    it('renders a count of one review', () => {
      const root = renderRatings({ count: 1 });

      expect(
        getReviewCount(root)
          .find(Link)
          .children(),
      ).toHaveText('1');
      expect(
        getReviewTitle(root)
          .find(Link)
          .children(),
      ).toHaveText('Review');
    });

    it('localizes review count', () => {
      const i18n = fakeI18n({ lang: 'de' });
      const root = renderRatings({ count: 1000 }, { i18n });

      expect(
        getReviewCount(root)
          .find(Link)
          .children(),
      ).toHaveText('1.000');
    });

    it('handles no addon', () => {
      const root = render({ addon: null });

      expect(getReviewTitle(root).children()).toHaveText('Reviews');
      expect(getReviewCount(root).children()).toHaveLength(0);
      // rating=undefined will render a loading state.
      expect(getAverageNumber(root).find(Rating)).toHaveProp(
        'rating',
        undefined,
      );
    });

    it('handles zero reviews', () => {
      const root = render({
        addon: createInternalAddon({ ...fakeAddon, ratings: null }),
      });

      expect(getReviewTitle(root).children()).toHaveText('No Reviews');
      expect(getReviewCount(root).children()).toHaveLength(0);

      expect(getAverageNumber(root).find(Rating)).toHaveProp('rating', null);
      expect(getAverageTitle(root)).toHaveText('Not rated yet');
    });

    it('handles an addon without ratings', () => {
      const root = render({
        addon: createInternalAddon({ ...fakeAddon, ratings: undefined }),
      });

      // This should be null so it doesn't render a loading state.
      expect(getAverageNumber(root).find(Rating)).toHaveProp('rating', null);
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

      expect(getAverageNumber(root).find(Rating)).toHaveProp('rating', average);
      expect(getAverageTitle(root)).toHaveText(
        `${roundToOneDigit(average)} Stars`,
      );
    });

    it('renders a 1 star average rating', () => {
      const root = renderRatings({ average: 1.0 });

      expect(getAverageTitle(root)).toHaveText('1 Star');
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
