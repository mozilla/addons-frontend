import React from 'react';

import { NavBar, NavBarLink } from 'core/components/NavBar';
import SearchNavBar from 'search/components/NavBar';
import { shallowRender } from 'tests/client/helpers';

describe('<SearchNavBar />', () => {
  it('renders a link to Search', () => {
    const root = shallowRender(<SearchNavBar />);
    assert.equal(root.type, NavBar);
    const link = root.props.children;
    assert.equal(link.type, NavBarLink);
    assert.equal(link.props.to, '/search');
    assert.equal(link.props.children, 'Search');
  });
});
