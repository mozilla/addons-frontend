import { shallow } from 'enzyme';
import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

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
  function render({ ...props }) {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.stub();

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <LandingPageBase dispatch={fakeDispatch} i18n={getFakeI18nInst()}
            {...props} />
        </I18nProvider>
      </Provider>
    ), LandingPageBase);
  }

  function renderNode(props) {
    return findDOMNode(render(props));
  }

  it('dispatches setViewContext on load and update', () => {
    const fakeDispatch = sinon.stub();
    const root = render({
      dispatch: fakeDispatch,
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION) },
    });

    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.calledOnce(fakeDispatch);

    root.componentDidUpdate();
    sinon.assert.calledTwice(fakeDispatch);

    sinon.assert.alwaysCalledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
  });

  it('renders a LandingPage with no addons set', () => {
    const rootNode = renderNode({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION) },
    });

    expect(rootNode.textContent).toContain('Featured extensions');
    expect(rootNode.textContent).toContain('More featured extensions');
  });

  it('sets the links in each footer for extensions', () => {
    const fakeDispatch = sinon.stub();
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const root = shallow(
      <LandingPageBase
        dispatch={fakeDispatch}
        i18n={getFakeI18nInst()}
        params={fakeParams}
      />
    );

    expect(root.childAt(1).prop('footerLink')).toEqual({
      pathname: `/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`,
    });
    expect(root.childAt(2).prop('footerLink')).toEqual({
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_TOP_RATED },
    });
    expect(root.childAt(3).prop('footerLink')).toEqual({
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_POPULAR },
    });
  });

  it('sets the links in each footer for themes', () => {
    const fakeDispatch = sinon.stub();
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
    };
    const root = shallow(
      <LandingPageBase
        dispatch={fakeDispatch}
        i18n={getFakeI18nInst()}
        params={fakeParams}
      />
    );

    expect(root.childAt(1).prop('footerLink')).toEqual({
      pathname: `/${visibleAddonType(ADDON_TYPE_THEME)}/featured/`,
    });
    expect(root.childAt(2).prop('footerLink')).toEqual({
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TOP_RATED },
    });
    expect(root.childAt(3).prop('footerLink')).toEqual({
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_POPULAR },
    });
  });

  it('renders a LandingPage with themes HTML', () => {
    const rootNode = renderNode({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    expect(rootNode.textContent).toContain('Featured themes');
    expect(rootNode.textContent).toContain('More featured themes');
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
    const rootNode = renderNode({
      ...mapStateToProps(store.getState()),
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    expect(Object.values(rootNode.querySelectorAll('.SearchResult-name'))
      .map((heading) => heading.textContent)).toEqual(['Howdy', 'Howdy again', 'High', 'High again', 'Pop', 'Pop again']);
  });

  it('renders not found if add-on type is not supported', () => {
    const rootNode = renderNode({ params: { visibleAddonType: 'XUL' } });
    expect(rootNode.textContent).toContain('Page not found');
  });

  it('throws for any error other than an unknown addonType', () => {
    expect(() => {
      render({
        apiAddonType: () => { throw new Error('Ice cream'); },
        params: { visibleAddonType: ADDON_TYPE_EXTENSION },
      });
    }).toThrowError('Ice cream');

    expect(() => {
      render({
        contentForType: () => { throw new Error('Cake!'); },
        params: { visibleAddonType: ADDON_TYPE_EXTENSION },
      });
    }).toThrowError('Cake!');
  });
});
