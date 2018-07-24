import * as React from 'react';
import { shallow } from 'enzyme';

import AnimatedIcon from 'ui/components/AnimatedIcon';
import Icon from 'ui/components/Icon';

describe(__filename, () => {
  it('renders an Icon and sets CSS classes', () => {
    const name = 'foo';
    const root = shallow(<AnimatedIcon name={name} />);

    expect(root.find(Icon)).toHaveLength(1);
    expect(root).toHaveClassName('AnimatedIcon');
    expect(root).toHaveClassName(`AnimatedIcon-${name}`);
  });

  it('allows a custom className', () => {
    const name = 'foo';
    const root = shallow(<AnimatedIcon name={name} className="sup" />);

    expect(root).toHaveClassName('AnimatedIcon');
    expect(root).toHaveClassName(`AnimatedIcon-${name}`);
    expect(root).toHaveClassName('sup');
  });

  it('passes alt-text to the Icon', () => {
    const root = shallow(<AnimatedIcon name="bar" alt="Alt text!" />);

    expect(root.find(Icon)).toHaveProp('alt', 'Alt text!');
  });

  it('passes name to the Icon', () => {
    const root = shallow(<AnimatedIcon name="bar" alt="Alt text!" />);

    expect(root.find(Icon)).toHaveProp('name', 'bar');
  });
});
