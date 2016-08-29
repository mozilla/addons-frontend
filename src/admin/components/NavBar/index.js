import React, { PropTypes } from 'react';

import {
  NavBar,
  NavBarButton,
  NavBarLink,
} from 'core/components/NavBar';

const AdminNavBar = ({ authenticated, logOut }) => (
  <NavBar>
    <NavBarLink to="/search">Search</NavBarLink>
    {authenticated ? <NavBarButton onClick={logOut}>Log out</NavBarButton> : null}
  </NavBar>
);
AdminNavBar.propTypes = {
  logOut: PropTypes.func.isRequired,
  authenticated: PropTypes.bool.isRequired,
};

export default AdminNavBar;
