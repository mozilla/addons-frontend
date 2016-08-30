import React, { PropTypes } from 'react';

import {
  NavBar,
  NavBarLink,
} from 'core/components/NavBar';

const AdminNavBar = () => (
  <NavBar>
    <NavBarLink to="/search">Search</NavBarLink>
  </NavBar>
);
AdminNavBar.propTypes = {
  logout: PropTypes.func.isRequired,
};

export default AdminNavBar;
