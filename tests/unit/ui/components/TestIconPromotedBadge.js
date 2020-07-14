import { shallow } from 'enzyme';
import * as React from 'react';

import Icon from 'ui/components/Icon';
import IconPromotedBadge, { paths } from 'ui/components/IconPromotedBadge';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props = {
      category: 'line',
      size: 'large',
      ...moreProps,
    };
    return shallow(<IconPromotedBadge {...props} />);
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

      expect(root.find('circle')).toHaveClassName(
        `IconPromotedBadge-shellPath--${category}`,
      );
      expect(root.find('path')).toHaveClassName(
        `IconPromotedBadge-iconPath--${category}`,
      );
    },
  );

  it.each(['line', 'recommended', 'verified'])(
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

  it('adds an alt property', () => {
    const alt = 'This is a badge';
    const root = render({ alt });

    expect(root.find(Icon)).toHaveProp('alt', alt);
  });
});
