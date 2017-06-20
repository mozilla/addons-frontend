import { shallow } from 'enzyme';
import React from 'react';

import { AddonMetaBase } from 'amo/components/AddonMeta';
import { fakeAddon } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';

function render({ ...customProps } = {}) {
  const props = {
    addon: fakeAddon,
    i18n: getFakeI18nInst(),
    ...customProps,
  };
  return shallow(<AddonMetaBase {...props} />);
}

describe('<AddonMeta>', () => {
  it('can render without an addon', () => {
    const root = render({ addon: null });
    expect(root.find('.AddonMeta-user-count').find(LoadingText))
      .toHaveLength(1);
    expect(root.find('.AddonMeta-review-count').text())
      .toContain('No reviews');
    expect(root.find(Rating).prop('rating')).toEqual(null);
  });

  describe('average daily users', () => {
    function getUserCount(root) {
      return root.find('.AddonMeta-user-count').text();
    }

    it('renders the user count', () => {
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 2 },
      });
      expect(getUserCount(root)).toEqual('2 users');
    });

    it('renders one user', () => {
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 1 },
      });
      expect(getUserCount(root)).toEqual('1 user');
    });

    it('localizes the user count', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 1000 },
        i18n,
      });
      expect(getUserCount(root)).toMatch(/^1\.000/);
    });
  });

  describe('ratings', () => {
    function renderRatings(ratings = {}, otherProps = {}) {
      return render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            ...ratings,
          },
        },
        ...otherProps,
      });
    }

    function getReviewCount(root) {
      return root.find('.AddonMeta-review-count').text();
    }

    it('renders a count of multiple ratings', () => {
      const root = renderRatings({ count: 5 });
      expect(getReviewCount(root)).toEqual('5 reviews');
    });

    it('renders a count of one rating', () => {
      const root = renderRatings({ count: 1 });
      expect(getReviewCount(root)).toEqual('1 review');
    });

    it('localizes review count', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = renderRatings({ count: 1000 }, { i18n });
      expect(getReviewCount(root)).toContain('1.000');
    });
  });
});
