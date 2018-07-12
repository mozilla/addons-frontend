import * as React from 'react';
import { shallow } from 'enzyme';

import Icon from 'ui/components/Icon';

describe(__filename, () => {
  it('maps the name to a className', () => {
    const root = shallow(<Icon name="foo" />);

    expect(root).toHaveClassName('Icon');
    expect(root).toHaveClassName('Icon-foo');
  });

  it('allows a custom className', () => {
    const root = shallow(<Icon name="bar" className="sup" />);

    expect(root).toHaveClassName('Icon');
    expect(root).toHaveClassName('Icon-bar');
    expect(root).toHaveClassName('sup');
  });

  it('renders alt-text as a visually hidden span', () => {
    const alt = 'Alt text!';
    const root = shallow(<Icon alt={alt} name="bar" />);

    expect(root.find('.visually-hidden')).toHaveText(alt);
  });

  it('renders alt text and children', () => {
    const alt = 'click to close';
    const root = shallow(
      <Icon alt={alt} name="bar">
        <div className="thing" />
      </Icon>,
    );

    expect(root.find('.visually-hidden')).toHaveText(alt);
    expect(root.find('.thing')).toHaveLength(1);
  });
});
