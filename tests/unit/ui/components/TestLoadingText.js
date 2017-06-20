import { shallow } from 'enzyme';
import React from 'react';

import LoadingText from 'ui/components/LoadingText';


describe('<LoadingText />', () => {
  const render = (props = {}) => shallow(<LoadingText {...props} />);

  it('renders LoadingText element with className', () => {
    const root = render();
    expect(root).toHaveClassName('LoadingText');
  });

  it('lets you set a fixed width', () => {
    const root = render({ width: 55 });
    expect(root.prop('style')).toMatchObject({ width: '55%' });
  });

  it('lets you set a custom class name', () => {
    const root = render({ className: 'MyLoadingClass' });
    expect(root).toHaveClassName('MyLoadingClass');
  });
});
