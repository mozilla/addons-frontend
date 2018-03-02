import * as React from 'react';

import ReviewGuide, { ReviewGuideBase } from 'amo/components/StaticPages/ReviewGuide';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


describe('ReviewGuide', () => {
  function render() {
    return shallowUntilTarget(
      <ReviewGuide i18n={fakeI18n()} />,
      ReviewGuideBase,
    );
  }

  it('outputs an review guide page', () => {
    const root = render();
    expect(root).toHaveClassName('StaticPage');
    expect(root.find('#review-guide')).toBePresent();
  });
});

