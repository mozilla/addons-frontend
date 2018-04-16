import * as React from 'react';

import AddonMeta, { AddonMetaBase } from 'amo/components/AddonMeta';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import MetadataCard from 'ui/components/MetadataCard';


describe(__filename, () => {
  function render({
    addon = createInternalAddon(fakeAddon),
    store = dispatchClientMetadata().store,
    ...props
  } = {}) {
    return shallowUntilTarget(
      <AddonMeta
        addon={addon}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      AddonMetaBase
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

    it('renders a count of multiple ratings', () => {
      const root = renderRatings({ count: 5 });

      expect(getReviewCount(root).content.props.children).toEqual('5');
      expect(getReviewCount(root).title.props.children).toEqual('Ratings');
    });

    it('renders a count of one rating', () => {
      const root = renderRatings({ count: 1 });

      expect(getReviewCount(root).content.props.children).toEqual('1');
      expect(getReviewCount(root).title.props.children).toEqual('Rating');
    });

    it('localizes review count', () => {
      const i18n = fakeI18n({ lang: 'de' });
      const root = renderRatings({ count: 1000 }, { i18n });

      expect(getReviewCount(root).content.props.children).toEqual('1.000');
    });

    it('handles zero ratings', () => {
      const root = render({
        addon: createInternalAddon({ ...fakeAddon, ratings: null }),
      });

      expect(getReviewCount(root).title.props.children).toEqual('No Ratings');
    });
  });
});
