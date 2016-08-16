import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import 'core/components/NavBar/styles.scss';

export const NavBarItem = ({ children }) => <span className="NavBarItem">{children}</span>;
NavBarItem.propTypes = {
  children: PropTypes.node,
};

export const NavBarLink = ({ children, ...props }) => (
  <NavBarItem>
    <Link {...props} className="NavBarLink">{children}</Link>
  </NavBarItem>
);
NavBarLink.propTypes = {
  children: PropTypes.node,
};

export const NavBar = ({ children }) => <div className="NavBar">{children}</div>;
NavBar.propTypes = {
  children: PropTypes.node,
};
