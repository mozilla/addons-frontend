import * as React from 'react';
import { shallow } from 'enzyme';

import AppBanner from 'amo/components/AppBanner';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<AppBanner {...props} />);
  };

  it('allows for a custom className', () => {
    const className = 'some-custom-className';

    const root = render({ className });

    expect(root).toHaveClassName('AppBanner');
    expect(root).toHaveClassName(className);
  });
});
