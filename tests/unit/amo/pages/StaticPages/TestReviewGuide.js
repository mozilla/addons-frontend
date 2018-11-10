import * as React from 'react';

import ReviewGuide, {
  ReviewGuideBase,
} from 'amo/pages/StaticPages/ReviewGuide';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ i18n = fakeI18n(), ...props } = {}) {
    return shallowUntilTarget(
      <ReviewGuide i18n={i18n} {...props} />,
      ReviewGuideBase,
    );
  }

  it('outputs an review guide page', () => {
    const root = render();
    expect(root).toHaveClassName('StaticPage');
    expect(root.find('#review-guide')).toExist();
  });

  it('renders a HeadMetaTags component', () => {
    const root = render();

    expect(root.find(HeadMetaTags)).toHaveLength(1);
    expect(root.find(HeadMetaTags).prop('title')).toEqual('Review Guidelines');
    expect(root.find(HeadMetaTags).prop('description')).toMatch(
      /Guidelines, tips, and/,
    );
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });
});
