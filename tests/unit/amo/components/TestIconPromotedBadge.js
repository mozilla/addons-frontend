import * as React from 'react';

import IconPromotedBadge, { paths } from 'amo/components/IconPromotedBadge';
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

  it.each(['recommended', 'verified'])(
    'adds the expected classes for category="%s"',
    (category) => {
      render({ category });

      expect(screen.getByTagName('circle')).toHaveClass(
        `IconPromotedBadge-circle-bgColor--${category}`,
      );
      expect(screen.getByTagName('path')).toHaveClass(
        `IconPromotedBadge-iconPath--${category}`,
      );
    },
  );

  it.each(['recommended', 'verified'])(
    'uses the expected path for category="%s"',
    (category) => {
      render({ category });

      expect(screen.getByTagName('path')).toHaveAttribute('d', paths[category]);
    },
  );

  it('adds a custom class', () => {
    const className = 'MyCoolBadge';
    const { root } = render({ className });

    expect(root).toHaveClass(className);
  });

  it.each([
    ['line', 'By Firefox'],
    ['recommended', 'Recommended'],
    ['verified', 'Verified'],
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
    expect(screen.queryByClassName('visually-hidden')).toHaveLength(0);
  });

  it.each(['recommended', 'verified'])(
    'sets the icon with category="%s" to inline content',
    (category) => {
      const { root } = render({ category });

      expect(root).toHaveClass('Icon-inline-content');
    },
  );

  it('does not use inline-content but a real icon (image) for the category="line"', () => {
    const { root } = render({ category: 'line' });

    expect(root).toHaveClass('Icon-line');
  });
});
