import * as React from 'react';

import About, { AboutBase } from 'amo/components/StaticPages/About';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  function render() {
    return shallowUntilTarget(<About i18n={fakeI18n()} />, AboutBase);
  }

  it('outputs an about page', () => {
    const root = render();
    expect(root).toHaveClassName('StaticPage');
    expect(root.find('#about')).toExist();
  });
});
