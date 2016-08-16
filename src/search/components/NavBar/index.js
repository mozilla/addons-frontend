import React, { PropTypes } from 'react';

import {
  NavBar,
  NavBarLink,
} from 'core/components/NavBar';

const SearchNavBar = () => (
  <NavBar>
    <NavBarLink to="/search">Search</NavBarLink>
  </NavBar>
);
SearchNavBar.propTypes = {
  logout: PropTypes.func.isRequired,
};

export default SearchNavBar;
