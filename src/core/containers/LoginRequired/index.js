import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import LoginPage from 'core/components/LoginPage';

export function mapStateToProps(Component) {
  return (state) => ({
    authenticated: !!state.auth.token,
    Component,
  });
}

export class LoginRequired extends React.Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    // This is really a react component class but I guess that's a function.
    Component: PropTypes.func.isRequired,
  }

  render() {
    const { authenticated, Component, ...childProps } = this.props;
    if (authenticated) {
      return <Component {...childProps} />;
    }
    return <LoginPage />;
  }
}

export default function loginRequired(Component) {
  return connect(mapStateToProps(Component))(LoginRequired);
}
