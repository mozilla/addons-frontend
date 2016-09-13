import React, { PropTypes } from 'react';
import cookie from 'react-cookie';
import { connect } from 'react-redux';
import config from 'config';

import { setJWT } from 'core/actions';
import { login } from 'core/api';
import LoginPage from 'core/components/LoginPage';
import log from 'core/logger';
import { browserBase64Decode, gettext as _ } from 'core/utils';

class HandleLogin extends React.Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    loadData: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
  }

  static contextTypes = {
    router: PropTypes.object.isRequired,
  }

  state = {
    error: false,
  }

  componentDidMount() {
    const { api, loadData, location } = this.props;
    const { router } = this.context;
    loadData({ api, location, router }).catch(() => {
      this.setState({ error: true });
    });
  }

  render() {
    const { location } = this.props;
    const { code, state } = location.query;
    const { error } = this.state;
    if (!error && code && state) {
      return (
        <div>
          <p>{_('Logging you in...')}</p>
        </div>
      );
    }
    return (
      <LoginPage
        message={_('There was an error logging you in, please try again.')}
        location={location}
      />
    );
  }
}

function createLoadData(dispatch) {
  return ({ api, location, router }) => {
    const { code, state } = location.query;
    if (code && state) {
      return login({ api, code, state })
        .then(({ token }) => {
          dispatch(setJWT(token));
          cookie.save(config.get('cookieName'), token, {
            path: '/',
            secure: config.get('cookieSecure'),
            maxAge: config.get('cookieMaxAge'),
          });
          let to;
          try {
            to = browserBase64Decode(state.split(':')[1]);
          } catch (e) {
            log.error('Could not parse next path after log in', e);
            to = '/';
          }
          router.push({ pathname: to });
        });
    }
    return Promise.resolve();
  };
}

function mapStateToProps({ api, auth }) {
  return { api, auth };
}

export function mapDispatchToProps(dispatch) {
  return {
    loadData: createLoadData(dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HandleLogin);
