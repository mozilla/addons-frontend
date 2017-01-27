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
  describe('averageDailyUsers', () => {
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
});
