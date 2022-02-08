import * as React from 'react';

import Badge from 'amo/components/Badge';
import Icon from 'amo/components/Icon';
import { render } from 'tests/unit/helpers';

jest.mock('amo/components/Icon', () => {
  return jest.fn(() => null);
});

describe(__filename, () => {
  it('renders a badge', () => {
    const label = 'badge label';
    const { getByText, root } = render(<Badge label={label} />);
    expect(root).toHaveClass('Badge');
    expect(getByText(label)).toBeInTheDocument();
    expect(Icon).not.toHaveBeenCalled();
  });

  it('can override the icon label', () => {
    const label = 'foo';
    render(<Badge type="experimental" label={label} />);

    // The extra empty object is the context passed to the component.
    // I could create a matcher like toHaveProp which encapsulates this.
    expect(Icon).toHaveBeenCalledWith(
      expect.objectContaining({ alt: label }),
      {},
    );
  });

  it('displays the experimental badge icon for type `experimental`', () => {
    const label = 'experimental';
    const { root } = render(<Badge type="experimental" label={label} />);

    expect(root).toHaveClass('Badge');
    expect(root).toHaveClass('Badge-experimental');
    expect(root).toHaveTextContent(label);
    expect(Icon).toHaveBeenCalledWith(
      { alt: label, name: 'experimental-badge' },
      {},
    );
  });

  it('displays the payment required badge icon for type `requires-payment`', () => {
    const label = 'label text';
    const { root } = render(<Badge type="requires-payment" label={label} />);

    expect(root).toHaveClass('Badge');
    expect(root).toHaveClass('Badge-requires-payment');
    expect(root).toHaveTextContent(label);
    expect(Icon).toHaveBeenCalledWith(
      { alt: label, name: 'requires-payment' },
      {},
    );
  });

  it('throws an error if invalid type is supplied', () => {
    expect(() => {
      render(<Badge type="invalid" label="foo" />);
    }).toThrowError(/Invalid badge type given: "invalid"/);
  });
});
