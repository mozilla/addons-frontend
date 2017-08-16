import { shallow } from 'enzyme';
import React from 'react';

import Categories from 'amo/components/Categories';
import { CategoriesPageBase } from 'amo/components/CategoriesPage';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import { visibleAddonType } from 'core/utils';


describe('amo/components/CategoriesPage', () => {
  it('renders Categories', () => {
    const params = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const root = shallow(
      <CategoriesPageBase params={params} />
    );

    expect(root.find(Categories))
      .toHaveProp('addonType', ADDON_TYPE_EXTENSION);
  });
});
