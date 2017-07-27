import { mount, shallow } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import NotFound from 'amo/components/ErrorPage/NotFound';
import { setViewContext } from 'amo/actions/viewContext';
import * as landingActions from 'amo/actions/landing';
import { LandingPageBase, mapStateToProps } from 'amo/components/LandingPage';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { visibleAddonType } from 'core/utils';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('<LandingPage />', () => {
  function renderProps(props = {}) {
    return {
      dispatch: sinon.stub(),
      i18n: getFakeI18nInst(),
      ...props,
    };
  }

  function render(props = {}) {
    return shallow(<LandingPageBase {...renderProps(props)} />);
  }

  function renderAndMount(props = {}) {
    const { store } = dispatchClientMetadata();
    return mount(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <LandingPageBase {...renderProps(props)} />
        </I18nProvider>
      </Provider>
    );
  }

  it('dispatches setViewContext on load and update', () => {
    const fakeDispatch = sinon.stub();
    const root = render({
      dispatch: fakeDispatch,
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION) },
    });

    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
    fakeDispatch.reset();

    // Trigger componentDidUpdate()
    root.setState();

    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
  });

  it('renders a LandingPage with no addons set', () => {
    const root = renderAndMount({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION) },
    });

    expect(root).toIncludeText('Featured extensions');
    expect(root).toIncludeText('More featured extensions');
  });

  it('renders a link to all categories', () => {
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const root = render({ params: fakeParams });

    expect(root.find('.LandingPage-button'))
      .toHaveProp('children', 'Explore all categories');
  });

  it('sets the links in each footer for extensions', () => {
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const root = render({ params: fakeParams });

    expect(root.childAt(3)).toHaveProp('footerLink', {
      pathname: `/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`,
    });
    expect(root.childAt(4)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_TOP_RATED },
    });
    expect(root.childAt(5)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_POPULAR },
    });
  });

  it('sets the links in each footer for themes', () => {
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
    };
    const root = render({ params: fakeParams });

    expect(root.childAt(3)).toHaveProp('footerLink', {
      pathname: `/${visibleAddonType(ADDON_TYPE_THEME)}/featured/`,
    });
    expect(root.childAt(4)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TOP_RATED },
    });
    expect(root.childAt(5)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_POPULAR },
    });
  });

  it('renders a LandingPage with themes HTML', () => {
    const root = renderAndMount({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    expect(root).toIncludeText('Featured themes');
    expect(root).toIncludeText('More featured themes');
  });

  it('renders each add-on when set', () => {
    const { store } = dispatchClientMetadata();
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
    const root = renderAndMount({
      ...mapStateToProps(store.getState()),
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    expect(
      root.find('.SearchResult-name')
        .map((heading) => heading.text()))
        .toEqual([
          'Howdy', 'Howdy again', 'High', 'High again', 'Pop', 'Pop again',
        ]);
  });

  it('renders not found if add-on type is not supported', () => {
    const root = render({ params: { visibleAddonType: 'XUL' } });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('does not catch all apiAddonType() errors', () => {
    expect(() => {
      render({
        apiAddonType: () => { throw new Error('Ice cream'); },
        params: { visibleAddonType: ADDON_TYPE_EXTENSION },
      });
    }).toThrowError('Ice cream');
  });

  it('does not catch all contentForType() errors', () => {
    expect(() => {
      render({
        contentForType: () => { throw new Error('Cake!'); },
        params: { visibleAddonType: ADDON_TYPE_EXTENSION },
      });
    }).toThrowError('Cake!');
  });
});
