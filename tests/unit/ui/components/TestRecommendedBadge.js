import * as React from 'react';

import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
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

  it('calls onClick after clicking on the link', () => {
    const clickEvent = createFakeEvent();
    const onClick = sinon.spy();
    const root = render({ onClick });
    root.find('.RecommendedBadge-link').simulate('click', clickEvent);

    sinon.assert.calledWith(onClick, clickEvent);
  });
});
