import React from 'react';

import Icon from 'ui/components/Icon';
import { shallowRender } from 'tests/client/helpers';

describe('<Icon />', () => {
  it('maps the name to a className', () => {
    const root = shallowRender(<Icon name="foo" />);
    assert.equal(root.props.className, 'Icon Icon-foo');
  });

  it('allows a custom className', () => {
    const root = shallowRender(<Icon name="bar" className="sup" />);
    assert.equal(root.props.className, 'Icon Icon-bar sup');
  });
});
