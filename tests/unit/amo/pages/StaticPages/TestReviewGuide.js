import * as React from 'react';

import ReviewGuide, {
  ReviewGuideBase,
} from 'amo/pages/StaticPages/ReviewGuide';
import StaticPage from 'amo/components/StaticPage';
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

    expect(root.find('#review-guide')).toExist();
  });

  it('renders a StaticPage component', () => {
    const root = render();

    expect(root.find(StaticPage)).toHaveLength(1);
  });
});
