import React from 'react';
import { shallow } from 'enzyme';

import Suggestion from 'amo/components/SearchForm/Suggestion';
import { fakeAddon } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  const shallowComponent = (props) => {
    const allProps = {
      name: fakeAddon.name,
      iconUrl: fakeAddon.icon_url,
      ...props,
    };

    return shallow(<Suggestion {...allProps} />);
  };

  it('renders itself', () => {
    const props = {};
    const root = shallowComponent(props);

    expect(root.find('.Suggestion')).toHaveLength(1);
  });
});
