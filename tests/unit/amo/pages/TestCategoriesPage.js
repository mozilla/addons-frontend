import * as React from 'react';

import Categories from 'amo/components/Categories';
import NotFound from 'amo/components/ErrorPage/NotFound';
import HeadLinks from 'amo/components/HeadLinks';
import CategoriesPage, { CategoriesPageBase } from 'amo/pages/CategoriesPage';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import { visibleAddonType } from 'core/utils';
import {
  dispatchClientMetadata,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ params, ...props } = {}) => {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      match: {
        params: {
          visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
          ...params,
        },
      },
      ...props,
    };

    return shallowUntilTarget(
      <CategoriesPage {...allProps} />,
      CategoriesPageBase,
    );
  };

  it.each([
    [ADDON_TYPE_EXTENSION, /All extension/],
    [ADDON_TYPE_THEME, /All theme/],
  ])('renders an HTML title for %s', (addonType, expectedMatch) => {
    const params = { visibleAddonType: visibleAddonType(addonType) };

    const root = render({ params });

    expect(root.find('title')).toHaveLength(1);
    expect(root.find('title').text()).toMatch(expectedMatch);
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });

  it('renders a Categories component', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const params = { visibleAddonType: visibleAddonType(addonType) };

    const root = render({ params });

    expect(root.find(Categories)).toHaveProp('addonType', addonType);
  });

  it('returns a 404 when clientApp is Android and enableFeatureStaticThemesForAndroid is false', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const _config = getFakeConfig({
      enableFeatureStaticThemesForAndroid: false,
    });

    const root = render({ _config, store });

    expect(root.find(Categories)).toHaveLength(0);
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('does not return a 404 when clientApp is Android and enableFeatureStaticThemesForAndroid is true', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const _config = getFakeConfig({
      enableFeatureStaticThemesForAndroid: true,
    });

    const root = render({ _config, store });

    expect(root.find(NotFound)).toHaveLength(0);
    expect(root.find(Categories)).toHaveLength(1);
  });

  it('does not return a 404 when clientApp is not Android', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });
    const _config = getFakeConfig({
      enableFeatureStaticThemesForAndroid: false,
    });

    const root = render({ _config, store });

    expect(root.find(NotFound)).toHaveLength(0);
    expect(root.find(Categories)).toHaveLength(1);
  });
});
