import { shallow } from 'enzyme';
import React from 'react';

import {
  CategoriesHeaderBase,
  mapStateToProps,
} from 'amo/components/CategoriesHeader';
import { categoriesLoad } from 'core/actions/categories';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import Button from 'ui/components/Button';
import LoadingText from 'ui/components/LoadingText';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('<CategoriesHeader />', () => {
  function render({ ...props }) {
    const fakeDispatch = sinon.stub();

    return shallow(
      <CategoriesHeaderBase
        dispatch={fakeDispatch}
        i18n={getFakeI18nInst()}
        {...props}
      />
    );
  }

  it('it renders a CategoriesHeader', () => {
    const root = render({ addonType: ADDON_TYPE_EXTENSION, categories: {} });

    expect(root).toHaveClassName('CategoriesHeader');
  });

  it('it renders loading text when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      loading: true,
    });

    expect(root.find('.CategoriesHeader-loading-info'))
      .toIncludeText('Loading categories.');
  });

  it('it renders LoadingText components when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      loading: true,
    });

    expect(root.find('.CategoriesHeader-loading-text').find(LoadingText))
      .toHaveLength(8);
  });

  it('it renders an error message if there was an error', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      error: true,
    });

    expect(root.find('.CategoriesHeader p'))
      .toIncludeText('Failed to load categories');
  });

  it('it renders categories if they exist', () => {
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

    const { store } = dispatchClientMetadata();
    store.dispatch(categoriesLoad(categoriesResponse));
    const { categories } = mapStateToProps(store.getState());

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories,
    });

    expect(root.find('.CategoriesHeader-list').childAt(0).find(Button))
      .toHaveProp('children', 'Games');
    expect(root.find('.CategoriesHeader-list').childAt(1).find(Button))
      .toHaveProp('children', 'Travel');
  });
});
