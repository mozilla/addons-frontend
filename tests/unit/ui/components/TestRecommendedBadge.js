import * as React from 'react';

import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import RecommendedBadge, {
  RecommendedBadgeBase,
} from 'ui/components/RecommendedBadge';
import Icon from 'ui/components/Icon';

describe(__filename, () => {
  it('renders a badge', () => {
    const badge = shallowUntilTarget(
      <RecommendedBadge i18n={fakeI18n()} />,
      RecommendedBadgeBase,
    );

    const link = badge.find('.RecommendedBadge-link');
    expect(link.find(Icon)).toHaveProp('alt', 'Recommended');
    expect(link.childAt(1)).toIncludeText('Recommended');
  });
});
