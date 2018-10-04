import * as React from 'react';

import About, { AboutBase } from 'amo/pages/StaticPages/About';
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
      <About store={store} i18n={i18n} {...props} />,
      AboutBase,
    );
  }

  it('outputs an about page', () => {
    const root = render();
    expect(root).toHaveClassName('StaticPage');
    expect(root.find('#about')).toExist();
  });

  it('renders a canonical link tag', () => {
    const baseURL = 'https://example.org';
    const _config = getFakeConfig({ baseURL });

    const pathname = '/some-about-pathname';
    const { store } = dispatchClientMetadata({ pathname });

    const root = render({ _config, store });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp(
      'href',
      `${baseURL}${pathname}`,
    );
  });
});
