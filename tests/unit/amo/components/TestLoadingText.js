import { shallow } from 'enzyme';
import * as React from 'react';

import LoadingText from 'amo/components/LoadingText';

describe(__filename, () => {
  const render = (props = {}) => shallow(<LoadingText {...props} />);

  it('renders LoadingText element with className', () => {
    const root = render();
    expect(root).toHaveClassName('LoadingText');
  });

  it('lets you set a fixed width', () => {
    const root = render({ width: 40 });
    expect(root).toHaveClassName('LoadingText--width-40');
  });

  it('lets you set a custom class name', () => {
    const root = render({ className: 'MyLoadingClass' });
    expect(root).toHaveClassName('MyLoadingClass');
  });
});
