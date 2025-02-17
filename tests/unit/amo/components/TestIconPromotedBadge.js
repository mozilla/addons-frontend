import * as React from 'react';

import IconPromotedBadge from 'amo/components/IconPromotedBadge';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props = {
      category: 'line',
      size: 'large',
      ...moreProps,
    };
    return defaultRender(<IconPromotedBadge {...props} />);
  };

  it.each([
    ['IconPromotedBadge-large', 'large'],
    ['IconPromotedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s"', (className, size) => {
    const { root } = render({ size });

    expect(root).toHaveClass(className);
  });

  it('adds a custom class', () => {
    const className = 'MyCoolBadge';
    const { root } = render({ className });

    expect(root).toHaveClass(className);
  });

  it.each([
    ['line', 'By Firefox'],
    ['recommended', 'Recommended'],
  ])(
    'adds an alt property for category="%s" when showAlt is true',
    (category, alt) => {
      render({ category, showAlt: true });

      expect(screen.getByText(alt)).toBeInTheDocument();
    },
  );

  it('does not add an alt property showAlt is false', () => {
    render({ showAlt: false });

    // Icon will render a <span> with a class of
    // 'visually-hidden' if an `alt` prop was passed.
    expect(screen.queryByClassName('visually-hidden')).not.toBeInTheDocument();
  });

  it('does not use inline-content but a real icon (image) for the category="recommended"', () => {
    const { root } = render({ category: 'recommended' });

    expect(root).toHaveClass('Icon-recommended');
  });

  it('does not use inline-content but a real icon (image) for the category="line"', () => {
    const { root } = render({ category: 'line' });

    expect(root).toHaveClass('Icon-line');
  });
});
