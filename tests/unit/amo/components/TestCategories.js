import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import { setViewContext } from 'amo/actions/viewContext';
import createStore from 'amo/store';
import { CategoriesBase, mapStateToProps } from 'amo/components/Categories';
import { setClientApp, setLang } from 'core/actions';
import { categoriesLoad } from 'core/actions/categories';
import { ADDON_TYPE_EXTENSION, CLIENT_APP_ANDROID } from 'core/constants';
import { getFakeI18nInst } from 'tests/unit/helpers';


const categoriesResponse = {
  result: [
    {
      application: 'android',
      name: 'Games',
      slug: 'Games',
      type: ADDON_TYPE_EXTENSION,
    },
    {
      application: 'android',
      name: 'Travel',
      slug: 'travel',
      type: ADDON_TYPE_EXTENSION,
    },
  ],
};

describe('Categories', () => {
  function render({ ...props }) {
    const { store } = createStore();
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('fr'));
    store.dispatch(categoriesLoad(categoriesResponse));

    const { categories } = store.getState().categories;
    const baseProps = {
      clientApp: store.getState().api.clientApp,
      categories: categories[CLIENT_APP_ANDROID][ADDON_TYPE_EXTENSION],
      dispatch: sinon.stub(),
    };

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <CategoriesBase i18n={getFakeI18nInst()} {...baseProps} {...props} />
      </Provider>
    ), CategoriesBase);
  }

  function renderDomNode(props) {
    return findDOMNode(render(props));
  }

  it('dispatches setViewContext with addonType', () => {
    const fakeDispatch = sinon.stub();
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      dispatch: fakeDispatch,
    });

    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));

    // Make sure that we update the addonType when `componentDidUpdate()`
    // is called. This will happen when changing from one route that uses
    // this component to another–the props will be updated so
    // `componentDidUpdate()` is called without the component being
    // mounted again.
    // TODO: This feels naughty; can it be done better?
    root.componentDidUpdate();
    sinon.assert.calledTwice(fakeDispatch);
    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
  });

  it('renders Categories', () => {
    const root = renderDomNode({
      addonType: ADDON_TYPE_EXTENSION,
      error: false,
      loading: false,
    });

    expect(
      root.querySelector('.Categories-list').textContent
    ).toEqual('GamesTravel');
  });

  it('renders loading when loading', () => {
    const root = renderDomNode({
      addonType: ADDON_TYPE_EXTENSION,
      categories: [],
      error: false,
      loading: true,
    });

    expect(root.textContent).toContain('Loading');
  });

  it('renders a message when there are no categories', () => {
    const root = renderDomNode({
      addonType: ADDON_TYPE_EXTENSION,
      categories: [],
      error: false,
      loading: false,
    });

    expect(root.textContent).toEqual('No categories found.');
  });

  it('renders an error', () => {
    const root = renderDomNode({
      addonType: ADDON_TYPE_EXTENSION,
      categories: [],
      error: true,
      loading: false,
    });

    expect(root.textContent).toEqual('Failed to load categories.');
  });
});

describe('mapStateToProps', () => {
  it('maps state to props', () => {
    const { store } = createStore();
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('fr'));
    store.dispatch(categoriesLoad(categoriesResponse));

    const props = mapStateToProps(store.getState(), {
      params: { visibleAddonType: 'extensions' },
    });

    expect(props).toEqual({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {
        Games: {
          application: 'android',
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
        travel: {
          application: 'android',
          name: 'Travel',
          slug: 'travel',
          type: ADDON_TYPE_EXTENSION,
        },
      },
      clientApp: 'android',
      error: false,
      loading: false,
    });
  });
});
