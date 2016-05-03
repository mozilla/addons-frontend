import React, { PropTypes } from 'react';

import { startLoginUrl } from 'core/api';
import { gettext as _ } from 'core/utils';

export default class LoginPage extends React.Component {
  static propTypes = {
    message: PropTypes.string,
  }

  render() {
    const { message } = this.props;
    return (
      <div>
        <h1>{_('Login Required')}</h1>
        <p className="login-message">
          {message || _('You must be logged in to access this page.')}
        </p>
        <p>
          <a className="button" href={startLoginUrl()}>
            {_('Login')}
          </a>
        </p>
      </div>
    );
  }
}
