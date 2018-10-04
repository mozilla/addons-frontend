import * as React from 'react';

import ReviewGuide, {
  ReviewGuideBase,
} from 'amo/pages/StaticPages/ReviewGuide';
import {
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  function render({
    store = dispatchClientMetadata().store,
    i18n = fakeI18n(),
    ...props
  } = {}) {
    return shallowUntilTarget(
      <ReviewGuide store={store} i18n={i18n} {...props} />,
      ReviewGuideBase,
    );
  }

  it('outputs an review guide page', () => {
    const root = render();
    expect(root).toHaveClassName('StaticPage');
    expect(root.find('#review-guide')).toExist();
  });
});
