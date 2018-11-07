import * as React from 'react';

import CategoryHead, { CategoryHeadBase } from 'amo/components/CategoryHead';
import HeadLinks from 'amo/components/HeadLinks';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import { fakeCategory, fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...props } = {}) => {
    return shallowUntilTarget(
      <CategoryHead i18n={fakeI18n()} {...props} />,
      CategoryHeadBase,
    );
  };

  it('renders nothing when there is no category', () => {
    const root = render();

    expect(root.html()).toBeNull();
  });

  it('renders an HTML title for a theme category', () => {
    const category = { ...fakeCategory, type: ADDON_TYPE_THEME };
    const root = render({ category });

    expect(root.find('title')).toHaveText(`${category.name} – Themes`);
  });

  it('renders an HTML title for an extension category', () => {
    const category = { ...fakeCategory, type: ADDON_TYPE_EXTENSION };
    const root = render({ category });

    expect(root.find('title')).toHaveText(`${category.name} – Extensions`);
  });

  it('renders a generic HTML title for an unknown type', () => {
    const category = { ...fakeCategory, type: 'unknown' };
    const root = render({ category });

    expect(root.find('title')).toHaveText(category.name);
  });

  it('renders a "description" meta tag when category description is available', () => {
    const description = 'some description for a category';
    const category = { ...fakeCategory, description };
    const root = render({ category });

    expect(root.find('meta[name="description"]')).toHaveLength(1);
    expect(root.find('meta[name="description"]')).toHaveProp(
      'content',
      description,
    );
  });

  it('does not render a "description" meta tag when category description is null', () => {
    const category = { ...fakeCategory, description: null };
    const root = render({ category });

    expect(root.find('meta[name="description"]')).toHaveLength(0);
  });

  it('does not render a "description" meta tag when category description is empty', () => {
    const category = { ...fakeCategory, description: '' };
    const root = render({ category });

    expect(root.find('meta[name="description"]')).toHaveLength(0);
  });

  it('renders a HeadLinks component', () => {
    const category = { ...fakeCategory };
    const root = render({ category });

    expect(root.find(HeadLinks)).toHaveLength(1);
  });
});
