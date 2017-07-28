import React from 'react';
import { shallow } from 'enzyme';

import AddonsCard from 'amo/components/AddonsCard';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { fakeAddon } from 'tests/unit/amo/helpers';


describe('amo/components/LandingAddonsCard', () => {
  function render(customProps = {}) {
    const props = {
      addons: [fakeAddon],
      footerLink: {
        pathname: '/some-path/',
        query: { param: 'something' },
      },
      footerText: 'some text',
      header: 'Some Header',
      ...customProps,
    };
    return shallow(<LandingAddonsCard {...props} />);
  }

  it('passes loading parameter to AddonsCard', () => {
    const root = render({ loading: true });
    expect(root.find(AddonsCard)).toHaveProp('loading', true);
    root.setProps({ loading: false });
    expect(root.find(AddonsCard)).toHaveProp('loading', false);
  });

  it('passes addons to AddonsCard', () => {
    const addons = [{ ...fakeAddon, slug: 'custom-addon' }];
    const root = render({ addons });
    expect(root.find(AddonsCard)).toHaveProp('addons', addons);
  });
});
