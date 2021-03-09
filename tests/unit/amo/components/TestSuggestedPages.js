import * as React from 'react';

import Link from 'amo/components/Link';
import SuggestedPages, {
  SuggestedPagesBase,
} from 'amo/components/SuggestedPages';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ ...props } = {}) => {
    const allProps = { ...props, i18n: fakeI18n() };

    return shallowUntilTarget(
      <SuggestedPages {...allProps} />,
      SuggestedPagesBase,
    );
  };

  it('renders Suggested Pages', () => {
    const wrapper = render();

    expect(wrapper.text()).toContain('Suggested Pages');
    // There should be three links on the page.
    const links = wrapper.find(Link);
    expect(links).toHaveLength(3);

    expect(links.at(0)).toHaveProp('to', '/extensions/');
    expect(links.at(1)).toHaveProp('to', '/themes/');
    expect(links.at(2)).toHaveProp('to', '/');
  });
});
