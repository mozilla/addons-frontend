import * as React from 'react';
import { shallow } from 'enzyme';

import CategoryIcon from 'amo/components/CategoryIcon';
import Icon from 'amo/components/Icon';

describe(__filename, () => {
  it('renders an Icon and sets CSS classes', () => {
    const root = shallow(<CategoryIcon name="foo" color="1" />);
    const icon = root.find(Icon);

    expect(icon).toHaveLength(1);
    expect(icon).toHaveClassName('CategoryIcon');
    expect(icon).toHaveClassName('CategoryIcon-1');
  });

  it('allows a custom className', () => {
    const root = shallow(<CategoryIcon name="bar" color="1" className="sup" />);
    const icon = root.find(Icon);

    expect(icon).toHaveClassName('CategoryIcon');
    expect(icon).toHaveClassName('CategoryIcon-1');
    expect(icon).toHaveClassName('sup');
  });

  it('passes alt-text to the Icon', () => {
    const root = shallow(<CategoryIcon name="bar" color="1" alt="Alt text!" />);

    expect(root.find(Icon)).toHaveProp('alt', 'Alt text!');
  });

  it('passes name to the Icon', () => {
    const root = shallow(<CategoryIcon name="bar" color="1" alt="Alt text!" />);

    expect(root.find(Icon)).toHaveProp('name', 'bar');
  });
});
