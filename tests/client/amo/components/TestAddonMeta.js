import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import AddonMeta from 'amo/components/AddonMeta';
import { fakeAddon } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

function render({ ...customProps } = {}) {
  const props = {
    addon: fakeAddon,
    i18n: getFakeI18nInst(),
    ...customProps,
  };
  const root = renderIntoDocument(<AddonMeta {...props} />);
  return findDOMNode(root);
}

describe('<AddonMeta>', () => {
  describe('average daily users', () => {
    function getUserCount(root) {
      return root.querySelector('.AddonMeta-users > p').textContent;
    }

    it('renders the user count', () => {
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 2 },
      });
      assert.equal(getUserCount(root), '2 users');
    });

    it('renders one user', () => {
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 1 },
      });
      assert.equal(getUserCount(root), '1 user');
    });

    it('localizes the user count', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = render({
        addon: { ...fakeAddon, average_daily_users: 1000 },
        i18n,
      });
      assert.match(getUserCount(root), /^1\.000/);
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

    function getRating(root) {
      return root.querySelector(
        '.AddonMeta-ratings > p.AddonMeta-star-count').textContent;
    }

    function getRatingCount(root) {
      return root.querySelector(
        '.AddonMeta-ratings > p.AddonMeta-rating-count').textContent;
    }

    it('renders the average rating', () => {
      const root = renderRatings({ average: 3.5 });
      assert.equal(getRating(root), '3.5 out of 5');
    });

    it('localizes average rating', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = renderRatings({ average: 3.5 }, { i18n });
      assert.include(getRating(root), '3,5');
    });

    it('renders a count of multiple ratings', () => {
      const root = renderRatings({ count: 5 });
      assert.equal(getRatingCount(root), '5 ratings');
    });

    it('renders a count of one rating', () => {
      const root = renderRatings({ count: 1 });
      assert.equal(getRatingCount(root), '1 rating');
    });

    it('localizes review count', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = renderRatings({ count: 1000 }, { i18n });
      assert.include(getRatingCount(root), '1.000');
    });

    it('renders empty ratings', () => {
      const root = renderRatings({ average: null });
      assert.equal(getRating(root), 'Not yet rated');
    });

    it('renders an empty review count', () => {
      const root = renderRatings({ count: null });
      assert.isNull(
        root.querySelector('.AddonMeta-ratings > p.AddonMeta-rating-count'));
    });
  });
});
