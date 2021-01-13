import { shallow } from 'enzyme';
import * as React from 'react';

import Select from 'amo/components/Select';

describe(__filename, () => {
  it('renders a custom class name', () => {
    const root = shallow(<Select className="my-select" />);

    expect(root).toHaveClassName('my-select');
    expect(root).toHaveClassName('Select');
  });

  it('renders children', () => {
    const root = shallow(
      <Select>
        <option>Some option</option>
      </Select>,
    );

    expect(root.find('option')).toHaveLength(1);
  });

  it('passes custom props to select', () => {
    const root = shallow(<Select disabled />);

    expect(root.prop('disabled')).toEqual(true);
  });
});
