import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';

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
        <Helmet
          defaultTitle={_('Add-ons Search')}
        />
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
  handleLogOut: () => ({ type: 'LOG_OUT_USER' }),
};

export default connect(mapStateToProps, mapDispatchToProps)(AppBase);
