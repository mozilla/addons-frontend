import { shallow } from 'enzyme';
import * as React from 'react';

import ListItem from 'ui/components/ListItem';

describe(__filename, () => {
  const render = ({ children = <span />, ...customProps } = {}) => {
    const props = {
      key: 'some-key',
      ...customProps,
    };
    return shallow(<ListItem {...props}>{children}</ListItem>);
  };

  it('renders children', () => {
    const children = <div className="MyItem" />;
    const root = render({ children });

    expect(root.childAt(0)).toHaveClassName('MyItem');
  });

  it('lets you add a custom class name', () => {
    const root = render({ className: 'MyClass' });

    expect(root).toHaveClassName('ListItem');
    expect(root).toHaveClassName('MyClass');
  });
});
