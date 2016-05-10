import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import LoginPage from 'core/components/LoginPage';

export function mapStateToProps(state) {
  return {
    authenticated: !!state.auth.token,
  };
}

// This class is exported for testing outside of redux.
export class LoginRequired extends React.Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    children: PropTypes.node,
  }

  render() {
    const { authenticated, children } = this.props;
    if (authenticated) {
      return children;
    }
    return <LoginPage />;
  }
}

export default connect(mapStateToProps)(LoginRequired);
