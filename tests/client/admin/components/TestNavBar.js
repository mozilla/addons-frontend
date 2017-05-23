import React from 'react';

import { NavBar, NavBarLink } from 'core/components/NavBar';
import AdminNavBar from 'admin/components/NavBar';
import { shallowRender } from 'tests/client/helpers';

describe('<AdminNavBar />', () => {
  it('renders a link to Search but not log out unauthenticated', () => {
    const root = shallowRender(<AdminNavBar isAuthenticated={false} />);
    expect(root.type).toEqual(NavBar);
    const link = root.props.children[0];
    expect(link.type).toEqual(NavBarLink);
    expect(link.props.to).toEqual('/search');
    expect(link.props.children).toEqual('Search');
  });

  it('renders a link to Search and log out authenticated', () => {
    const handleLogOut = sinon.spy();
    const root = shallowRender(<AdminNavBar isAuthenticated handleLogOut={handleLogOut} />);
    expect(root.type).toEqual(NavBar);
    const link = root.props.children[0];
    expect(link.type).toEqual(NavBarLink);
    expect(link.props.to).toEqual('/search');
    expect(link.props.children).toEqual('Search');
    const logOutButton = root.props.children[1];
    expect(logOutButton.props.onClick).toBe(handleLogOut);
  });
});
