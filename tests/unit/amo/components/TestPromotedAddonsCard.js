import { shallow } from 'enzyme';
import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import PromotedAddonsCard, {
  PromotedAddonsCardBase,
} from 'amo/components/PromotedAddonsCard';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon, fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (customProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      loading: false,
      ...customProps,
    };

    return shallowUntilTarget(
      <PromotedAddonsCard {...props} />,
      PromotedAddonsCardBase,
    );
  };

  it('passes loading parameter to AddonsCard', () => {
    const root = render({ loading: true });
    expect(root.find(AddonsCard)).toHaveProp('loading', true);

    root.setProps({ loading: false });
    expect(root.find(AddonsCard)).toHaveProp('loading', false);
  });

  it('passes addons to AddonsCard', () => {
    const addons = [
      createInternalAddon({
        ...fakeAddon,
        slug: 'custom-addon',
      }),
    ];
    const root = render({ addons });
    expect(root.find(AddonsCard)).toHaveProp('addons', addons);
  });

  it('can pass a custom classname to AddonsCard', () => {
    const className = 'some-class-name';
    const root = render({ className });

    expect(root.find(AddonsCard)).toHaveClassName(className);
  });

  it('passes addonInstallSource to AddonsCard', () => {
    const addonInstallSource = 'featured-on-home-page';
    const addons = [createInternalAddon(fakeAddon)];
    const root = render({ addons, addonInstallSource });

    expect(root.find(AddonsCard)).toHaveProp(
      'addonInstallSource',
      addonInstallSource,
    );
  });

  it('uses the proper `rel` property for the header link in AddonsCard', () => {
    const root = render();
    const headerProp = root.find(AddonsCard).prop('header');
    const header = shallow(<div>{headerProp}</div>);

    expect(header.find('.PromotedAddonsCard-headerLink')).toHaveProp(
      'rel',
      'noopener noreferrer',
    );
  });
});
