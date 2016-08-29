import React from 'react';

import { NavBar, NavBarLink } from 'core/components/NavBar';
import AdminNavBar from 'admin/components/NavBar';
import { shallowRender } from 'tests/client/helpers';

describe('<AdminNavBar />', () => {
  it('renders a link to Search but not log out unauthenticated', () => {
    const root = shallowRender(<AdminNavBar authenticated={false} />);
    assert.equal(root.type, NavBar);
    const link = root.props.children[0];
    assert.equal(link.type, NavBarLink);
    assert.equal(link.props.to, '/search');
    assert.equal(link.props.children, 'Search');
  });

  it('renders a link to Search and log out authenticated', () => {
    const logOut = sinon.spy();
    const root = shallowRender(<AdminNavBar authenticated logOut={logOut} />);
    assert.equal(root.type, NavBar);
    const link = root.props.children[0];
    assert.equal(link.type, NavBarLink);
    assert.equal(link.props.to, '/search');
    assert.equal(link.props.children, 'Search');
    const logOutButton = root.props.children[1];
    assert.strictEqual(logOutButton.props.onClick, logOut);
  });
});
