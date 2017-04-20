import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import * as landingActions from 'amo/actions/landing';
import { LandingPageBase, mapStateToProps } from 'amo/components/LandingPage';
import createStore from 'amo/store';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { visibleAddonType } from 'core/utils';
import { fakeAddon } from 'tests/client/amo/helpers';
import { getFakeI18nInst, shallowRender } from 'tests/client/helpers';


describe('<LandingPage />', () => {
  const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

  function render({ ...props }) {
    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <LandingPageBase i18n={getFakeI18nInst()} {...props} />
        </I18nProvider>
      </Provider>
    ), LandingPageBase));
  }

  it('renders a LandingPage with no addons set', () => {
    const root = render({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION) },
    });

    assert.include(root.textContent, 'Featured extensions');
    assert.include(root.textContent, 'More featured extensions');
  });

  it('sets the links in each footer for extensions', () => {
    const root = shallowRender(
      <LandingPageBase i18n={getFakeI18nInst()} params={{
        visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
      }} />
    );

    assert.deepEqual(root.props.children[1].props.footerLink, {
      pathname: `/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`,
    });
    assert.deepEqual(root.props.children[2].props.footerLink, {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_TOP_RATED },
    });
    assert.deepEqual(root.props.children[3].props.footerLink, {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_POPULAR },
    });
  });

  it('sets the links in each footer for themes', () => {
    const root = shallowRender(
      <LandingPageBase i18n={getFakeI18nInst()} params={{
        visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
      }} />
    );

    assert.deepEqual(root.props.children[1].props.footerLink, {
      pathname: `/${visibleAddonType(ADDON_TYPE_THEME)}/featured/`,
    });
    assert.deepEqual(root.props.children[2].props.footerLink, {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TOP_RATED },
    });
    assert.deepEqual(root.props.children[3].props.footerLink, {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_POPULAR },
    });
  });

  it('renders a LandingPage with themes HTML', () => {
    const root = render({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    assert.include(root.textContent, 'Featured themes');
    assert.include(root.textContent, 'More featured themes');
  });

  it('renders each add-on when set', () => {
    const store = createStore(initialState);
    store.dispatch(landingActions.loadLanding({
      featured: {
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
        result: { count: 50, results: ['howdy', 'howdy-again'] },
      },
      highlyRated: {
        entities: {
          addons: {
            high: {
              ...fakeAddon, name: 'High', slug: 'high',
            },
            'high-again': {
              ...fakeAddon, name: 'High again', slug: 'high-again',
            },
          },
        },
        result: { count: 50, results: ['high', 'high-again'] },
      },
      popular: {
        entities: {
          addons: {
            pop: {
              ...fakeAddon, name: 'Pop', slug: 'pop',
            },
            'pop-again': {
              ...fakeAddon, name: 'Pop again', slug: 'pop-again',
            },
          },
        },
        result: { count: 50, results: ['pop', 'pop-again'] },
      },
    }));
    const root = render({
      ...mapStateToProps(store.getState()),
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    assert.deepEqual(
      Object.values(root.querySelectorAll('.SearchResult-heading'))
        .map((heading) => heading.textContent),
      ['Howdy', 'Howdy again', 'High', 'High again', 'Pop', 'Pop again']
    );
  });

  it('renders not found if add-on type is not supported', () => {
    const root = render({ params: { visibleAddonType: 'XUL' } });
    assert.include(root.textContent, 'Page not found');
  });

  it('throws for any error other than an unknown addonType', () => {
    assert.throws(() => {
      render({
        apiAddonType: () => { throw new Error('Ice cream'); },
        params: { visibleAddonType: 'doesnotmatter' },
      });
    }, 'Ice cream');
  });
});
