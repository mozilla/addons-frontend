import { shallow } from 'enzyme';
import React from 'react';

import {
  CategoriesBase,
  mapStateToProps,
} from 'amo/components/Categories';
import { categoriesLoad } from 'core/actions/categories';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import Button from 'ui/components/Button';
import LoadingText from 'ui/components/LoadingText';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('<Categories />', () => {
  function render({ ...props }) {
    const fakeDispatch = sinon.stub();

    return shallow(
      <CategoriesBase
        dispatch={fakeDispatch}
        i18n={getFakeI18nInst()}
        {...props}
      />
    );
  }

  it('renders Categories', () => {
    const root = render({ addonType: ADDON_TYPE_EXTENSION, categories: {} });

    expect(root).toHaveClassName('Categories');
  });

  it('renders loading text when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      loading: true,
    });

    expect(root.find('.Categories-loading-info'))
      .toIncludeText('Loading categories.');
  });

  it('renders LoadingText components when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      loading: true,
    });

    expect(root.find('.Categories-loading-text').find(LoadingText))
      .toHaveLength(8);
  });

  it('renders an error message if there was an error', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      error: true,
    });

    expect(root.find('.Categories p'))
      .toIncludeText('Failed to load categories');
  });

  it('renders categories if they exist', () => {
    const categoriesResponse = {
      result: [
        {
          application: 'android',
          name: 'Travel',
          slug: 'travel',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Games',
          slug: 'Games',
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

    expect(root.find('.Categories-list').childAt(0).find(Button))
      .toHaveProp('children', 'Games');
    expect(root.find('.Categories-list').childAt(1).find(Button))
      .toHaveProp('children', 'Travel');
  });
});
