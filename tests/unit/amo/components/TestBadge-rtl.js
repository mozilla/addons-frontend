import * as React from 'react';

import Badge from 'amo/components/Badge';
import { render } from 'tests/unit/helpers';

describe(__filename, () => {
  it('renders a badge', () => {
    const label = 'badge label';
    const { getByText, root } = render(<Badge label={label} />);
    expect(root).toHaveClass('Badge');
    expect(getByText(label)).toBeInTheDocument();
    // Not sure how to assert something isn't in the document, if not targeting directly by classname.
    // expect(badge.find(Icon)).toHaveLength(0);
  });

  it('can override the icon label', () => {
    const label = 'foo';
    const { getAllByText } = render(
      <Badge type="experimental" label={label} />,
    );

    // This is a pretty ridiculous way of writing this test, but seems to be
    // the way ReactTestingLibrary would want it.
    //
    // A big problem with this is that we need to understand the Icon component
    // from within this test, and in a way we are actually testing the
    // implementation of the Icon component here, which is what RTL is apparently
    // trying to avoid.
    //
    // And we're still using classNames, which I think is also frowned upon.
    expect(
      getAllByText(label).some((element) =>
        element.classList.contains('visually-hidden'),
      ),
    ).toEqual(true);
  });

  it('displays the experimental badge icon for type `experimental`', () => {
    const label = 'experimental';
    const { debug, getByClassName, getAllByText, root } = render(
      <Badge type="experimental" label={label} />,
    );
    debug();
    expect(root).toHaveClass('Badge');
    expect(root).toHaveClass('Badge-experimental');
    expect(getAllByText(label).length).toEqual(2);
    expect(getByClassName('Icon-experimental-badge')).toHaveTextContent(label);
  });

  it('displays the payment required badge icon for type `requires-payment`', () => {
    const label = 'label text';
    const { getByClassName, getAllByText, root } = render(
      <Badge type="requires-payment" label={label} />,
    );
    expect(root).toHaveClass('Badge');
    expect(root).toHaveClass('Badge-requires-payment');
    expect(getAllByText(label).length).toEqual(2);
    expect(getByClassName('Icon-requires-payment')).toHaveTextContent(label);
  });

  it('throws an error if invalid type is supplied', () => {
    expect(() => {
      render(<Badge type="invalid" label="foo" />);
    }).toThrowError(/Invalid badge type given: "invalid"/);
  });
});
