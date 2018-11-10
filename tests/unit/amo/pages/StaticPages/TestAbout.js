import * as React from 'react';

import About, { AboutBase } from 'amo/pages/StaticPages/About';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ i18n = fakeI18n(), ...props } = {}) {
    return shallowUntilTarget(<About i18n={i18n} {...props} />, AboutBase);
  }

  it('outputs an about page', () => {
    const root = render();
    expect(root).toHaveClassName('StaticPage');
    expect(root.find('#about')).toExist();
  });

  it('renders a HeadMetaTags component', () => {
    const root = render();

    expect(root.find(HeadMetaTags)).toHaveLength(1);
    expect(root.find(HeadMetaTags).prop('title')).toEqual(
      'About Firefox Add-ons',
    );
    expect(root.find(HeadMetaTags).prop('description')).toMatch(
      /The official Mozilla site/,
    );
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });
});
