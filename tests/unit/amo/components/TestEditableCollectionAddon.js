import { shallow } from 'enzyme';
import * as React from 'react';

import EditableCollectionAddon
  from 'amo/components/EditableCollectionAddon';
import { getAddonIconUrl } from 'core/imageUtils';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const render = ({
    addon = createInternalAddon(fakeAddon), ...customProps
  } = {}) => {
    const props = { addon, ...customProps };
    return shallow(<EditableCollectionAddon {...props} />);
  };

  it('renders a custom class name', () => {
    const root = render({ className: 'MyClass' });

    expect(root).toHaveClassName('MyClass');
  });

  it('renders an add-on icon', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });

    expect(root.find('img')).toHaveProp('src', getAddonIconUrl(addon));
  });

  it('renders an add-on name', () => {
    const name = 'uBlock';
    const addon = createInternalAddon({ ...fakeAddon, name });
    const root = render({ addon });

    expect(root.find('.EditableCollectionAddon-name')).toHaveText(name);
  });
});
