import React, { PropTypes } from 'react';

import {
  NavBar,
  NavBarButton,
  NavBarLink,
} from 'core/components/NavBar';

const AdminNavBar = ({ isAuthenticated, handleLogOut }) => (
  <NavBar>
    <NavBarLink to="/search">Search</NavBarLink>
    {isAuthenticated ? <NavBarButton onClick={handleLogOut}>Log out</NavBarButton> : null}
  </NavBar>
);
AdminNavBar.propTypes = {
  handleLogOut: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
};

export default AdminNavBar;
