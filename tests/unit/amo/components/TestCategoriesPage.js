import { shallow } from 'enzyme';
import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import { CategoriesBase, mapStateToProps } from 'amo/components/Categories';
import { setClientApp } from 'core/actions';
import { categoriesLoad } from 'core/actions/categories';
import {
  ADDON_TYPE_COMPLETE_THEME,
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
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
    const { store } = dispatchClientMetadata();
    store.dispatch(categoriesLoad(categoriesResponse));

    const baseProps = {
      ...mapStateToProps(store.getState()),
      dispatch: sinon.stub(),
    };

    return shallow(
      <CategoriesBase i18n={getFakeI18nInst()} {...baseProps} {...props} />
    );
  }

  it('dispatches setViewContext with addonType', () => {
    const fakeDispatch = sinon.stub();
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      dispatch: fakeDispatch,
    });

    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));

    // Make sure that we update the addonType when it's changed.
    root.setProps({ addonType: ADDON_TYPE_THEME });
    sinon.assert.calledTwice(fakeDispatch);
    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_THEME));

    // But don't dispatch when the same addonType is used.
    root.setProps({ addonType: ADDON_TYPE_THEME });
    sinon.assert.calledTwice(fakeDispatch);
  });

  it('renders Categories', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      error: false,
      loading: false,
    });

    expect(root.find('.Categories-list').childAt(0).find('.Categories-link'))
      .toHaveProp('children', 'Games');
    expect(root.find('.Categories-list').childAt(1).find('.Categories-link'))
      .toHaveProp('children', 'Travel');
  });

  it('renders loading when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: [],
      error: false,
      loading: true,
    });

    expect(root.find('.Categories-loading-info'))
      .toIncludeText('Loading');
  });

  it('renders a message when there are no categories', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: [],
      error: false,
      loading: false,
    });

    expect(root.find('.Categories-none-loaded-message'))
      .toIncludeText('No categories found.');
  });

  it('renders an error', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: [],
      error: true,
      loading: false,
    });

    expect(root.find('.Categories-none-loaded-message'))
      .toIncludeText('Failed to load categories.');
  });
});

describe('mapStateToProps', () => {
  it('maps state to props', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(setClientApp('android'));
    store.dispatch(categoriesLoad(categoriesResponse));

    const props = mapStateToProps(store.getState(), {
      params: { visibleAddonType: 'extensions' },
    });

    expect(props).toEqual({
      categories: {
        [ADDON_TYPE_COMPLETE_THEME]: {},
        [ADDON_TYPE_DICT]: {},
        [ADDON_TYPE_EXTENSION]: {
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
        [ADDON_TYPE_LANG]: {},
        [ADDON_TYPE_OPENSEARCH]: {},
        [ADDON_TYPE_THEME]: {},
      },
      error: false,
      loading: false,
    });
  });
});
