import * as React from 'react';

import CategoryHead, { CategoryHeadBase } from 'amo/components/CategoryHead';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import {
  dispatchClientMetadata,
  fakeCategory,
  fakeI18n,
  getFakeConfig,
  onLocationChanged,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <CategoryHead i18n={fakeI18n()} store={store} {...props} />,
      CategoryHeadBase,
    );
  };

  const renderWithCategory = ({
    category = fakeCategory,
    type = ADDON_TYPE_EXTENSION,
    ...others
  } = {}) => {
    return render({ category, type, ...others });
  };

  it('renders nothing when there is no category', () => {
    const root = render();

    expect(root.html()).toBeNull();
  });

  it('renders a canonical link tag', () => {
    const baseURL = 'https://example.org';
    const _config = getFakeConfig({ baseURL });
    const { store } = dispatchClientMetadata();

    const pathname = '/some-category-pathname/';
    store.dispatch(onLocationChanged({ pathname }));

    const root = renderWithCategory({ _config, store });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp(
      'href',
      `${baseURL}${pathname}`,
    );
  });

  it('renders an HTML title for a theme category', () => {
    const category = { ...fakeCategory };
    const root = renderWithCategory({ category, type: ADDON_TYPE_THEME });

    expect(root.find('title')).toHaveText(`${category.name} – Themes`);
  });

  it('renders an HTML title for an extension category', () => {
    const category = { ...fakeCategory };
    const root = renderWithCategory({ category, type: ADDON_TYPE_EXTENSION });

    expect(root.find('title')).toHaveText(`${category.name} – Extensions`);
  });

  it('renders a generic HTML title for an unknown type', () => {
    const category = { ...fakeCategory };
    const root = renderWithCategory({ category, type: 'unknown' });

    expect(root.find('title')).toHaveText(category.name);
  });
});
