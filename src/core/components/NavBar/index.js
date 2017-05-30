import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import 'core/components/NavBar/styles.scss';


export const NavBarItem = ({ children }) => (
  <span className="NavBarItem">{children}</span>
);
NavBarItem.propTypes = {
  children: PropTypes.node,
};

export const NavBarButton = ({ children, ...props }) => (
  <NavBarItem>
    <button {...props} className="NavBarButton">{children}</button>
  </NavBarItem>
);
NavBarButton.propTypes = {
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

export const NavBar = ({ children }) => (
  <div className="NavBar">{children}</div>
);
NavBar.propTypes = {
  children: PropTypes.node,
};
