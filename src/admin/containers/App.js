import config from 'config';
import React, { PropTypes } from 'react';
import cookie from 'react-cookie';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';

import { logOutUser } from 'core/actions';
import { gettext as _ } from 'core/utils';
import NavBar from 'admin/components/NavBar';

import 'admin/css/App.scss';

export class AppBase extends React.Component {
  static propTypes = {
    isAuthenticated: PropTypes.bool.isRequired,
    children: PropTypes.node,
    handleLogOut: PropTypes.func.isRequired,
  }

  render() {
    const { isAuthenticated, children, handleLogOut } = this.props;
    return (
      <div className="search-page">
        <Helmet defaultTitle={_('Add-ons Search')} />
        <NavBar isAuthenticated={isAuthenticated} handleLogOut={handleLogOut} />
        <div className="App">
          {children}
        </div>
      </div>
    );
  }
}

export const mapStateToProps = (state) => ({
  isAuthenticated: !!state.auth.token,
});

export const mapDispatchToProps = {
  handleLogOut: () => {
    cookie.remove(config.get('cookieName'), { path: '/' });
    return logOutUser();
  },
};

export default connect(mapStateToProps, mapDispatchToProps)(AppBase);
