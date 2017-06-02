import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

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
      type: 'extension',
    },
    {
      application: 'android',
      name: 'Travel',
      slug: 'travel',
      type: 'extension',
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

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <CategoriesBase i18n={getFakeI18nInst()} {...baseProps} {...props} />
      </Provider>
    ), CategoriesBase));
  }

  it('renders Categories', () => {
    const root = render({
      addonType: 'extension',
      error: false,
      loading: false,
    });

    expect(root.querySelector('.Categories-list').textContent).toEqual('GamesTravel');
  });

  it('renders loading when loading', () => {
    const root = render({
      addonType: 'extension',
      categories: [],
      error: false,
      loading: true,
    });

    expect(root.textContent).toContain('Loading');
  });

  it('renders a message when there are no categories', () => {
    const root = render({
      addonType: 'extension',
      categories: [],
      error: false,
      loading: false,
    });

    expect(root.textContent).toEqual('No categories found.');
  });

  it('renders an error', () => {
    const root = render({
      addonType: 'extension',
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
          type: 'extension',
        },
        travel: {
          application: 'android',
          name: 'Travel',
          slug: 'travel',
          type: 'extension',
        },
      },
      clientApp: 'android',
      error: false,
      loading: false,
    });
  });
});
