import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import LoginPage from 'core/components/LoginPage';
import { getCurrentUser } from 'amo/reducers/users';

// This class is exported for testing outside of redux.
export class LoginRequiredBase extends React.Component {
  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    children: PropTypes.node,
    location: PropTypes.object,
  };

  render() {
    const { authenticated, children, location } = this.props;
    if (authenticated) {
      return children;
    }
    return <LoginPage location={location} />;
  }
}

export function mapStateToProps(state) {
  return {
    authenticated: !!getCurrentUser(state.users),
  };
}

export default compose(connect(mapStateToProps))(LoginRequiredBase);
