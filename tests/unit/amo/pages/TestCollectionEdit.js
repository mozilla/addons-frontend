import { shallow } from 'enzyme';
import * as React from 'react';

import Collection from 'amo/pages/Collection';
import CollectionEdit from 'amo/pages/CollectionEdit';

describe(__filename, () => {
  it('configures a Collection', () => {
    const root = shallow(<CollectionEdit />);

    expect(root.find(Collection)).toHaveProp('editing', true);
  });

  it('passes all props to Collection', () => {
    const anyProp = 'example-property';
    const root = shallow(<CollectionEdit anyProp={anyProp} />);

    expect(root.find(Collection)).toHaveProp('anyProp', anyProp);
  });
});
