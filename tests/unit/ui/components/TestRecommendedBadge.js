import * as React from 'react';

import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import RecommendedBadge, {
  RecommendedBadgeBase,
} from 'ui/components/RecommendedBadge';

describe(__filename, () => {
  const render = (moreProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      size: 'large',
      ...moreProps,
    };
    return shallowUntilTarget(
      <RecommendedBadge {...props} />,
      RecommendedBadgeBase,
    );
  };

  it.each([
    ['RecommendedBadge-large', 'large'],
    ['RecommendedBadge-small', 'small'],
  ])('adds the class "%s" for size="%s"', (className, size) => {
    const root = render({ size });

    expect(root).toHaveClassName(className);
  });

  it('throws for unknown sizes', () => {
    expect(() => render({ size: 'clownShoesBig' })).toThrow(/Unknown size/);
  });
});
