import { shallow } from 'enzyme';
import React from 'react';

import { CategoryHeaderBase } from 'amo/components/CategoryHeader';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_THEME,
} from 'core/constants';
import LoadingText from 'ui/components/LoadingText';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('CategoryHeader', () => {
  let category;

  beforeEach(() => {
    category = {
      id: 5,
      description: 'I am a cool category for doing things',
      name: 'Testing category',
      slug: 'test',
      type: ADDON_TYPE_THEME,
    };
  });

  function render(props) {
    return shallow(
      <CategoryHeaderBase
        category={category}
        i18n={getFakeI18nInst()}
        {...props}
      />
    );
  }

  it('renders a header using the category', () => {
    const root = render();

    expect(root.find('.CategoryHeader-name')).toIncludeText('Testing category');
  });

  it('renders the category id', () => {
    const root = render();

    expect(root).toHaveClassName('CategoryHeader--category-color-5');
  });

  it('renders the category addonType', () => {
    const root = render();

    expect(root).toHaveClassName(`CategoryHeader--type-${ADDON_TYPE_THEME}`);
  });

  it('uses the description if one exists', () => {
    const root = render();

    expect(root.find('.CategoryHeader-description'))
      .toIncludeText('I am a cool category for doing things');
  });

  it('uses the generic description if category lacks description', () => {
    category.type = ADDON_TYPE_LANG;
    delete category.description;
    const root = render({ category });

    expect(root.find('.CategoryHeader-description'))
      .toIncludeText('Browse all add-ons in this category');
  });

  it('uses the extension description if category lacks description', () => {
    category.type = ADDON_TYPE_EXTENSION;
    delete category.description;
    const root = render({ category });

    expect(root.find('.CategoryHeader-description'))
      .toIncludeText('Browse all extensions in this category');
  });

  it('uses the themes description if category lacks description', () => {
    category.type = ADDON_TYPE_THEME;
    delete category.description;
    const root = render({ category });

    expect(root.find('.CategoryHeader-description'))
      .toIncludeText('Browse all themes in this category');
  });

  it('omits addonType if there is no category', () => {
    const root = render({ category: null });

    // We use an exact className because we're making sure
    // `CategoryHeader--type-${type}` is omitted.
    expect(root.prop('className'))
      .toEqual('CategoryHeader CategoryHeader--loading');
  });

  it('omits color if there is no category', () => {
    const root = render({ category: null });

    // We use an exact className because we're making sure
    // `CategoryHeader--category-color-${color}` is omitted.
    expect(root.prop('className'))
      .toEqual('CategoryHeader CategoryHeader--loading');
  });

  it('renders LoadingText if category is null (e.g. is loading)', () => {
    const root = render({ category: null });

    expect(root.find('.CategoryHeader-name').find(LoadingText))
      .toHaveLength(1);
    expect(root.find('.CategoryHeader-description').find(LoadingText))
      .toHaveLength(2);
  });
});
