import * as React from 'react';

import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Icon from 'ui/components/Icon';
import IconPromotedBadge, {
  IconPromotedBadgeBase,
  paths,
} from 'ui/components/IconPromotedBadge';

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

  it.each(['line', 'recommended', 'verified'])(
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

  it('uses/adds expected elements/styles for the "line" category', () => {
    const root = render({ category: 'line' });
    expect(root.find('defs')).toHaveLength(1);
    expect(root.find('circle')).toHaveLength(2);
    expect(root.find('g')).toHaveProp('style');
    expect(root.find('path')).toHaveLength(13);
    expect(
      root
        .find('path')
        .everyWhere((node) => node.hasClass('IconPromotedBadge-iconPath')),
    ).toEqual(true);
    expect(
      root
        .find('path')
        .everyWhere((node) =>
          node.hasClass('IconPromotedBadge-iconPath--line'),
        ),
    ).toEqual(true);
  });

  it.each(['recommended', 'verified'])(
    'uses/exludes expected elements for for category="%s"',
    (category) => {
      const root = render({ category });
      expect(root.find('defs')).toHaveLength(0);
      expect(root.find('circle')).toHaveLength(1);
      expect(root.find('g')).not.toHaveProp('style');
      expect(root.find('path')).toHaveLength(1);
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
});
