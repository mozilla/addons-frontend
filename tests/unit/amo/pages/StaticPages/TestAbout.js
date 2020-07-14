import * as React from 'react';

import About, { AboutBase } from 'amo/pages/StaticPages/About';
import StaticPage from 'amo/components/StaticPage';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ i18n = fakeI18n(), ...props } = {}) {
    return shallowUntilTarget(<About i18n={i18n} {...props} />, AboutBase);
  }

  it('outputs an about page', () => {
    const root = render();

    expect(root.find('#about')).toExist();
  });

  it('renders a StaticPage component', () => {
    const root = render();

    expect(root.find(StaticPage)).toHaveLength(1);
  });
});
