import * as React from 'react';

import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Icon from 'amo/components/Icon';
import IconPromotedBadge, {
  IconPromotedBadgeBase,
  paths,
} from 'amo/components/IconPromotedBadge';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props = {
      category: 'line',
      i18n: fakeI18n(),
      size: 'large',
      ...moreProps,
    };
    return shallowUntilTarget(
      <IconPromotedBadge {...props} />,
      IconPromotedBadgeBase,
    );
  };

  it.each([
    ['IconPromotedBadge-large', 'large'],
    ['IconPromotedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s"', (className, size) => {
    const root = render({ size });

    expect(root).toHaveClassName(className);
  });

  it.each(['recommended', 'verified'])(
    'adds the expected classes for category="%s"',
    (category) => {
      const root = render({ category });

      expect(root.find('circle').at(0)).toHaveClassName(
        `IconPromotedBadge-circle-bgColor--${category}`,
      );
      expect(root.find('path')).toHaveClassName(
        `IconPromotedBadge-iconPath--${category}`,
      );
    },
  );

  it.each(['recommended', 'verified'])(
    'uses the expected path for category="%s"',
    (category) => {
      const root = render({ category });

      expect(root.find('path')).toHaveProp('d', paths[category]);
    },
  );

  it('adds a custom class', () => {
    const className = 'MyCoolBadge';
    const root = render({ className });

    expect(root).toHaveClassName(className);
  });

  it.each([
    ['line', 'By Firefox'],
    ['recommended', 'Recommended'],
    ['verified', 'Verified'],
  ])(
    'adds an alt property for category="%s" when showAlt is true',
    (category, alt) => {
      const root = render({ category, showAlt: true });

      expect(root.find(Icon)).toHaveProp('alt', alt);
    },
  );

  it('does not add an alt property showAlt is false', () => {
    const root = render({ showAlt: false });

    expect(root.find(Icon)).toHaveProp('alt', undefined);
  });

  it.each(['recommended', 'verified'])(
    'sets the icon with category="%s" to inline content',
    (category) => {
      const root = render({ category });

      expect(root).toHaveProp('name', 'inline-content');
    },
  );

  it('does not use inline-content but a real icon (image) for the category="line"', () => {
    const root = render({ category: 'line' });

    expect(root).toHaveProp('name', 'line');
  });
});
