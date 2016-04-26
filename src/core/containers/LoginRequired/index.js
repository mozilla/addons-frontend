import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import config from 'config';
import { gettext as _ } from 'core/utils';

function mapStateToProps(Component) {
  return (state) => ({
    authenticated: !!state.auth.token,
    Component,
  });
}

class LoginRequired extends React.Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    Component: PropTypes.node.isRequired,
  }

  render() {
    const { authenticated, Component, ...childProps } = this.props;
    if (authenticated) {
      return <Component {...childProps} />;
    }
    return (
      <div>
        <h1>{_('Login Required')}</h1>
        <p>{_('You must be logged in to access this page.')}</p>
        <p>
          <a className="button" href={config.get('startLoginUrl')}>
            {_('Login')}
          </a>
        </p>
      </div>
    );
  }
}

export default function loginRequired(Component) {
  return connect(mapStateToProps(Component))(LoginRequired);
}
