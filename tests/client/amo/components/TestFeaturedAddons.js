import React from 'react';

import * as featuredActions from 'amo/actions/featured';
import {
  FeaturedAddonsBase,
  mapStateToProps,
} from 'amo/components/FeaturedAddons';
import createStore from 'amo/store';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import { fakeAddon, signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst, shallowRender } from 'tests/client/helpers';


describe('<FeaturedAddons />', () => {
  let store;

  beforeEach(() => {
    const initialState = { api: signedInApiState };
    store = createStore(initialState);
  });

  function render({ ...props }) {
    return shallowRender(
      <FeaturedAddonsBase i18n={getFakeI18nInst()} {...props} />
    );
  }

  it('renders a FeaturedAddons page with no add-ons set', () => {
    store.dispatch(
      featuredActions.getFeatured({ addonType: ADDON_TYPE_EXTENSION }));
    const root = render(mapStateToProps(store.getState()));

    assert.include(
      root.props.children[0].props.children,
      'More Featured Extensions'
    );
  });

  it('renders a FeaturedAddons page with themes HTML', () => {
    store.dispatch(
      featuredActions.getFeatured({ addonType: ADDON_TYPE_THEME }));
    const root = render(mapStateToProps(store.getState()));

    assert.include(
      root.props.children[0].props.children,
      'More Featured Themes'
    );
  });

  it('renders each add-on when set', () => {
    store.dispatch(featuredActions.loadFeatured({
      addonType: ADDON_TYPE_EXTENSION,
      entities: {
        addons: {
          howdy: {
            ...fakeAddon, name: 'Howdy', slug: 'howdy',
          },
          'howdy-again': {
            ...fakeAddon, name: 'Howdy again', slug: 'howdy-again',
          },
        },
      },
      result: { results: ['howdy', 'howdy-again'] },
    }));
    const root = render(mapStateToProps(store.getState()));

    assert.deepEqual(
      root.props.children[1].props.results.map((result) => result.name),
      ['Howdy', 'Howdy again']
    );
  });

  it('throws if add-on type is not supported', () => {
    assert.throws(() => {
      render({ addonType: 'XUL' });
    }, 'Invalid addonType: "XUL"');
  });
});
