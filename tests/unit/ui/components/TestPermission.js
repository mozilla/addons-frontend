import * as React from 'react';
import { shallow } from 'enzyme';

import Icon from 'ui/components/Icon';
import Permission from 'ui/components/Permission';


describe(__filename, () => {
  const defaultProps = {
    className: 'my-class',
    description: 'A decription',
  };

  function render(props = defaultProps) {
    return shallow(<Permission {...props} />);
  }

  it('renders standard and custom class names', () => {
    const root = render();

    expect(root.find('li')).toHaveClassName(`Permission ${defaultProps.className}`);
  });

  it('renders an icon with custom name', () => {
    const root = render();

    expect(root.find(Icon)).toHaveProp('name', `permission-${defaultProps.className}`);
  });

  it('replaces dots in icon name with dashes', () => {
    const root = render({
      ...defaultProps,
      className: 'my.class',
    });

    expect(root.find(Icon)).toHaveProp('name', `permission-${defaultProps.className}`);
  });

  it('renders the description', () => {
    const root = render();

    expect(root.find('.Permission-description')).toHaveText(defaultProps.description);
  });
});
