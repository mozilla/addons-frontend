import React, { PropTypes } from 'react';
import cookie from 'react-cookie';
import { connect } from 'react-redux';

import config from 'config';
import { setJWT } from 'core/actions';
import { login } from 'core/api';
import LoginPage from 'core/components/LoginPage';
import { gettext as _ } from 'core/utils';

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
    loadData({api, location, router}).catch(() => {
      this.setState({error: true});
    });
  }

  render() {
    const { code, state } = this.props.location.query;
    const { error } = this.state;
    if (!error && code && state) {
      return (
        <div>
          <p>{_('Logging you in...')}</p>
        </div>
      );
    }
    return <LoginPage message={_('There was an error logging you in, please try again.')} />;
  }
}

function createLoadData(dispatch) {
  return ({api, location, router}) => {
    const { code, state } = location.query;
    if (code && state) {
      return login({api, code, state})
        .then(({token}) => {
          dispatch(setJWT(token));
          console.log(JSON.stringify({
            cookieName: config.get('cookieName'),
            cookieSecure: config.get('cookieSecure'),
            cookieMaxAge: config.get('cookieMaxAge'),
            cookie: config.get('cookie'),
          }));
          cookie.save(config.get('cookieName'), token, {
            path: '/',
            secure: config.get('cookieSecure'),
            maxAge: config.get('cookieMaxAge'),
          });
          router.push('/search');
        });
    }
    return Promise.resolve();
  };
}

function mapStateToProps({api, auth}) {
  return {api, auth};
}

export function mapDispatchToProps(dispatch) {
  return {
    loadData: createLoadData(dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HandleLogin);
