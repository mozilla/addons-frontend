import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import AddonMeta from 'amo/components/AddonMeta';
import createStore from 'amo/store';
import { setLang } from 'core/actions';
import { getFakeI18nInst } from 'tests/client/helpers';

function render({ ...customProps } = {}) {
  const props = {
    averageDailyUsers: 5,
    store: createStore(),
    i18n: getFakeI18nInst(),
    lang: 'en-US',
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
      const root = render({ averageDailyUsers: 2 });
      assert.equal(getUserCount(root), '2 users');
    });

    it('renders one user', () => {
      const root = render({ averageDailyUsers: 1 });
      assert.equal(getUserCount(root), '1 user');
    });

    it('localizes the user count', () => {
      const store = createStore();
      store.dispatch(setLang('de'));
      const root = render({
        store, averageDailyUsers: 1000,
      });
      assert.match(getUserCount(root), /^1\.000/);
    });
  });
});
