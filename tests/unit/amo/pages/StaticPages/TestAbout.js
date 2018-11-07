import * as React from 'react';

import About, { AboutBase } from 'amo/pages/StaticPages/About';
import HeadLinks from 'amo/components/HeadLinks';
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

  it('renders a "description" meta tag', () => {
    const root = render();

    expect(root.find('meta[name="description"]')).toHaveLength(1);
    expect(root.find('meta[name="description"]').prop('content')).toMatch(
      /The official Mozilla site/,
    );
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
    expect(root.find(HeadLinks)).toHaveProp('to', '/about');
    expect(root.find(HeadLinks)).toHaveProp('prependClientApp', false);
  });
});
