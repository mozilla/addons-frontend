import * as React from 'react';

import CategoryIcon from 'amo/components/CategoryIcon';
import { render, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  it('renders an Icon and sets CSS classes', () => {
    render(<CategoryIcon name="foo" color="1" />);

    const icon = screen.getByClassName('Icon');
    expect(icon).toHaveClass('CategoryIcon');
    expect(icon).toHaveClass('CategoryIcon-1');
  });

  it('allows a custom className', () => {
    render(<CategoryIcon name="bar" color="1" className="sup" />);

    const icon = screen.getByClassName('Icon');
    expect(icon).toHaveClass('CategoryIcon');
    expect(icon).toHaveClass('CategoryIcon-1');
    expect(icon).toHaveClass('sup');
  });

  it('passes alt-text to the Icon', () => {
    render(<CategoryIcon name="bar" color="1" alt="Alt text!" />);

    expect(screen.getByText('Alt text!')).toBeInTheDocument();
  });

  it('passes name to the Icon', () => {
    render(<CategoryIcon name="bar" color="1" alt="Alt text!" />);

    const icon = screen.getByClassName('Icon');
    expect(icon).toHaveClass('Icon-bar');
  });
});
