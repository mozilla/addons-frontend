import * as React from 'react';

import ReviewGuide, {
  ReviewGuideBase,
} from 'amo/pages/StaticPages/ReviewGuide';
import {
  dispatchClientMetadata,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

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

  it('renders a canonical link tag', () => {
    const baseURL = 'https://example.org';
    const _config = getFakeConfig({ baseURL });

    const pathname = '/some-review-guide-pathname';
    const { store } = dispatchClientMetadata({ pathname });

    const root = render({ _config, store });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp(
      'href',
      `${baseURL}${pathname}`,
    );
  });

  it('renders a "description" meta tag', () => {
    const root = render();

    expect(root.find('meta[name="description"]')).toHaveLength(1);
    expect(root.find('meta[name="description"]').prop('content')).toMatch(
      /Guidelines, tips, and/,
    );
  });
});
