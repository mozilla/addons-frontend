import { shallow } from 'enzyme';
import * as React from 'react';

import Icon from 'ui/components/Icon';
import IconRecommendedBadge from 'ui/components/IconRecommendedBadge';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props = {
      size: 'large',
      ...moreProps,
    };
    return shallow(<IconRecommendedBadge {...props} />);
  };

  it.each([
    ['IconRecommendedBadge-large', 'large'],
    ['IconRecommendedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s"', (className, size) => {
    const root = render({ size });

    expect(root).toHaveClassName(className);
  });

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
