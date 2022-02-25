import * as React from 'react';

import Icon from 'amo/components/Icon';
import { render, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  it('maps the name to a className', () => {
    const { root } = render(<Icon name="foo" />);
    expect(root).toHaveClass('Icon');
    expect(root).toHaveClass('Icon-foo');
  });

  it('allows a custom className', () => {
    const { root } = render(<Icon name="bar" className="sup" />);

    expect(root).toHaveClass('Icon');
    expect(root).toHaveClass('Icon-bar');
    expect(root).toHaveClass('sup');
  });

  it('renders alt-text as a visually hidden span', () => {
    const alt = 'Alt text!';
    render(<Icon alt={alt} name="bar" />);
    expect(screen.getByText(alt)).toHaveClass('visually-hidden');
  });

  it('renders alt text and children', () => {
    const alt = 'Alt text!';
    const childText = 'Some child text';
    render(
      <Icon alt={alt} name="bar">
        <span>{childText}</span>
      </Icon>,
    );
    expect(screen.getByText(alt)).toHaveClass('visually-hidden');
    expect(screen.getByText(childText)).toBeInTheDocument();
  });
});
