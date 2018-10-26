import { shallow } from 'enzyme';
import * as React from 'react';

import { CategoryHeaderBase } from 'amo/components/CategoryHeader';
import CategoryIcon from 'amo/components/CategoryIcon';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import { getCategoryColor } from 'core/utils';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
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
    return shallow(<CategoryHeaderBase category={category} {...props} />);
  }

  it('renders a header using the category', () => {
    const root = render();

    expect(root.find('.CategoryHeader-name')).toIncludeText('Testing category');
  });

  it('omits color if there is no category', () => {
    const root = render({ category: null });

    // We use an exact className because we're making sure
    // `CategoryHeader--category-color-${color}` is omitted.
    expect(root.prop('className')).toEqual(
      'CategoryHeader CategoryHeader--loading',
    );
  });

  it('renders LoadingText if category is null (e.g. is loading)', () => {
    const root = render({ category: null });

    expect(root.find('.CategoryHeader-name').find(LoadingText)).toHaveLength(1);
  });

  it('does not render a CategoryIcon when category is null', () => {
    const root = render({ category: null });
    expect(root.find(CategoryIcon)).toHaveLength(0);
  });

  it('renders a CategoryIcon', () => {
    const root = render();
    expect(root.find(CategoryIcon)).toHaveLength(1);
  });

  it('passes the category color to CategoryIcon', () => {
    const root = render();
    expect(root.find(CategoryIcon)).toHaveProp(
      'color',
      getCategoryColor(category),
    );
  });

  it('passes the category slug as name to the CategoryIcon', () => {
    const root = render();
    expect(root.find(CategoryIcon)).toHaveProp('name', category.slug);
  });

  it('passes a special name to CategoryIcon when theme slug is "other"', () => {
    const otherThemeCategory = {
      ...category,
      slug: 'other',
      type: ADDON_TYPE_THEME,
    };
    const root = render({ category: otherThemeCategory });

    expect(root.find(CategoryIcon)).toHaveProp(
      'name',
      `other-${otherThemeCategory.type}`,
    );
  });

  it('passes a special name to CategoryIcon when extension slug is "other"', () => {
    const otherExtensionCategory = {
      ...category,
      slug: 'other',
      type: ADDON_TYPE_EXTENSION,
    };
    const root = render({ category: otherExtensionCategory });

    expect(root.find(CategoryIcon)).toHaveProp(
      'name',
      `other-${otherExtensionCategory.type}`,
    );
  });
});
