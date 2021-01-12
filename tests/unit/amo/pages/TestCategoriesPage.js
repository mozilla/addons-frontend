import * as React from 'react';
import { shallow } from 'enzyme';

import Categories from 'amo/components/Categories';
import { CategoriesPageBase } from 'amo/pages/CategoriesPage';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import { visibleAddonType } from 'amo/utils';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ params, ...props } = {}) => {
    const allProps = {
      i18n: fakeI18n(),
      match: {
        params: {
          visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
          ...params,
        },
      },
      ...props,
    };

    return shallow(<CategoriesPageBase {...allProps} />);
  };

  it.each([ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME])(
    'renders the %s categories',
    (addonType) => {
      const params = { visibleAddonType: visibleAddonType(addonType) };

      const root = render({ params });

      expect(root.find(Categories)).toHaveLength(1);
      expect(root.find(Categories)).toHaveProp('addonType', addonType);
    },
  );

  it.each([
    [ADDON_TYPE_EXTENSION, /All extension/],
    [ADDON_TYPE_STATIC_THEME, /All theme/],
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

  it.each([
    [ADDON_TYPE_EXTENSION, /All extension/],
    [ADDON_TYPE_STATIC_THEME, /All theme/],
  ])('renders a HeadMetaTags component for %s', (addonType, expectedMatch) => {
    const params = { visibleAddonType: visibleAddonType(addonType) };

    const root = render({ params });

    expect(root.find(HeadMetaTags)).toHaveLength(1);
    expect(root.find(HeadMetaTags).prop('title')).toMatch(expectedMatch);
  });
});
