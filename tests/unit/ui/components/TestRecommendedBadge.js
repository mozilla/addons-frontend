import * as React from 'react';

import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import RecommendedBadge, {
  RecommendedBadgeBase,
} from 'ui/components/RecommendedBadge';
import Icon from 'ui/components/Icon';

describe(__filename, () => {
  it('renders a badge', () => {
    const root = shallowUntilTarget(
      <RecommendedBadge i18n={fakeI18n()} />,
      RecommendedBadgeBase,
    );
    const label = 'Recommended';

    expect(root.find(Icon)).toHaveProp('alt', label);
    expect(root.find('.RecommendedBadge-label')).toIncludeText(label);
  });
});
