import React from 'react';

import { NavBar, NavBarLink } from 'core/components/NavBar';
import AdminNavBar from 'admin/components/NavBar';
import { shallowRender } from 'tests/client/helpers';

describe('<AdminNavBar />', () => {
  it('renders a link to Search', () => {
    const root = shallowRender(<AdminNavBar />);
    assert.equal(root.type, NavBar);
    const link = root.props.children;
    assert.equal(link.type, NavBarLink);
    assert.equal(link.props.to, '/search');
    assert.equal(link.props.children, 'Search');
  });
});
