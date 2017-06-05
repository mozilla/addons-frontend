import React from 'react';

import Icon from 'ui/components/Icon';
import { shallowRender } from 'tests/unit/helpers';

describe('<Icon />', () => {
  it('maps the name to a className', () => {
    const root = shallowRender(<Icon name="foo" />);
    expect(root.props.className).toEqual('Icon Icon-foo');
  });

  it('allows a custom className', () => {
    const root = shallowRender(<Icon name="bar" className="sup" />);
    expect(root.props.className).toEqual('Icon Icon-bar sup');
  });
});
