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
    store = createStore(initialState).store;
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

    expect(root.props.children[0].props.children).toContain('More Featured Extensions');
  });

  it('renders a FeaturedAddons page with themes HTML', () => {
    store.dispatch(
      featuredActions.getFeatured({ addonType: ADDON_TYPE_THEME }));
    const root = render(mapStateToProps(store.getState()));

    expect(root.props.children[0].props.children).toContain('More Featured Themes');
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

    expect(root.props.children[1].props.results.map((result) => result.name)).toEqual(['Howdy', 'Howdy again']);
  });

  it('throws if add-on type is not supported', () => {
    expect(() => {
      render({ addonType: 'XUL' });
    }).toThrow();
  });
});
