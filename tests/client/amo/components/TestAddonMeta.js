import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import AddonMeta from 'amo/components/AddonMeta';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

function render({ ...customProps } = {}) {
  const props = {
    addon: fakeAddon,
    i18n: getFakeI18nInst(),
    ...customProps,
  };
  const root = findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={props.i18n}>
      <AddonMeta {...props} />
    </I18nProvider>
  ), AddonMeta);
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
      return root.querySelector('.AddonMeta-Rating').textContent;
    }

    function getReviewCount(root) {
      return root.querySelector('.AddonMeta-review-count').textContent;
    }

    it('renders the average rating', () => {
      const root = renderRatings({ average: 3.5 });
      assert.equal(getRating(root), 'Rated 3.5 out of 5');
    });

    it('localizes average rating', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = renderRatings({ average: 3.5 }, { i18n });
      assert.include(getRating(root), '3,5');
    });

    it('renders a count of multiple ratings', () => {
      const root = renderRatings({ count: 5 });
      assert.equal(getReviewCount(root), '5 reviews');
    });

    it('renders a count of one rating', () => {
      const root = renderRatings({ count: 1 });
      assert.equal(getReviewCount(root), '1 review');
    });

    it('localizes review count', () => {
      const i18n = getFakeI18nInst({ lang: 'de' });
      const root = renderRatings({ count: 1000 }, { i18n });
      assert.include(getReviewCount(root), '1.000');
    });

    it('renders empty ratings', () => {
      const root = renderRatings({ average: null });
      assert.equal(getRating(root), 'No ratings');
    });
  });
});
