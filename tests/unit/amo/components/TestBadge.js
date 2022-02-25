import * as React from 'react';

import Badge from 'amo/components/Badge';
import { render, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  it('renders a badge', () => {
    const label = 'badge label';
    const { root } = render(<Badge label={label} />);

    expect(root).toHaveClass('Badge');
    expect(screen.queryByClassName('Icon')).not.toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('can override the icon label', () => {
    const label = 'foo';
    render(<Badge type="experimental" label={label} />);

    // The label will appear twice because of the output of Icon.
    expect(screen.getAllByText(label)).toHaveLength(2);
  });

  it('displays the experimental badge icon for type `experimental`', () => {
    const label = 'experimental';
    const { root } = render(<Badge type="experimental" label={label} />);

    expect(root).toHaveClass('Badge');
    expect(root).toHaveClass('Badge-experimental');
    expect(screen.getAllByText(label).length).toEqual(2);
    expect(screen.getByClassName('Icon-experimental-badge')).toHaveTextContent(
      label,
    );
  });

  it('displays the payment required badge icon for type `requires-payment`', () => {
    const label = 'label text';
    const { root } = render(<Badge type="requires-payment" label={label} />);

    expect(root).toHaveClass('Badge');
    expect(root).toHaveClass('Badge-requires-payment');
    expect(screen.getAllByText(label).length).toEqual(2);
    expect(screen.getByClassName('Icon-requires-payment')).toHaveTextContent(
      label,
    );
  });

  it('throws an error if invalid type is supplied', () => {
    expect(() => {
      render(<Badge type="invalid" label="foo" />);
    }).toThrowError(/Invalid badge type given: "invalid"/);
  });
});
