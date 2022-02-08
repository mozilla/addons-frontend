import * as React from 'react';
import { shallow } from 'enzyme';

import Icon from 'amo/components/Icon';
import { render } from 'tests/unit/helpers';

describe(__filename, () => {
  it('maps the name to a className', () => {
    const root = shallow(<Icon name="foo" />);

    expect(root).toHaveClassName('Icon');
    expect(root).toHaveClassName('Icon-foo');
  });

  it('maps the name to a className-rtl', () => {
    const { root } = render(<Icon name="foo" />);
    expect(root).toHaveClass('Icon');
    expect(root).toHaveClass('Icon-foo');
  });

  it('allows a custom className', () => {
    const root = shallow(<Icon name="bar" className="sup" />);

    expect(root).toHaveClassName('Icon');
    expect(root).toHaveClassName('Icon-bar');
    expect(root).toHaveClassName('sup');
  });

  it('allows a custom className-rtl', () => {
    const { root } = render(<Icon name="bar" className="sup" />);

    expect(root).toHaveClass('Icon');
    expect(root).toHaveClass('Icon-bar');
    expect(root).toHaveClass('sup');
  });

  it('renders alt-text as a visually hidden span', () => {
    const alt = 'Alt text!';
    const root = shallow(<Icon alt={alt} name="bar" />);

    expect(root.find('.visually-hidden')).toHaveText(alt);
  });

  it('renders alt-text as a visually hidden span-rtl', () => {
    const alt = 'Alt text!';
    const { getByText } = render(<Icon alt={alt} name="bar" />);
    expect(getByText(alt)).toHaveClass('visually-hidden');
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

  it('renders alt text and children-rtl', () => {
    const alt = 'Alt text!';
    const childText = 'Some child text';
    const { getByText } = render(
      <Icon alt={alt} name="bar">
        <span>{childText}</span>
      </Icon>,
    );
    expect(getByText(alt)).toHaveClass('visually-hidden');
    expect(getByText(childText)).toBeInTheDocument();
  });
});
