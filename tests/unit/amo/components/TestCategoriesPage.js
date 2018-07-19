import { shallow } from 'enzyme';
import * as React from 'react';

import Categories from 'amo/components/Categories';
import { CategoriesPageBase } from 'amo/components/CategoriesPage';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import { visibleAddonType } from 'core/utils';

describe(__filename, () => {
  it('renders Categories', () => {
    const params = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const root = shallow(<CategoriesPageBase match={{ params }} />);

    expect(root.find(Categories)).toHaveProp('addonType', ADDON_TYPE_EXTENSION);
  });
});
