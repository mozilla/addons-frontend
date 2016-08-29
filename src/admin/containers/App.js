import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';

import { gettext as _ } from 'core/utils';
import NavBar from 'admin/components/NavBar';

import 'admin/css/App.scss';

export class AppBase extends React.Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    children: PropTypes.node,
    logOut: PropTypes.func.isRequired,
  }

  render() {
    const { authenticated, children, logOut } = this.props;
    return (
      <div className="search-page">
        <Helmet
          defaultTitle={_('Add-ons Search')}
        />
        <NavBar authenticated={authenticated} logOut={logOut} />
        <div className="App">
          {children}
        </div>
      </div>
    );
  }
}

export const mapStateToProps = (state) => ({
  authenticated: !!state.auth.token,
});

export const mapDispatchToProps = {
  logOut: () => ({ type: 'LOG_OUT_USER' }),
};

export default connect(mapStateToProps, mapDispatchToProps)(AppBase);
